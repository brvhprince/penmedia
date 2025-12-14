import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './SettingsPage.module.css';

interface AppConfig {
  autoConnect: boolean;
  startMinimized: boolean;
  launchOnStartup: boolean;
  defaultPort: number;
}

export function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>({
    autoConnect: true,
    startMinimized: false,
    launchOnStartup: false,
    defaultPort: 8765,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await invoke<AppConfig>('get_config');
      setConfig(savedConfig);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    setIsSaving(true);
    try {
      await invoke('save_config', { config: newConfig });
      setConfig(newConfig);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof AppConfig) => {
    const newConfig = { ...config, [key]: !config[key] };
    saveConfig(newConfig);
  };

  const handlePortChange = (value: string) => {
    const port = parseInt(value, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      saveConfig({ ...config, defaultPort: port });
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connection</h2>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Auto-connect</span>
            <span className={styles.settingDesc}>
              Automatically connect to the last used device
            </span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={config.autoConnect}
              onChange={() => handleToggle('autoConnect')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Default Port</span>
            <span className={styles.settingDesc}>
              Port number for incoming connections
            </span>
          </div>
          <input
            type="number"
            className={styles.portInput}
            value={config.defaultPort}
            onChange={(e) => handlePortChange(e.target.value)}
            min={1024}
            max={65535}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Application</h2>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Start minimized</span>
            <span className={styles.settingDesc}>
              Start the app in the system tray
            </span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={config.startMinimized}
              onChange={() => handleToggle('startMinimized')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Launch on startup</span>
            <span className={styles.settingDesc}>
              Start PenMedia when your computer boots
            </span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={config.launchOnStartup}
              onChange={() => handleToggle('launchOnStartup')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>

        <div className={styles.about}>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Version</span>
            <span className={styles.aboutValue}>0.1.0</span>
          </div>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Protocol Version</span>
            <span className={styles.aboutValue}>1.0.0</span>
          </div>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Tauri</span>
            <span className={styles.aboutValue}>2.0.0</span>
          </div>
        </div>
      </section>

      {isSaving && (
        <div className={styles.savingIndicator}>Saving...</div>
      )}
    </div>
  );
}
