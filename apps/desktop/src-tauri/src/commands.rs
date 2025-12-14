use std::sync::Arc;
use tauri::State;
use tokio::sync::{mpsc, RwLock};

use crate::config::AppConfig;
use crate::connection::Connection;
use crate::protocol::DeviceInfo;
use crate::server::{handle_connection, Server, ServerInfo};
use crate::virtual_camera::{VirtualCamera, VirtualCameraInfo};

pub struct AppState {
    pub server: RwLock<Server>,
    pub connection: Arc<RwLock<Connection>>,
    pub virtual_camera: RwLock<VirtualCamera>,
    pub config: RwLock<AppConfig>,
    pub frame_tx: RwLock<Option<mpsc::Sender<Vec<u8>>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            server: RwLock::new(Server::new()),
            connection: Arc::new(RwLock::new(Connection::new())),
            virtual_camera: RwLock::new(VirtualCamera::new()),
            config: RwLock::new(AppConfig::load().unwrap_or_default()),
            frame_tx: RwLock::new(None),
        }
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionResult {
    session_id: String,
    device_info: DeviceInfo,
}

#[tauri::command]
pub async fn connect_to_device(
    _host: String,
    _port: u16,
    _state: State<'_, AppState>,
) -> Result<ConnectionResult, String> {
    // For now, we use the server mode where the phone connects to us
    // This command is for manual connection mode
    Err("Use start_server and scan QR code from phone".to_string())
}

#[tauri::command]
pub async fn disconnect_from_device(state: State<'_, AppState>) -> Result<(), String> {
    let mut connection = state.connection.write().await;
    connection.clear();
    Ok(())
}

#[tauri::command]
pub async fn start_server(state: State<'_, AppState>) -> Result<ServerInfo, String> {
    let port = {
        let config = state.config.read().await;
        config.default_port
    };

    // Start server and get info
    let info = {
        state.server.write().await.start(port).await.map_err(|e| e.to_string())?
    };

    // Take listener after starting
    let listener = {
        let mut server = state.server.write().await;
        server.take_listener()
    };

    // Take the listener and spawn the accept loop
    if let Some(listener) = listener {
        let connection = state.connection.clone();
        let (frame_tx, _frame_rx) = mpsc::channel::<Vec<u8>>(100);

        // Store the frame sender
        *state.frame_tx.write().await = Some(frame_tx.clone());

        tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((stream, addr)) => {
                        let conn = connection.clone();
                        let tx = frame_tx.clone();
                        tokio::spawn(async move {
                            if let Err(e) = handle_connection(stream, addr, conn, tx).await {
                                log::error!("Connection error: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        log::error!("Accept error: {}", e);
                        break;
                    }
                }
            }
        });
    }

    Ok(info)
}

#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>) -> Result<(), String> {
    let mut server = state.server.write().await;
    server.stop();
    Ok(())
}

#[tauri::command]
pub async fn get_server_info(state: State<'_, AppState>) -> Result<Option<ServerInfo>, String> {
    let server = state.server.read().await;
    Ok(server.info().map(|i| ServerInfo {
        ip: i.ip.clone(),
        port: i.port,
    }))
}

#[tauri::command]
pub async fn get_virtual_camera_status(
    state: State<'_, AppState>,
) -> Result<Option<VirtualCameraInfo>, String> {
    let camera = state.virtual_camera.read().await;
    Ok(camera.check_installed())
}

#[tauri::command]
pub async fn install_virtual_camera(state: State<'_, AppState>) -> Result<(), String> {
    let mut camera = state.virtual_camera.write().await;
    camera.install().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_virtual_camera(state: State<'_, AppState>) -> Result<(), String> {
    // Create a new channel for frames
    let (tx, rx) = mpsc::channel::<Vec<u8>>(100);

    // Store the sender
    *state.frame_tx.write().await = Some(tx);

    // Start the virtual camera with the receiver
    let mut camera = state.virtual_camera.write().await;
    camera.start(rx).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_virtual_camera(state: State<'_, AppState>) -> Result<(), String> {
    let mut camera = state.virtual_camera.write().await;
    camera.stop();
    *state.frame_tx.write().await = None;
    Ok(())
}

#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    let config = state.config.read().await;
    Ok(config.clone())
}

#[tauri::command]
pub async fn save_config(config: AppConfig, state: State<'_, AppState>) -> Result<(), String> {
    config.save().map_err(|e| e.to_string())?;
    *state.config.write().await = config;
    Ok(())
}

#[tauri::command]
pub async fn generate_qr_code(state: State<'_, AppState>) -> Result<String, String> {
    let server = state.server.read().await;
    let info = server
        .info()
        .ok_or_else(|| "Server not running".to_string())?;

    // Generate QR code data
    let qr_data = serde_json::json!({
        "type": "penmedia_pair",
        "version": "1.0",
        "ip": info.ip,
        "port": info.port,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    });

    // Generate QR code as base64 PNG
    let code = qrcode::QrCode::new(qr_data.to_string().as_bytes())
        .map_err(|e| e.to_string())?;

    let image = code.render::<image::Luma<u8>>().build();

    let mut png_bytes = Vec::new();
    image
        .write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    use base64::Engine;
    let base64 = base64::engine::general_purpose::STANDARD.encode(&png_bytes);

    Ok(format!("data:image/png;base64,{}", base64))
}
