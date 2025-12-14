import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import styles from './ConnectionPanel.module.css';

export function ConnectionPanel() {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('8765');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connectionStatus, setConnectionStatus, setConnectedDevice } = useAppStore();

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
      const serverInfo = await invoke<{ ip: string; port: number }>('start_server');
      console.log('Server started:', serverInfo);
    } catch (err) {
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
          Start a server and scan the QR code from your phone
        </p>
        <button className={styles.primaryBtn} onClick={handleStartServer}>
          Start Server
        </button>
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Connect Manually</h4>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Phone IP Address</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.100"
              disabled={isConnecting}
            />
          </div>
          <div className={styles.field}>
            <label>Port</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8765"
              disabled={isConnecting}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            className={styles.connectBtn}
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
