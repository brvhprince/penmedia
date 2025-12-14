import {
    DeviceInfo,
    VideoSettings,
    FilterSettings,
    CameraControls,
    ProtocolMessage,
    SettingsUpdateMessage,
    ControlCommandMessage,
    StatusUpdateMessage, ConnectionStatus,
} from '@penmedia/shared-types';
import {
  WebSocketConnection,
  encodeVideoFrame,
  createSequenceCounter,
  createQRPairingData,
  encodeQRPairingData,
  DEFAULT_PORT,
  type ConnectionEvents,
} from '@penmedia/protocol';
import { Platform } from 'react-native';
import DeviceInfoModule from 'react-native-device-info';

class StreamingServiceImpl {
  private connection: WebSocketConnection | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private nextSequence = createSequenceCounter();
  private frameCount = 0;
  private lastStatTime = 0;
  private droppedFrames = 0;
  private onStatsUpdate?: (fps: number, bitrate: number, dropped: number) => void;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onSettingsReceived?: (settings: Partial<VideoSettings>) => void;
  private onControlCommand?: (command: string) => void;

  async initialize(): Promise<DeviceInfo> {
    if (this.deviceInfo) return this.deviceInfo;

    const deviceId = await DeviceInfoModule.getUniqueId();
    const deviceName = await DeviceInfoModule.getDeviceName();
    const osVersion = await DeviceInfoModule.getSystemVersion();
    const appVersion = await DeviceInfoModule.getVersion();

    this.deviceInfo = {
      id: deviceId,
      name: deviceName,
      platform: Platform.OS as 'ios' | 'android',
      osVersion,
      appVersion,
      capabilities: {
        hasFlash: false, // Will be updated when camera is initialized
        hasFrontCamera: true,
        hasBackCamera: true,
        maxResolution: { width: 1920, height: 1080 },
        supportedResolutions: [
          { width: 1920, height: 1080, label: '1080p' },
          { width: 1280, height: 720, label: '720p' },
          { width: 854, height: 480, label: '480p' },
        ],
        supportedFrameRates: [15, 24, 30, 60],
        supportsAutoFocus: true,
        supportsExposureControl: true,
        supportsZoom: true,
      },
    };

    return this.deviceInfo;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  generateQRCode(ipAddress: string, port: number = DEFAULT_PORT): string {
    if (!this.deviceInfo) {
      throw new Error('StreamingService not initialized');
    }

    const pairingData = createQRPairingData(this.deviceInfo, ipAddress, port);
    return encodeQRPairingData(pairingData);
  }

  async connect(host: string, port: number, settings: VideoSettings): Promise<void> {
    if (!this.deviceInfo) {
      throw new Error('StreamingService not initialized');
    }

    const events: ConnectionEvents = {
      onStatusChange: status => {
          console.log(`Connection status: ${status}`);
        this.onStatusChange?.(status);
      },
      onMessage: message => {
          console.log({message})
        this.handleMessage(message);
      },
      onError: error => {
        console.error('Connection error:', error);
      },
      onLatencyUpdate: latency => {
          console.log(`Connection latency: ${latency}`);
        // Handle latency updates
      },
    };

    this.connection = new WebSocketConnection(
      {
        host,
        port,
        deviceInfo: this.deviceInfo,
        settings,
      },
      events
    );

    await this.connection.connect();
    this.lastStatTime = Date.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.getStatus() === 'connected';
  }

  async sendFrame(
    data: ArrayBuffer,
    width: number,
    height: number,
    format: 'h264' | 'vp8' | 'vp9' | 'jpeg',
    keyFrame: boolean
  ): Promise<void> {
    if (!this.connection || !this.isConnected()) {
      this.droppedFrames++;
      return;
    }

    try {
      const frameData = encodeVideoFrame(
        data,
        width,
        height,
        format,
        keyFrame,
        Date.now(),
        this.nextSequence()
      );

      // Send the pre-encoded binary frame directly
      await this.connection.send(frameData as any);

      this.frameCount++;
      this.updateStats();
    } catch (error) {
      this.droppedFrames++;
      console.error('Failed to send frame:', error);
    }
  }

  async sendStatusUpdate(
    batteryLevel: number,
    temperature: number
  ): Promise<void> {
    if (!this.connection || !this.isConnected()) return;

    const message: StatusUpdateMessage = {
      type: 'status_update',
      timestamp: Date.now(),
      sequenceNumber: this.nextSequence(),
      status: 'connected',
      batteryLevel,
      temperature,
      fps: this.calculateFps(),
      droppedFrames: this.droppedFrames,
    };

    await this.connection.send(message);
  }

  setCallbacks(callbacks: {
    onStatsUpdate?: (fps: number, bitrate: number, dropped: number) => void;
    onStatusChange?: (status: ConnectionStatus) => void;
    onSettingsReceived?: (settings: Partial<VideoSettings>) => void;
    onControlCommand?: (command: string) => void;
  }): void {
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onStatusChange = callbacks.onStatusChange;
    this.onSettingsReceived = callbacks.onSettingsReceived;
    this.onControlCommand = callbacks.onControlCommand;
  }

  private handleMessage(message: ProtocolMessage): void {
    switch (message.type) {
      case 'settings_update':
        const settingsMsg = message as SettingsUpdateMessage;
        if (settingsMsg.settings) {
          this.onSettingsReceived?.(settingsMsg.settings);
        }
        break;
      case 'control_command':
        const controlMsg = message as ControlCommandMessage;
        this.onControlCommand?.(controlMsg.command);
        break;
    }
  }

  private updateStats(): void {
    const now = Date.now();
    if (now - this.lastStatTime >= 1000) {
      const fps = this.calculateFps();
      const bitrate = 0; // Calculate based on sent bytes
      this.onStatsUpdate?.(fps, bitrate, this.droppedFrames);
      this.frameCount = 0;
      this.lastStatTime = now;
    }
  }

  private calculateFps(): number {
    const elapsed = (Date.now() - this.lastStatTime) / 1000;
    return elapsed > 0 ? Math.round(this.frameCount / elapsed) : 0;
  }
}

export const StreamingService = new StreamingServiceImpl();
