use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

use crate::error::{AppError, AppResult};
use crate::protocol::{DeviceInfo, HandshakeAckMessage, MessageType, VideoSettings};

pub type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    pub session_id: String,
    pub device_info: DeviceInfo,
    pub connected_at: u64,
}

pub struct Connection {
    info: Option<ConnectionInfo>,
    frame_tx: Option<mpsc::Sender<Vec<u8>>>,
    ws_tx: Option<mpsc::Sender<Message>>,
}

impl Connection {
    pub fn new() -> Self {
        Self {
            info: None,
            frame_tx: None,
            ws_tx: None,
        }
    }

    pub fn is_connected(&self) -> bool {
        self.info.is_some()
    }

    pub fn info(&self) -> Option<&ConnectionInfo> {
        self.info.as_ref()
    }

    pub fn set_info(&mut self, info: ConnectionInfo) {
        self.info = Some(info);
    }

    pub fn clear(&mut self) {
        self.info = None;
        self.frame_tx = None;
        self.ws_tx = None;
    }

    pub fn set_frame_tx(&mut self, tx: mpsc::Sender<Vec<u8>>) {
        self.frame_tx = Some(tx);
    }

    pub fn set_ws_tx(&mut self, tx: mpsc::Sender<Message>) {
        self.ws_tx = Some(tx);
    }

    pub fn frame_tx(&self) -> Option<&mpsc::Sender<Vec<u8>>> {
        self.frame_tx.as_ref()
    }

    pub async fn send_message(&self, msg: Message) -> AppResult<()> {
        if let Some(tx) = &self.ws_tx {
            tx.send(msg)
                .await
                .map_err(|e| AppError::ConnectionFailed(e.to_string()))?;
        }
        Ok(())
    }
}

pub async fn connect_to_host(host: &str, port: u16) -> AppResult<WsStream> {
    let url = format!("ws://{}:{}", host, port);
    log::info!("Connecting to {}", url);

    let (ws_stream, _) = connect_async(&url)
        .await
        .map_err(|e| AppError::ConnectionFailed(e.to_string()))?;

    log::info!("Connected to {}", url);
    Ok(ws_stream)
}

pub fn create_handshake_ack(session_id: String, settings: VideoSettings) -> HandshakeAckMessage {
    HandshakeAckMessage {
        msg_type: MessageType::HandshakeAck,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
        sequence_number: 0,
        accepted: true,
        session_id,
        settings,
    }
}

pub fn default_video_settings() -> VideoSettings {
    VideoSettings {
        resolution: crate::protocol::Resolution {
            width: 1280,
            height: 720,
            label: Some("720p".to_string()),
        },
        frame_rate: 30,
        bitrate: 2500000,
        camera_position: "back".to_string(),
        mirror: false,
        auto_focus: true,
        flash_enabled: false,
    }
}
