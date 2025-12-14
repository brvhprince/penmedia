import type {
  ConnectionStatus,
  ConnectionInfo,
  DeviceInfo,
  ProtocolMessage,
  HandshakeMessage,
  HandshakeAckMessage,
  PingMessage,
  PongMessage,
  VideoSettings,
} from '@penmedia/shared-types';
import { encodeMessage, decodeMessage, createSequenceCounter } from './codec';
import {
  PROTOCOL_VERSION,
  CONNECTION_TIMEOUT,
  HANDSHAKE_TIMEOUT,
  PING_INTERVAL,
  PING_TIMEOUT,
} from './constants';
import * as console from "node:console";

export interface ConnectionEvents {
  onStatusChange: (status: ConnectionStatus) => void;
  onMessage: (message: ProtocolMessage) => void;
  onError: (error: Error) => void;
  onLatencyUpdate: (latency: number) => void;
}

export interface ConnectionOptions {
  host: string;
  port: number;
  deviceInfo: DeviceInfo;
  settings: VideoSettings;
}

export abstract class BaseConnection {
  protected status: ConnectionStatus = 'disconnected';
  protected sessionId: string | null = null;
  protected latency = 0;
  protected events: ConnectionEvents;
  protected options: ConnectionOptions;
  protected nextSequence = createSequenceCounter();
  protected pingInterval: ReturnType<typeof setInterval> | null = null;
  protected lastPingTime = 0;

  constructor(options: ConnectionOptions, events: ConnectionEvents) {
    this.options = options;
    this.events = events;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: ProtocolMessage): Promise<void>;

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getLatency(): number {
    return this.latency;
  }

  getConnectionInfo(): ConnectionInfo {
    return {
      type: 'wifi',
      status: this.status,
      deviceId: this.options.deviceInfo.id,
      deviceName: this.options.deviceInfo.name,
      ipAddress: this.options.host,
      port: this.options.port,
      latency: this.latency,
    };
  }

  protected setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.events.onStatusChange(status);
  }

  protected createHandshakeMessage(): HandshakeMessage {
    return {
      type: 'handshake',
      timestamp: Date.now(),
      sequenceNumber: this.nextSequence(),
      deviceInfo: this.options.deviceInfo,
      protocolVersion: PROTOCOL_VERSION,
    };
  }

  protected createPingMessage(): PingMessage {
    return {
      type: 'ping',
      timestamp: Date.now(),
      sequenceNumber: this.nextSequence(),
    };
  }

  protected handleMessage(message: ProtocolMessage): void {
    switch (message.type) {
      case 'handshake_ack':
        this.handleHandshakeAck(message);
        break;
      case 'pong':
        this.handlePong(message);
        break;
      default:
        this.events.onMessage(message);
    }
  }

  protected handleHandshakeAck(message: HandshakeAckMessage): void {
    if (message.accepted) {
      this.sessionId = message.sessionId;
      this.setStatus('connected');
      this.startPingLoop();
    } else {
      this.setStatus('error');
      this.events.onError(new Error('Handshake rejected'));
    }
  }

  protected handlePong(_message: PongMessage): void {
    this.latency = Date.now() - this.lastPingTime;
    this.events.onLatencyUpdate(this.latency);
  }

  protected startPingLoop(): void {
    this.pingInterval = setInterval(async () => {
      if (this.status === 'connected') {
        this.lastPingTime = Date.now();
        try {
          await this.send(this.createPingMessage());
        } catch (error) {
          // Ping failed, connection might be lost
          if (Date.now() - this.lastPingTime > PING_TIMEOUT) {
            this.setStatus('error');
            this.events.onError(new Error('Connection timeout'));
          }
        }
      }
    }, PING_INTERVAL);
  }

  protected stopPingLoop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export class WebSocketConnection extends BaseConnection {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.setStatus('connecting');

    this.connectPromise = new Promise((resolve, reject) => {
      const url = `ws://${this.options.host}:${this.options.port}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        if (this.status === 'connecting') {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }
      }, CONNECTION_TIMEOUT);

      this.ws.onopen = async () => {
        clearTimeout(timeout);
        try {
          await this.send(this.createHandshakeMessage());

          // Wait for handshake ack
          const handshakeTimeout = setTimeout(() => {
            if (this.status !== 'connected') {
              reject(new Error('Handshake timeout'));
            }
          }, HANDSHAKE_TIMEOUT);

          const originalOnMessage = this.events.onMessage;
          this.events.onMessage = (msg) => {
              console.log({msg})
            if (msg.type === 'handshake_ack') {
              clearTimeout(handshakeTimeout);
              this.handleHandshakeAck(msg as HandshakeAckMessage);
              this.events.onMessage = originalOnMessage;
              resolve();
            } else {
              originalOnMessage(msg);
            }
          };
        } catch (error) {
          reject(error);
        }
      };

      this.ws.onmessage = (event) => {
        try {
            console.log({event})
          const message = decodeMessage(event.data);
          console.log({message})
          this.handleMessage(message);
        } catch (error) {
            console.log({error})
          this.events.onError(error as Error);
        }
      };

      this.ws.onerror = (_event) => {
        clearTimeout(timeout);
        this.setStatus('error');
        this.events.onError(new Error('WebSocket error'));
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.stopPingLoop();
        this.setStatus('disconnected');
        this.connectPromise = null;
      };
    });

    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    this.stopPingLoop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.connectPromise = null;
  }

  async send(message: ProtocolMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    const buffer = encodeMessage(message);
    this.ws.send(buffer);
  }
}
