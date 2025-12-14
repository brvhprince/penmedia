// Constants
export * from './constants';

// Codec
export {
  encodeMessage,
  decodeMessage,
  encodeVideoFrame,
  decodeVideoFrame,
  createSequenceCounter,
} from './codec';

// Connection
export {
  BaseConnection,
  WebSocketConnection,
  type ConnectionEvents,
  type ConnectionOptions,
} from './connection';

// Discovery
export {
  createDiscoveryMessage,
  createDiscoveryResponse,
  parseDiscoveryMessage,
  createQRPairingData,
  parseQRPairingData,
  encodeQRPairingData,
  DeviceTracker,
  type DiscoveredDevice,
  type DiscoveryEvents,
  type DiscoveryBroadcast,
  type QRPairingData,
} from './discovery';
