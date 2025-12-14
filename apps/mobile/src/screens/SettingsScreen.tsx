import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@store/appStore';
import { STANDARD_RESOLUTIONS, type Resolution } from '@penmedia/shared-types';

export function SettingsScreen() {
  const { videoSettings, updateVideoSettings } = useAppStore();

  const handleResolutionChange = (resolution: Resolution) => {
    updateVideoSettings({ resolution });
  };

  const handleFrameRateChange = (frameRate: number) => {
    updateVideoSettings({ frameRate });
  };

  const handleMirrorToggle = () => {
    updateVideoSettings({ mirror: !videoSettings.mirror });
  };

  const handleAutoFocusToggle = () => {
    updateVideoSettings({ autoFocus: !videoSettings.autoFocus });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Video Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Quality</Text>

          <Text style={styles.label}>Resolution</Text>
          <View style={styles.optionGroup}>
            {STANDARD_RESOLUTIONS.map(res => (
              <TouchableOpacity
                key={res.label}
                style={[
                  styles.optionButton,
                  videoSettings.resolution.label === res.label && styles.optionButtonActive,
                ]}
                onPress={() => handleResolutionChange(res)}
              >
                <Text
                  style={[
                    styles.optionText,
                    videoSettings.resolution.label === res.label && styles.optionTextActive,
                  ]}
                >
                  {res.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Frame Rate</Text>
          <View style={styles.optionGroup}>
            {[15, 24, 30, 60].map(fps => (
              <TouchableOpacity
                key={fps}
                style={[
                  styles.optionButton,
                  videoSettings.frameRate === fps && styles.optionButtonActive,
                ]}
                onPress={() => handleFrameRateChange(fps)}
              >
                <Text
                  style={[
                    styles.optionText,
                    videoSettings.frameRate === fps && styles.optionTextActive,
                  ]}
                >
                  {fps} FPS
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Camera Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Camera</Text>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mirror Preview</Text>
              <Text style={styles.switchDescription}>
                Flip the camera preview horizontally
              </Text>
            </View>
            <Switch
              value={videoSettings.mirror}
              onValueChange={handleMirrorToggle}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Auto Focus</Text>
              <Text style={styles.switchDescription}>
                Automatically adjust focus
              </Text>
            </View>
            <Switch
              value={videoSettings.autoFocus}
              onValueChange={handleAutoFocusToggle}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Bitrate Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaming</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bitrate</Text>
            <Text style={styles.infoValue}>
              {(videoSettings.bitrate / 1000000).toFixed(1)} Mbps
            </Text>
          </View>
          <Text style={styles.infoDescription}>
            Bitrate is automatically adjusted based on resolution and frame rate
          </Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>0.1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Protocol Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    padding: 24,
    paddingTop: 0,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#888',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
  switchDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
  },
  infoDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});
