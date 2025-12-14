import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  type CameraPosition,
} from 'react-native-vision-camera';
import Reanimated from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import { useAppStore } from '@store/appStore';
import { StreamingService } from '@services/StreamingService';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

interface CameraPreviewProps {
  isActive: boolean;
}

export function CameraPreview({ isActive }: CameraPreviewProps) {
  const cameraRef = useRef<Camera>(null);
  const { videoSettings, cameraControls, isStreaming } = useAppStore();

  const device = useCameraDevice(videoSettings.cameraPosition);
  const format = useCameraFormat(device, [
    { videoResolution: { width: videoSettings.resolution.width, height: videoSettings.resolution.height } },
    { fps: videoSettings.frameRate },
  ]);

  // Capture and send frames using takePhoto
  useEffect(() => {
    if (!isStreaming || !cameraRef.current) return;

    let isCapturing = false;
    const captureInterval = setInterval(async () => {
      if (isCapturing) return; // Skip if previous capture still processing

      isCapturing = true;
      try {
        const photo = await cameraRef.current?.takePhoto({
          qualityPrioritization: 'speed',
          enableShutterSound: false,
        });

        if (photo) {
          // Read as base64 and convert to ArrayBuffer
          const base64 = await RNFS.readFile(photo.path, 'base64');
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          await StreamingService.sendFrame(
            bytes.buffer,
            photo.width,
            photo.height,
            'jpeg',
            false
          );

          // Clean up
          await RNFS.unlink(photo.path).catch(() => {});
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      } finally {
        isCapturing = false;
      }
    }, Math.max(33, 1000 / videoSettings.frameRate)); // Min 33ms (30fps max)

    return () => clearInterval(captureInterval);
  }, [isStreaming, videoSettings.frameRate]);

  if (!device) {
    return (
      <View style={styles.noCamera}>
        {/* Show no camera available message */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReanimatedCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={isActive}
        photo={true}
        zoom={cameraControls.zoom}
        exposure={cameraControls.exposure}
        torch={videoSettings.flashEnabled ? 'on' : 'off'}
        enableZoomGesture
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  noCamera: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
