import type { ProtocolMessage, MessageType } from '@penmedia/shared-types';

// Message header format: [type: 1 byte][timestamp: 8 bytes][sequence: 4 bytes][payload length: 4 bytes]
const HEADER_SIZE = 17;

const MESSAGE_TYPE_MAP: Record<MessageType, number> = {
  handshake: 0x01,
  handshake_ack: 0x02,
  video_frame: 0x10,
  audio_frame: 0x11,
  settings_update: 0x20,
  control_command: 0x21,
  status_update: 0x30,
  ping: 0x40,
  pong: 0x41,
  error: 0xf0,
  disconnect: 0xff,
};

const REVERSE_MESSAGE_TYPE_MAP: Record<number, MessageType> = Object.entries(MESSAGE_TYPE_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key as MessageType;
    return acc;
  },
  {} as Record<number, MessageType>
);

export function encodeMessage(message: ProtocolMessage): ArrayBuffer {
  const jsonPayload = JSON.stringify(message);
  const payloadBytes = new TextEncoder().encode(jsonPayload);

  const buffer = new ArrayBuffer(HEADER_SIZE + payloadBytes.length);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Write header
  view.setUint8(0, MESSAGE_TYPE_MAP[message.type]);
  view.setBigUint64(1, BigInt(message.timestamp), false);
  view.setUint32(9, message.sequenceNumber, false);
  view.setUint32(13, payloadBytes.length, false);

  // Write payload
  uint8View.set(payloadBytes, HEADER_SIZE);

  return buffer;
}

export function decodeMessage(buffer: ArrayBuffer): ProtocolMessage {
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Read header
  const typeCode = view.getUint8(0);
  const timestamp = Number(view.getBigUint64(1, false));
  const sequenceNumber = view.getUint32(9, false);
  const payloadLength = view.getUint32(13, false);

  const type = REVERSE_MESSAGE_TYPE_MAP[typeCode];
  if (!type) {
    throw new Error(`Unknown message type: ${typeCode}`);
  }

  // Read payload
  const payloadBytes = uint8View.slice(HEADER_SIZE, HEADER_SIZE + payloadLength);
  const jsonPayload = new TextDecoder().decode(payloadBytes);
  const payload = JSON.parse(jsonPayload);

  return {
    ...payload,
    type,
    timestamp,
    sequenceNumber,
  };
}

export function encodeVideoFrame(
  data: ArrayBuffer,
  width: number,
  height: number,
  format: 'h264' | 'vp8' | 'vp9' | 'jpeg',
  keyFrame: boolean,
  timestamp: number,
  sequenceNumber: number
): ArrayBuffer {
  // Video frame header: [base header][width: 2][height: 2][format: 1][keyFrame: 1][data]
  const dataBytes = new Uint8Array(data);
  const buffer = new ArrayBuffer(HEADER_SIZE + 6 + dataBytes.length);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Write base header
  view.setUint8(0, MESSAGE_TYPE_MAP['video_frame']);
  view.setBigUint64(1, BigInt(timestamp), false);
  view.setUint32(9, sequenceNumber, false);
  view.setUint32(13, 6 + dataBytes.length, false);

  // Write video frame header
  view.setUint16(HEADER_SIZE, width, false);
  view.setUint16(HEADER_SIZE + 2, height, false);
  view.setUint8(HEADER_SIZE + 4, formatToCode(format));
  view.setUint8(HEADER_SIZE + 5, keyFrame ? 1 : 0);

  // Write data
  uint8View.set(dataBytes, HEADER_SIZE + 6);

  return buffer;
}

export function decodeVideoFrame(buffer: ArrayBuffer): {
  data: ArrayBuffer;
  width: number;
  height: number;
  format: 'h264' | 'vp8' | 'vp9' | 'jpeg';
  keyFrame: boolean;
  timestamp: number;
  sequenceNumber: number;
} {
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Read base header
  const timestamp = Number(view.getBigUint64(1, false));
  const sequenceNumber = view.getUint32(9, false);

  // Read video frame header
  const width = view.getUint16(HEADER_SIZE, false);
  const height = view.getUint16(HEADER_SIZE + 2, false);
  const format = codeToFormat(view.getUint8(HEADER_SIZE + 4));
  const keyFrame = view.getUint8(HEADER_SIZE + 5) === 1;

  // Read data
  const data = uint8View.slice(HEADER_SIZE + 6).buffer;

  return { data, width, height, format, keyFrame, timestamp, sequenceNumber };
}

function formatToCode(format: 'h264' | 'vp8' | 'vp9' | 'jpeg'): number {
  const map: Record<string, number> = { h264: 1, vp8: 2, vp9: 3, jpeg: 4 };
  return map[format] || 0;
}

function codeToFormat(code: number): 'h264' | 'vp8' | 'vp9' | 'jpeg' {
  const map: Record<number, 'h264' | 'vp8' | 'vp9' | 'jpeg'> = { 1: 'h264', 2: 'vp8', 3: 'vp9', 4: 'jpeg' };
  return map[code] || 'jpeg';
}

export function createSequenceCounter(): () => number {
  let counter = 0;
  return () => {
    const current = counter;
    counter = (counter + 1) % 0xffffffff;
    return current;
  };
}
