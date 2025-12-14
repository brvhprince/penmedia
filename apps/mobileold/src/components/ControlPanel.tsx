import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useAppStore } from '@store/appStore';
import type { CameraPosition } from '@penmedia/shared-types';

interface ControlPanelProps {
  onToggleCamera: () => void;
  onToggleFlash: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
}

export function ControlPanel({
  onToggleCamera,
  onToggleFlash,
  onStartStreaming,
  onStopStreaming,
}: ControlPanelProps) {
  const { videoSettings, isStreaming, connectionStatus, fps, latency } = useAppStore();

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={[styles.statusValue, { color: connectionStatus === 'connected' ? '#4CAF50' : '#FF5722' }]}>
            {connectionStatus.toUpperCase()}
          </Text>
        </View>
        {isStreaming && (
          <>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>FPS</Text>
              <Text style={styles.statusValue}>{fps}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Latency</Text>
              <Text style={styles.statusValue}>{latency}ms</Text>
            </View>
          </>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onToggleCamera}
        >
          <Text style={styles.controlIcon}>🔄</Text>
          <Text style={styles.controlLabel}>
            {videoSettings.cameraPosition === 'back' ? 'Front' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, isStreaming && styles.mainButtonActive]}
          onPress={isStreaming ? onStopStreaming : onStartStreaming}
          disabled={connectionStatus !== 'connected'}
        >
          <Text style={styles.mainButtonText}>
            {isStreaming ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, videoSettings.flashEnabled && styles.controlButtonActive]}
          onPress={onToggleFlash}
        >
          <Text style={styles.controlIcon}>⚡</Text>
          <Text style={styles.controlLabel}>Flash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888',
    fontSize: 12,
  },
  statusValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonActive: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
