import { VideoPreview, ConnectionPanel, VirtualCameraPanel } from '../components';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.mainColumn}>
        <div className={styles.previewContainer}>
          <VideoPreview />
        </div>
      </div>

      <div className={styles.sideColumn}>
        <ConnectionPanel />
        <VirtualCameraPanel />
      </div>
    </div>
  );
}
