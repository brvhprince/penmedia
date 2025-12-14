import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';
import { CameraPreview, ControlPanel, FilterSelector } from '@components/index.ts';
import { useAppStore } from '@store/appStore';
import { StreamingService, CameraService } from '@services/index.ts';
import type { FilterSettings } from '@penmedia/shared-types';

export function HomeScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const {
    videoSettings,
    updateVideoSettings,
    setStreaming,
    isStreaming,
    connectionStatus,
  } = useAppStore();

  useEffect(() => {
    requestPermissions();
    initializeServices();
  }, []);

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const micPermission = await Camera.requestMicrophonePermission();

    if (cameraPermission === 'granted') {
      setHasPermission(true);
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to use PenMedia.',
        [{ text: 'OK' }]
      );
    }
  };

  const initializeServices = async () => {
    try {
      await StreamingService.initialize();
      await CameraService.initialize();
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const handleToggleCamera = useCallback(() => {
    updateVideoSettings({
      cameraPosition: videoSettings.cameraPosition === 'back' ? 'front' : 'back',
    });
  }, [videoSettings.cameraPosition, updateVideoSettings]);

  const handleToggleFlash = useCallback(() => {
    updateVideoSettings({
      flashEnabled: !videoSettings.flashEnabled,
    });
  }, [videoSettings.flashEnabled, updateVideoSettings]);

  const handleStartStreaming = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Not Connected', 'Please connect to a desktop first.');
      return;
    }
    setStreaming(true);
  }, [connectionStatus, setStreaming]);

  const handleStopStreaming = useCallback(() => {
    setStreaming(false);
  }, [setStreaming]);

  const handleFilterChange = useCallback((filters: FilterSettings[]) => {
    // Apply filters - this would update the frame processor
    console.log('Filters changed:', filters);
  }, []);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera Preview */}
      <CameraPreview isActive={true} />

      {/* Overlay Controls */}
      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>PenMedia</Text>
          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF5722' },
              ]}
            />
            <Text style={styles.connectionText}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
        <ControlPanel
          onToggleCamera={handleToggleCamera}
          onToggleFlash={handleToggleFlash}
          onStartStreaming={handleStartStreaming}
          onStopStreaming={handleStopStreaming}
        />

        {showFilters && <FilterSelector onFilterChange={handleFilterChange} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
