import { create } from 'zustand';
import type {
  ConnectionStatus,
  VideoSettings,
  FilterSettings,
  DeviceInfo,
  StreamStats,
  VirtualCameraInfo,
} from '@penmedia/shared-types';

interface ConnectedDevice {
  deviceInfo: DeviceInfo;
  sessionId: string;
  connectedAt: number;
}

interface AppState {
  // Connection
  connectionStatus: ConnectionStatus;
  connectedDevice: ConnectedDevice | null;
  latency: number;

  // Virtual Camera
  virtualCamera: VirtualCameraInfo | null;
  isVirtualCameraActive: boolean;

  // Video Settings (received from mobile)
  videoSettings: VideoSettings | null;
  filters: FilterSettings[];

  // Stream Stats
  stats: StreamStats;

  // UI State
  showQRScanner: boolean;
  sidebarCollapsed: boolean;
  selectedTab: 'preview' | 'settings' | 'filters';

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnectedDevice: (device: ConnectedDevice | null) => void;
  setLatency: (latency: number) => void;
  setVirtualCamera: (camera: VirtualCameraInfo | null) => void;
  setVirtualCameraActive: (active: boolean) => void;
  setVideoSettings: (settings: VideoSettings) => void;
  setFilters: (filters: FilterSettings[]) => void;
  updateStats: (stats: Partial<StreamStats>) => void;
  setShowQRScanner: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedTab: (tab: 'preview' | 'settings' | 'filters') => void;
  reset: () => void;
}

const initialStats: StreamStats = {
  fps: 0,
  bitrate: 0,
  latency: 0,
  packetsLost: 0,
  packetsReceived: 0,
  bytesReceived: 0,
  duration: 0,
};

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  connectedDevice: null,
  latency: 0,
  virtualCamera: null,
  isVirtualCameraActive: false,
  videoSettings: null,
  filters: [],
  stats: initialStats,
  showQRScanner: false,
  sidebarCollapsed: false,
  selectedTab: 'preview' as const,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setConnectedDevice: (device) =>
    set({
      connectedDevice: device,
      connectionStatus: device ? 'connected' : 'disconnected',
    }),

  setLatency: (latency) => set({ latency }),

  setVirtualCamera: (camera) => set({ virtualCamera: camera }),

  setVirtualCameraActive: (active) => set({ isVirtualCameraActive: active }),

  setVideoSettings: (settings) => set({ videoSettings: settings }),

  setFilters: (filters) => set({ filters }),

  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats },
    })),

  setShowQRScanner: (show) => set({ showQRScanner: show }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setSelectedTab: (tab) => set({ selectedTab: tab }),

  reset: () => set(initialState),
}));
