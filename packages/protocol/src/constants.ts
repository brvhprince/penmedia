// Protocol Constants
export const PROTOCOL_VERSION = '1.0.0';
export const DEFAULT_PORT = 8765;
export const DISCOVERY_PORT = 8766;

// Timeouts (in milliseconds)
export const CONNECTION_TIMEOUT = 10000;
export const HANDSHAKE_TIMEOUT = 5000;
export const PING_INTERVAL = 1000;
export const PING_TIMEOUT = 3000;
export const RECONNECT_DELAY = 2000;
export const MAX_RECONNECT_ATTEMPTS = 5;

// Buffer sizes
export const MAX_MESSAGE_SIZE = 1024 * 1024 * 2; // 2MB
export const FRAME_BUFFER_SIZE = 30; // frames

// Quality settings
export const MIN_BITRATE = 500000; // 500 Kbps
export const MAX_BITRATE = 8000000; // 8 Mbps
export const MIN_FRAMERATE = 15;
export const MAX_FRAMERATE = 60;

// Discovery
export const DISCOVERY_BROADCAST_INTERVAL = 2000;
export const DISCOVERY_MESSAGE = 'PENMEDIA_DISCOVER';
export const DISCOVERY_RESPONSE = 'PENMEDIA_DEVICE';
