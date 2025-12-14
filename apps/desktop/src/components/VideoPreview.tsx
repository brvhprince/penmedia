import { useRef, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '../store/appStore';
import styles from './VideoPreview.module.css';

interface VideoPreviewProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export function VideoPreview({ videoRef }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { connectionStatus, connectedDevice, isVirtualCameraActive } = useAppStore();

  // Listen for video frames
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const unlisten = listen<string>('video-frame', (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Decode base64 frame
      const base64Data = event.payload;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${base64Data}`;
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [connectionStatus]);

  return (
    <div className={styles.container}>
      {connectionStatus === 'connected' ? (
        <>
          <canvas ref={canvasRef} className={styles.canvas} />
          {isVirtualCameraActive && (
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              LIVE
            </div>
          )}
          <div className={styles.overlay}>
            <div className={styles.deviceInfo}>
              <span className={styles.deviceName}>{connectedDevice?.deviceInfo.name}</span>
              <span className={styles.devicePlatform}>
                {connectedDevice?.deviceInfo.platform === 'ios' ? '🍎' : '🤖'}{' '}
                {connectedDevice?.deviceInfo.osVersion}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📱</div>
          <h3 className={styles.placeholderTitle}>No Camera Connected</h3>
          <p className={styles.placeholderText}>
            Connect your phone to start streaming
          </p>
        </div>
      )}
    </div>
  );
}
