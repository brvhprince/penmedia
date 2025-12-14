import type { DeviceInfo } from '@penmedia/shared-types';
import {
  DISCOVERY_MESSAGE,
  DISCOVERY_RESPONSE,
  DEFAULT_PORT,
} from './constants';

export interface DiscoveredDevice {
  deviceInfo: DeviceInfo;
  ipAddress: string;
  port: number;
  lastSeen: number;
}

export interface DiscoveryEvents {
  onDeviceFound: (device: DiscoveredDevice) => void;
  onDeviceLost: (deviceId: string) => void;
  onError: (error: Error) => void;
}

// Discovery message format
export interface DiscoveryBroadcast {
  type: typeof DISCOVERY_MESSAGE | typeof DISCOVERY_RESPONSE;
  deviceInfo: DeviceInfo;
  port: number;
}

export function createDiscoveryMessage(deviceInfo: DeviceInfo, port: number): string {
  const message: DiscoveryBroadcast = {
    type: DISCOVERY_MESSAGE,
    deviceInfo,
    port,
  };
  return JSON.stringify(message);
}

export function createDiscoveryResponse(deviceInfo: DeviceInfo, port: number): string {
  const message: DiscoveryBroadcast = {
    type: DISCOVERY_RESPONSE,
    deviceInfo,
    port,
  };
  return JSON.stringify(message);
}

export function parseDiscoveryMessage(data: string): DiscoveryBroadcast | null {
  try {
    const message = JSON.parse(data);
    if (
      message.type === DISCOVERY_MESSAGE ||
      message.type === DISCOVERY_RESPONSE
    ) {
      return message as DiscoveryBroadcast;
    }
    return null;
  } catch {
    return null;
  }
}

// QR Code pairing data
export interface QRPairingData {
  type: 'penmedia_pair';
  version: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  port: number;
  timestamp: number;
  signature?: string;
}

export function createQRPairingData(
  deviceInfo: DeviceInfo,
  ipAddress: string,
  port: number = DEFAULT_PORT
): QRPairingData {
  return {
    type: 'penmedia_pair',
    version: '1.0',
    deviceId: deviceInfo.id,
    deviceName: deviceInfo.name,
    ipAddress,
    port,
    timestamp: Date.now(),
  };
}

export function parseQRPairingData(data: string): QRPairingData | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'penmedia_pair' && parsed.version && parsed.deviceId) {
      return parsed as QRPairingData;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeQRPairingData(data: QRPairingData): string {
  return JSON.stringify(data);
}

// Device tracking utilities
export class DeviceTracker {
  private devices: Map<string, DiscoveredDevice> = new Map();
  private events: DiscoveryEvents;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private deviceTimeout: number;

  constructor(events: DiscoveryEvents, deviceTimeout: number = 10000) {
    this.events = events;
    this.deviceTimeout = deviceTimeout;
  }

  start(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleDevices();
    }, 5000);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.devices.clear();
  }

  updateDevice(device: DiscoveredDevice): void {
    const existing = this.devices.get(device.deviceInfo.id);
    this.devices.set(device.deviceInfo.id, {
      ...device,
      lastSeen: Date.now(),
    });

    if (!existing) {
      this.events.onDeviceFound(device);
    }
  }

  getDevices(): DiscoveredDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): DiscoveredDevice | undefined {
    return this.devices.get(deviceId);
  }

  private cleanupStaleDevices(): void {
    const now = Date.now();
    for (const [deviceId, device] of this.devices) {
      if (now - device.lastSeen > this.deviceTimeout) {
        this.devices.delete(deviceId);
        this.events.onDeviceLost(deviceId);
      }
    }
  }
}
