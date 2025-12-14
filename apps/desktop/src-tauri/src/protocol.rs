use serde::{Deserialize, Serialize};

pub const PROTOCOL_VERSION: &str = "1.0.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    Handshake,
    HandshakeAck,
    VideoFrame,
    AudioFrame,
    SettingsUpdate,
    ControlCommand,
    StatusUpdate,
    Ping,
    Pong,
    Error,
    Disconnect,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub os_version: String,
    pub app_version: String,
    pub capabilities: DeviceCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceCapabilities {
    pub has_flash: bool,
    pub has_front_camera: bool,
    pub has_back_camera: bool,
    pub max_resolution: Resolution,
    pub supported_resolutions: Vec<Resolution>,
    pub supported_frame_rates: Vec<u32>,
    pub supports_auto_focus: bool,
    pub supports_exposure_control: bool,
    pub supports_zoom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoSettings {
    pub resolution: Resolution,
    pub frame_rate: u32,
    pub bitrate: u32,
    pub camera_position: String,
    pub mirror: bool,
    pub auto_focus: bool,
    pub flash_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HandshakeMessage {
    #[serde(rename = "type")]
    pub msg_type: MessageType,
    pub timestamp: u64,
    pub sequence_number: u32,
    pub device_info: DeviceInfo,
    pub protocol_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HandshakeAckMessage {
    #[serde(rename = "type")]
    pub msg_type: MessageType,
    pub timestamp: u64,
    pub sequence_number: u32,
    pub accepted: bool,
    pub session_id: String,
    pub settings: VideoSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoFrameHeader {
    pub width: u16,
    pub height: u16,
    pub format: VideoFormat,
    pub key_frame: bool,
    pub timestamp: u64,
    pub sequence_number: u32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VideoFormat {
    H264,
    Vp8,
    Vp9,
    Jpeg,
}

impl VideoFormat {
    pub fn from_code(code: u8) -> Option<Self> {
        match code {
            1 => Some(Self::H264),
            2 => Some(Self::Vp8),
            3 => Some(Self::Vp9),
            4 => Some(Self::Jpeg),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlCommand {
    #[serde(rename = "type")]
    pub msg_type: MessageType,
    pub timestamp: u64,
    pub sequence_number: u32,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusUpdate {
    #[serde(rename = "type")]
    pub msg_type: MessageType,
    pub timestamp: u64,
    pub sequence_number: u32,
    pub status: String,
    pub battery_level: Option<u8>,
    pub temperature: Option<f32>,
    pub fps: Option<u32>,
    pub dropped_frames: Option<u32>,
}
