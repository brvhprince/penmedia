import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StreamingService } from '@services/StreamingService';

interface QRCodeDisplayProps {
  ipAddress: string;
  port: number;
}

export function QRCodeDisplay({ ipAddress, port }: QRCodeDisplayProps) {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        await StreamingService.initialize();
        const value = StreamingService.generateQRCode(ipAddress, port);
        setQrValue(value);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error(err);
      }
    };

    generateQR();
  }, [ipAddress, port]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!qrValue) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Generating QR Code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrValue}
          size={200}
          backgroundColor="white"
          color="black"
        />
      </View>
      <Text style={styles.instructions}>
        Scan this QR code with the PenMedia desktop app to connect
      </Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>IP Address</Text>
        <Text style={styles.infoValue}>{ipAddress}</Text>
        <Text style={styles.infoLabel}>Port</Text>
        <Text style={styles.infoValue}>{port}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  instructions: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
});
