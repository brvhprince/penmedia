import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import styles from './VideoPreview.module.css';

interface VideoPreviewProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export function VideoPreview({ videoRef }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { connectionStatus, connectedDevice, isVirtualCameraActive } = useAppStore();

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
