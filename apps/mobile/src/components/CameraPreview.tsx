import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  type CameraPosition,
} from 'react-native-vision-camera';
import Reanimated from 'react-native-reanimated';
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

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    if (isStreaming) {
      // Process frame and send to streaming service
      // This runs on the frame processor thread
      const frameData = frame.toArrayBuffer();
      // Use runOnJS to call the streaming service
    }
  }, [isStreaming]);

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
