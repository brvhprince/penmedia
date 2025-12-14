use futures_util::{SinkExt, StreamExt};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

use crate::connection::{create_handshake_ack, default_video_settings, Connection, ConnectionInfo};
use crate::error::{AppError, AppResult};
use crate::protocol::{HandshakeMessage, MessageType};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    pub ip: String,
    pub port: u16,
}

pub struct Server {
    listener: Option<TcpListener>,
    is_running: bool,
    info: Option<ServerInfo>,
}

impl Server {
    pub fn new() -> Self {
        Self {
            listener: None,
            is_running: false,
            info: None,
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_running
    }

    pub fn info(&self) -> Option<&ServerInfo> {
        self.info.as_ref()
    }

    pub async fn start(&mut self, port: u16) -> AppResult<ServerInfo> {
        if self.is_running {
            return Err(AppError::ServerError("Server already running".into()));
        }

        let addr = format!("0.0.0.0:{}", port);
        let listener = TcpListener::bind(&addr)
            .await
            .map_err(|e| AppError::ServerError(e.to_string()))?;

        let local_ip = local_ip_address::local_ip()
            .map_err(|e| AppError::ServerError(e.to_string()))?
            .to_string();

        let info = ServerInfo {
            ip: local_ip,
            port,
        };

        self.listener = Some(listener);
        self.is_running = true;
        self.info = Some(ServerInfo {
            ip: info.ip.clone(),
            port: info.port,
        });

        log::info!("Server started on {}:{}", info.ip, info.port);

        Ok(info)
    }

    pub fn stop(&mut self) {
        self.listener = None;
        self.is_running = false;
        self.info = None;
        log::info!("Server stopped");
    }

    pub fn take_listener(&mut self) -> Option<TcpListener> {
        self.listener.take()
    }
}

pub async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    connection: Arc<RwLock<Connection>>,
    frame_tx: mpsc::Sender<Vec<u8>>,
) -> AppResult<()> {
    log::info!("New connection from {}", addr);

    let ws_stream = accept_async(stream)
        .await
        .map_err(|e| AppError::WebSocketError(e.to_string()))?;

    let (mut write, mut read) = ws_stream.split();

    // Create channel for sending messages
    let (msg_tx, mut msg_rx) = mpsc::channel::<Message>(100);

    // Store the sender in connection
    {
        let mut conn = connection.write().await;
        conn.set_ws_tx(msg_tx.clone());
        conn.set_frame_tx(frame_tx);
    }

    // Spawn task to forward messages to WebSocket
    let write_handle = tokio::spawn(async move {
        while let Some(msg) = msg_rx.recv().await {
            if write.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    while let Some(msg_result) = read.next().await {
        match msg_result {
            Ok(msg) => {
                match msg {
                    Message::Binary(data) => {
                        // Check if it's a handshake or video frame
                        if let Some(msg_type) = parse_message_type(&data) {
                            match msg_type {
                                MessageType::Handshake => {
                                    handle_handshake(&data, &connection, &msg_tx).await?;
                                }
                                MessageType::VideoFrame => {
                                    // Extract just the JPEG data (skip 17 byte base header + 6 byte frame header)
                                    const FRAME_DATA_OFFSET: usize = 23;
                                    if data.len() > FRAME_DATA_OFFSET {
                                        let jpeg_data = &data[FRAME_DATA_OFFSET..];

                                        // Forward to virtual camera
                                        let tx_opt = {
                                            let conn = connection.read().await;
                                            conn.frame_tx().cloned()
                                        };
                                        if let Some(tx) = tx_opt {
                                            let _ = tx.send(jpeg_data.to_vec()).await;
                                        }
                                    }
                                }
                                MessageType::StatusUpdate => {
                                    // Handle status update
                                    log::debug!("Received status update");
                                }
                                MessageType::Disconnect => {
                                    log::info!("Client disconnected");
                                    break;
                                }
                                _ => {}
                            }
                        }
                    }
                    Message::Close(_) => {
                        log::info!("Connection closed by client");
                        break;
                    }
                    Message::Ping(data) => {
                        let _ = msg_tx.send(Message::Pong(data)).await;
                    }
                    _ => {}
                }
            }
            Err(e) => {
                log::error!("WebSocket error: {}", e);
                break;
            }
        }
    }

    // Cleanup
    write_handle.abort();
    connection.write().await.clear();

    log::info!("Connection from {} closed", addr);
    Ok(())
}

fn parse_message_type(data: &[u8]) -> Option<MessageType> {
    if data.is_empty() {
        return None;
    }

    match data[0] {
        0x01 => Some(MessageType::Handshake),
        0x02 => Some(MessageType::HandshakeAck),
        0x10 => Some(MessageType::VideoFrame),
        0x11 => Some(MessageType::AudioFrame),
        0x20 => Some(MessageType::SettingsUpdate),
        0x21 => Some(MessageType::ControlCommand),
        0x30 => Some(MessageType::StatusUpdate),
        0x40 => Some(MessageType::Ping),
        0x41 => Some(MessageType::Pong),
        0xf0 => Some(MessageType::Error),
        0xff => Some(MessageType::Disconnect),
        _ => None,
    }
}

async fn handle_handshake(
    data: &[u8],
    connection: &Arc<RwLock<Connection>>,
    msg_tx: &mpsc::Sender<Message>,
) -> AppResult<()> {
    // Skip header (17 bytes) and parse JSON payload
    if data.len() < 17 {
        return Err(AppError::ProtocolError("Invalid handshake message".into()));
    }

    let payload = &data[17..];
    let handshake: HandshakeMessage = serde_json::from_slice(payload)
        .map_err(|e| AppError::ProtocolError(e.to_string()))?;

    log::info!(
        "Received handshake from {} ({})",
        handshake.device_info.name,
        handshake.device_info.platform
    );

    // Generate session ID
    let session_id = Uuid::new_v4().to_string();

    // Store connection info
    {
        let mut conn = connection.write().await;
        conn.set_info(ConnectionInfo {
            session_id: session_id.clone(),
            device_info: handshake.device_info,
            connected_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        });
    }

    // Send handshake ack
    let ack = create_handshake_ack(session_id, default_video_settings());
    let ack_json = serde_json::to_vec(&ack)?;

    // Create binary message with header
    let mut response = Vec::with_capacity(17 + ack_json.len());
    response.push(0x02); // HandshakeAck type
    response.extend_from_slice(&ack.timestamp.to_be_bytes());
    response.extend_from_slice(&ack.sequence_number.to_be_bytes());
    response.extend_from_slice(&(ack_json.len() as u32).to_be_bytes());
    response.extend_from_slice(&ack_json);

    msg_tx
        .send(Message::Binary(response))
        .await
        .map_err(|e| AppError::WebSocketError(e.to_string()))?;

    log::info!("Handshake completed");
    Ok(())
}
