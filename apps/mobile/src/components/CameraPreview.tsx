import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  type CameraPosition,
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import Reanimated from 'react-native-reanimated';
import { convertFrameToBase64 } from 'vision-camera-base64';
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

  const sendFrame = useCallback(async (base64: string, width: number, height: number) => {
    try {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await StreamingService.sendFrame(
        bytes.buffer,
        width,
        height,
        'jpeg',
        false
      );
    } catch (error) {
      console.error('Failed to send frame:', error);
    }
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (isStreaming) {
      try {
        const base64 = convertFrameToBase64(frame);
        runOnJS(sendFrame)(base64, frame.width, frame.height);
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    }
  }, [isStreaming, sendFrame]);

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
        frameProcessor={frameProcessor}
        zoom={cameraControls.zoom}
        exposure={cameraControls.exposure}
        torch={videoSettings.flashEnabled ? 'on' : 'off'}
        enableZoomGesture
        video
        audio={false}
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
