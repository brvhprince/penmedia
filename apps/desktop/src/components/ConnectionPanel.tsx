import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import styles from './ConnectionPanel.module.css';

interface ConnectionInfo {
  session_id: string;
  device_info: {
    id: string;
    name: string;
    platform: string;
  };
  connected_at: number;
}

export function ConnectionPanel() {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('8765');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);

  const { connectionStatus, setConnectionStatus, setConnectedDevice } = useAppStore();

  // Poll for connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const info = await invoke<ConnectionInfo | null>('get_connection_info');
        if (info) {
          console.log('Device connected:', info);
          setConnectionStatus('connected');
          setConnectedDevice({
            sessionId: info.session_id,
            deviceInfo: info.device_info as never,
            connectedAt: info.connected_at,
          });
        } else if (connectionStatus === 'connected') {
          setConnectionStatus('disconnected');
          setConnectedDevice(null);
        }
      } catch (err) {
        console.error('Failed to get connection info:', err);
      }
    };

    // Check immediately
    checkConnection();

    // Then poll every 2 seconds
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [connectionStatus, setConnectionStatus, setConnectedDevice]);

  const handleConnect = async () => {
    if (!ipAddress) {
      setError('Please enter an IP address');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setConnectionStatus('connecting');

    try {
      const result = await invoke<{ sessionId: string; deviceInfo: unknown }>('connect_to_device', {
        host: ipAddress,
        port: parseInt(port, 10),
      });

      setConnectedDevice({
        sessionId: result.sessionId,
        deviceInfo: result.deviceInfo as never,
        connectedAt: Date.now(),
      });
    } catch (err) {
        console.log({err})
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await invoke('disconnect_from_device');
      setConnectedDevice(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handleStartServer = async () => {
    try {
      const info = await invoke<{ ip: string; port: number }>('start_server');
      console.log('Server started:', info);
      setServerInfo(info);
      setError(null);
    } catch (err) {
        console.error({err})
      setError(err instanceof Error ? err.message : 'Failed to start server');
    }
  };

  if (connectionStatus === 'connected') {
    return (
      <div className={styles.panel}>
        <div className={styles.connectedState}>
          <div className={styles.connectedIcon}>✓</div>
          <h3>Connected</h3>
          <p>Your phone camera is now streaming</p>
          <button className={styles.disconnectBtn} onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Connect Device</h3>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Start Server (Recommended)</h4>
        <p className={styles.sectionDesc}>
          Start a server and connect from your phone using this information
        </p>
        {!serverInfo ? (
          <button className={styles.primaryBtn} onClick={handleStartServer}>
            Start Server
          </button>
        ) : (
          <div className={styles.serverInfo}>
            <div className={styles.infoBox}>
              <h4>Server Running</h4>
              <div className={styles.infoRow}>
                <strong>IP Address:</strong> {serverInfo.ip}
              </div>
              <div className={styles.infoRow}>
                <strong>Port:</strong> {serverInfo.port}
              </div>
              <p className={styles.instruction}>
                On your phone app, go to Manual mode and enter:
              </p>
              <div className={styles.connectionString}>
                {serverInfo.ip}:{serverInfo.port}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
