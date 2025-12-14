import { create } from 'zustand';
import type {
  ConnectionStatus,
  VideoSettings,
  CameraControls,
  FilterSettings,
  DeviceInfo,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_CAMERA_CONTROLS,
} from '@penmedia/shared-types';

interface AppState {
  // Connection
  connectionStatus: ConnectionStatus;
  connectedDeviceId: string | null;
  sessionId: string | null;
  latency: number;

  // Device Info
  deviceInfo: DeviceInfo | null;

  // Video Settings
  videoSettings: VideoSettings;
  cameraControls: CameraControls;
  filters: FilterSettings[];

  // Streaming
  isStreaming: boolean;
  isPaused: boolean;

  // Stats
  fps: number;
  bitrate: number;
  droppedFrames: number;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnectedDevice: (deviceId: string | null, sessionId: string | null) => void;
  setLatency: (latency: number) => void;
  setDeviceInfo: (info: DeviceInfo) => void;
  updateVideoSettings: (settings: Partial<VideoSettings>) => void;
  updateCameraControls: (controls: Partial<CameraControls>) => void;
  setFilters: (filters: FilterSettings[]) => void;
  toggleFilter: (type: FilterSettings['type']) => void;
  setStreaming: (isStreaming: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  updateStats: (fps: number, bitrate: number, droppedFrames: number) => void;
  reset: () => void;
}

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  connectedDeviceId: null,
  sessionId: null,
  latency: 0,
  deviceInfo: null,
  videoSettings: {
    resolution: { width: 1280, height: 720, label: '720p' },
    frameRate: 30,
    bitrate: 2500000,
    cameraPosition: 'back' as const,
    mirror: false,
    autoFocus: true,
    flashEnabled: false,
  },
  cameraControls: {
    zoom: 1.0,
    exposure: 0,
    brightness: 50,
    contrast: 50,
    saturation: 50,
  },
  filters: [{ type: 'none' as const, intensity: 0, enabled: true }],
  isStreaming: false,
  isPaused: false,
  fps: 0,
  bitrate: 0,
  droppedFrames: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setConnectionStatus: status => set({ connectionStatus: status }),

  setConnectedDevice: (deviceId, sessionId) =>
    set({ connectedDeviceId: deviceId, sessionId }),

  setLatency: latency => set({ latency }),

  setDeviceInfo: info => set({ deviceInfo: info }),

  updateVideoSettings: settings =>
    set(state => ({
      videoSettings: { ...state.videoSettings, ...settings },
    })),

  updateCameraControls: controls =>
    set(state => ({
      cameraControls: { ...state.cameraControls, ...controls },
    })),

  setFilters: filters => set({ filters }),

  toggleFilter: type =>
    set(state => ({
      filters: state.filters.map(f =>
        f.type === type ? { ...f, enabled: !f.enabled } : f
      ),
    })),

  setStreaming: isStreaming => set({ isStreaming }),

  setPaused: isPaused => set({ isPaused }),

  updateStats: (fps, bitrate, droppedFrames) =>
    set({ fps, bitrate, droppedFrames }),

  reset: () => set(initialState),
}));
