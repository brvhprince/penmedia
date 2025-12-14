import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import styles from './VirtualCameraPanel.module.css';

export function VirtualCameraPanel() {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    virtualCamera,
    setVirtualCamera,
    isVirtualCameraActive,
    setVirtualCameraActive,
    connectionStatus,
  } = useAppStore();

  useEffect(() => {
    checkVirtualCamera();
  }, []);

  const checkVirtualCamera = async () => {
    try {
      const camera = await invoke<{ id: string; name: string; installed: boolean } | null>(
        'get_virtual_camera_status'
      );
      if (camera) {
        setVirtualCamera({
          ...camera,
          active: isVirtualCameraActive,
          resolution: { width: 1280, height: 720 },
        });
      }
    } catch (err) {
      console.error('Failed to check virtual camera:', err);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);

    try {
      await invoke('install_virtual_camera');
      await checkVirtualCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleToggle = async () => {
    try {
      if (isVirtualCameraActive) {
        await invoke('stop_virtual_camera');
        setVirtualCameraActive(false);
      } else {
        await invoke('start_virtual_camera');
        setVirtualCameraActive(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle virtual camera');
    }
  };

  if (!virtualCamera?.installed) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>Virtual Camera</h3>
        <div className={styles.notInstalled}>
          <div className={styles.icon}>🎥</div>
          <p>Virtual camera driver is not installed</p>
          <button
            className={styles.installBtn}
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Install Driver'}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Virtual Camera</h3>

      <div className={styles.status}>
        <div className={styles.statusInfo}>
          <span className={styles.cameraName}>{virtualCamera.name}</span>
          <span className={`${styles.statusBadge} ${isVirtualCameraActive ? styles.active : ''}`}>
            {isVirtualCameraActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button
          className={`${styles.toggleBtn} ${isVirtualCameraActive ? styles.stop : styles.start}`}
          onClick={handleToggle}
          disabled={connectionStatus !== 'connected'}
        >
          {isVirtualCameraActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {connectionStatus !== 'connected' && (
        <p className={styles.hint}>
          Connect a device to enable virtual camera
        </p>
      )}

      {isVirtualCameraActive && (
        <div className={styles.info}>
          <p>
            Use <strong>"{virtualCamera.name}"</strong> as your camera in Zoom, Teams,
            or any other video app.
          </p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
