import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { QRCodeDisplay } from '@components/index.ts';
import { useAppStore } from '@store/appStore';
import { StreamingService } from '@services/index.ts';
import { DEFAULT_PORT } from '@penmedia/protocol';

type ConnectionMode = 'qr' | 'manual';

export function ConnectScreen() {
  const [mode, setMode] = useState<ConnectionMode>('qr');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState(DEFAULT_PORT.toString());
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { setConnectionStatus, connectionStatus, videoSettings } = useAppStore();

  useEffect(() => {
    // Get local IP address for QR code
    getLocalIpAddress();

    // Set up StreamingService callbacks
    StreamingService.setCallbacks({
      onStatusChange: (status) => {
        console.log('Status changed to:', status);
        setConnectionStatus(status);
        if (status === 'connected') {
          setIsConnecting(false);
        } else if (status === 'error') {
          setIsConnecting(false);
        }
      },
      onStatsUpdate: (fps, bitrate, dropped) => {
        console.log(`Stats - FPS: ${fps}, Bitrate: ${bitrate}, Dropped: ${dropped}`);
      },
    });

    return () => {
      // Cleanup on unmount
      StreamingService.setCallbacks({});
    };
  }, [setConnectionStatus]);

  const getLocalIpAddress = async () => {
    try {
      const state = await NetInfo.fetch();
      // Try to get IP address from WiFi or Ethernet connection
      const details = state.details as any;
      const ip = details?.ipAddress;
      if (ip && typeof ip === 'string') {
        setLocalIp(ip);
        console.log('Local IP:', ip);
      } else {
        console.warn('Could not get local IP address');
        setLocalIp(null);
      }
    } catch (error) {
      console.error('Failed to get local IP:', error);
      setLocalIp(null);
    }
  };

  const handleConnect = async () => {
    if (!ipAddress) {
      Alert.alert('Error', 'Please enter an IP address');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      await StreamingService.connect(
        ipAddress,
        parseInt(port, 10),
        videoSettings
      );
      // Status will be updated via the onStatusChange callback
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
      Alert.alert('Connection Failed', 'Could not connect to the desktop app. Please check the IP address and try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await StreamingService.disconnect();
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect</Text>
        <Text style={styles.subtitle}>
          Connect your phone to the PenMedia desktop app
        </Text>
      </View>


      {/* Connection Content */}
      <View style={styles.content}>
        {connectionStatus === 'connected' ? (
          <View style={styles.connectedContainer}>
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedIcon}>✓</Text>
            </View>
            <Text style={styles.connectedText}>Connected</Text>
            <Text style={styles.connectedSubtext}>
              Your phone camera is now streaming to the desktop
            </Text>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <Text style={styles.inputLabel}>Desktop IP Address</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="e.g., 192.168.1.100"
              placeholderTextColor="#666"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder={DEFAULT_PORT.toString()}
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[
                styles.connectButton,
                isConnecting && styles.connectButtonDisabled,
              ]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.connectButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to connect:</Text>
        <Text style={styles.instructionStep}>
          1. Open PenMedia on your desktop and click "Start Server"
        </Text>
        <Text style={styles.instructionStep}>
          2. Copy the desktop IP address shown on your computer
        </Text>
        <Text style={styles.instructionStep}>
          3. Enter the desktop IP address above and click Connect
        </Text>
        <Text style={styles.instructionStep}>
          4. Start streaming your camera
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  manualContainer: {
    width: '100%',
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedContainer: {
    alignItems: 'center',
  },
  connectedBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  connectedIcon: {
    fontSize: 40,
    color: '#fff',
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectedSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  disconnectButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  disconnectText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  instructionsTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionStep: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
});
