import type {
  CameraPosition,
  VideoSettings,
  CameraControls,
  DeviceCapabilities,
  Resolution,
} from '@penmedia/shared-types';

export interface CameraDevice {
  id: string;
  position: CameraPosition;
  name: string;
  hasFlash: boolean;
  hasTorch: boolean;
  minZoom: number;
  maxZoom: number;
  supportsAutoFocus: boolean;
  formats: CameraFormat[];
}

export interface CameraFormat {
  width: number;
  height: number;
  frameRateRanges: { min: number; max: number }[];
}

export interface FrameProcessor {
  (frame: Frame): void;
}

export interface Frame {
  width: number;
  height: number;
  bytesPerRow: number;
  planesCount: number;
  isMirrored: boolean;
  timestamp: number;
  orientation: 'portrait' | 'landscape-left' | 'landscape-right' | 'portrait-upside-down';
  toArrayBuffer(): ArrayBuffer;
}

class CameraServiceImpl {
  private devices: CameraDevice[] = [];
  private activeDevice: CameraDevice | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // This will be populated by react-native-vision-camera
    // Placeholder for device enumeration
    this.isInitialized = true;
  }

  async getAvailableDevices(): Promise<CameraDevice[]> {
    await this.initialize();
    return this.devices;
  }

  async getDeviceCapabilities(): Promise<DeviceCapabilities> {
    const devices = await this.getAvailableDevices();
    const backCamera = devices.find(d => d.position === 'back');
    const frontCamera = devices.find(d => d.position === 'front');

    const allFormats = [...(backCamera?.formats || []), ...(frontCamera?.formats || [])];
    const maxRes = allFormats.reduce(
      (max, f) => (f.width * f.height > max.width * max.height ? f : max),
      { width: 1920, height: 1080 }
    );

    const resolutions: Resolution[] = [
      { width: 1920, height: 1080, label: '1080p' },
      { width: 1280, height: 720, label: '720p' },
      { width: 854, height: 480, label: '480p' },
      { width: 640, height: 360, label: '360p' },
    ].filter(r => r.width <= maxRes.width && r.height <= maxRes.height);

    return {
      hasFlash: backCamera?.hasFlash || false,
      hasFrontCamera: !!frontCamera,
      hasBackCamera: !!backCamera,
      maxResolution: { width: maxRes.width, height: maxRes.height },
      supportedResolutions: resolutions,
      supportedFrameRates: [15, 24, 30, 60],
      supportsAutoFocus: backCamera?.supportsAutoFocus || false,
      supportsExposureControl: true,
      supportsZoom: (backCamera?.maxZoom || 1) > 1,
    };
  }

  getDeviceForPosition(position: CameraPosition): CameraDevice | undefined {
    return this.devices.find(d => d.position === position);
  }

  getBestFormat(device: CameraDevice, targetResolution: Resolution): CameraFormat | undefined {
    // Find the format that best matches the target resolution
    const sorted = [...device.formats].sort((a, b) => {
      const diffA = Math.abs(a.width - targetResolution.width) + Math.abs(a.height - targetResolution.height);
      const diffB = Math.abs(b.width - targetResolution.width) + Math.abs(b.height - targetResolution.height);
      return diffA - diffB;
    });
    return sorted[0];
  }

  setDevices(devices: CameraDevice[]): void {
    this.devices = devices;
  }

  setActiveDevice(device: CameraDevice | null): void {
    this.activeDevice = device;
  }

  getActiveDevice(): CameraDevice | null {
    return this.activeDevice;
  }
}

export const CameraService = new CameraServiceImpl();
