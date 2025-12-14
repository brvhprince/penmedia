// Connection Types
export type ConnectionType = 'wifi' | 'usb';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionInfo {
  type: ConnectionType;
  status: ConnectionStatus;
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
  port?: number;
  latency?: number;
  connectedAt?: number;
}

export interface PairingCode {
  code: string;
  expiresAt: number;
  deviceId: string;
}

// Device Types
export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  osVersion: string;
  appVersion: string;
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  hasFlash: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  maxResolution: Resolution;
  supportedResolutions: Resolution[];
  supportedFrameRates: number[];
  supportsAutoFocus: boolean;
  supportsExposureControl: boolean;
  supportsZoom: boolean;
}

// Video Types
export type CameraPosition = 'front' | 'back';

export interface Resolution {
  width: number;
  height: number;
  label?: string;
}

export const STANDARD_RESOLUTIONS: Resolution[] = [
  { width: 1920, height: 1080, label: '1080p' },
  { width: 1280, height: 720, label: '720p' },
  { width: 854, height: 480, label: '480p' },
  { width: 640, height: 360, label: '360p' },
];

export interface VideoSettings {
  resolution: Resolution;
  frameRate: number;
  bitrate: number;
  cameraPosition: CameraPosition;
  mirror: boolean;
  autoFocus: boolean;
  flashEnabled: boolean;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  resolution: STANDARD_RESOLUTIONS[1], // 720p
  frameRate: 30,
  bitrate: 2500000, // 2.5 Mbps
  cameraPosition: 'back',
  mirror: false,
  autoFocus: true,
  flashEnabled: false,
};

// Camera Controls
export interface CameraControls {
  zoom: number; // 1.0 - maxZoom
  exposure: number; // -2.0 to 2.0
  brightness: number; // 0 - 100
  contrast: number; // 0 - 100
  saturation: number; // 0 - 100
}

export const DEFAULT_CAMERA_CONTROLS: CameraControls = {
  zoom: 1.0,
  exposure: 0,
  brightness: 50,
  contrast: 50,
  saturation: 50,
};

// Filter Types
export type FilterType =
  | 'none'
  | 'blur_background'
  | 'beauty'
  | 'low_light'
  | 'grayscale'
  | 'sepia'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'vignette';

export interface FilterSettings {
  type: FilterType;
  intensity: number; // 0 - 100
  enabled: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterSettings[];
  thumbnail?: string;
}

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'No Filter',
    filters: [{ type: 'none', intensity: 0, enabled: true }],
  },
  {
    id: 'professional',
    name: 'Professional',
    filters: [
      { type: 'blur_background', intensity: 50, enabled: true },
      { type: 'beauty', intensity: 30, enabled: true },
    ],
  },
  {
    id: 'low_light_boost',
    name: 'Low Light Boost',
    filters: [{ type: 'low_light', intensity: 70, enabled: true }],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    filters: [
      { type: 'warm', intensity: 30, enabled: true },
      { type: 'vignette', intensity: 40, enabled: true },
    ],
  },
];

// Protocol Messages
export type MessageType =
  | 'handshake'
  | 'handshake_ack'
  | 'video_frame'
  | 'audio_frame'
  | 'settings_update'
  | 'control_command'
  | 'status_update'
  | 'ping'
  | 'pong'
  | 'error'
  | 'disconnect';

export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  sequenceNumber: number;
}

export interface HandshakeMessage extends BaseMessage {
  type: 'handshake';
  deviceInfo: DeviceInfo;
  protocolVersion: string;
}

export interface HandshakeAckMessage extends BaseMessage {
  type: 'handshake_ack';
  accepted: boolean;
  sessionId: string;
  settings: VideoSettings;
}

export interface VideoFrameMessage extends BaseMessage {
  type: 'video_frame';
  data: ArrayBuffer;
  width: number;
  height: number;
  format: 'h264' | 'vp8' | 'vp9' | 'jpeg';
  keyFrame: boolean;
}

export interface AudioFrameMessage extends BaseMessage {
  type: 'audio_frame';
  data: ArrayBuffer;
  sampleRate: number;
  channels: number;
  format: 'opus' | 'aac';
}

export interface SettingsUpdateMessage extends BaseMessage {
  type: 'settings_update';
  settings: Partial<VideoSettings>;
  controls?: Partial<CameraControls>;
  filters?: FilterSettings[];
}

export interface ControlCommandMessage extends BaseMessage {
  type: 'control_command';
  command: 'start' | 'stop' | 'pause' | 'resume' | 'switch_camera' | 'toggle_flash';
}

export interface StatusUpdateMessage extends BaseMessage {
  type: 'status_update';
  status: ConnectionStatus;
  batteryLevel?: number;
  temperature?: number;
  fps?: number;
  droppedFrames?: number;
}

export interface PingMessage extends BaseMessage {
  type: 'ping';
}

export interface PongMessage extends BaseMessage {
  type: 'pong';
  latency: number;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface DisconnectMessage extends BaseMessage {
  type: 'disconnect';
  reason: string;
}

export type ProtocolMessage =
  | HandshakeMessage
  | HandshakeAckMessage
  | VideoFrameMessage
  | AudioFrameMessage
  | SettingsUpdateMessage
  | ControlCommandMessage
  | StatusUpdateMessage
  | PingMessage
  | PongMessage
  | ErrorMessage
  | DisconnectMessage;

// Virtual Camera Types
export interface VirtualCameraInfo {
  id: string;
  name: string;
  installed: boolean;
  active: boolean;
  resolution: Resolution;
}

// App State Types
export interface AppSettings {
  autoConnect: boolean;
  rememberDevices: boolean;
  defaultVideoSettings: VideoSettings;
  defaultFilters: FilterSettings[];
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoConnect: true,
  rememberDevices: true,
  defaultVideoSettings: DEFAULT_VIDEO_SETTINGS,
  defaultFilters: [{ type: 'none', intensity: 0, enabled: true }],
  theme: 'system',
  language: 'en',
};

// Statistics
export interface StreamStats {
  fps: number;
  bitrate: number;
  latency: number;
  packetsLost: number;
  packetsReceived: number;
  bytesReceived: number;
  duration: number;
}
