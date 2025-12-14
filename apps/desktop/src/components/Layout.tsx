import { Outlet, NavLink } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import styles from './Layout.module.css';

export function Layout() {
  const { connectionStatus, connectedDevice, stats, sidebarCollapsed, setSidebarCollapsed } =
    useAppStore();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📷</span>
          {!sidebarCollapsed && <span className={styles.logoText}>PenMedia</span>}
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>🎥</span>
            {!sidebarCollapsed && <span>Preview</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>⚙️</span>
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.connectionStatus}>
            <span
              className={`${styles.statusDot} ${
                connectionStatus === 'connected' ? styles.connected : ''
              }`}
            />
            <span className={styles.statusText}>
              {connectionStatus === 'connected'
                ? `Connected to ${connectedDevice?.deviceInfo.name}`
                : 'Disconnected'}
            </span>
          </div>

          {connectionStatus === 'connected' && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.fps}</span>
                <span className={styles.statLabel}>FPS</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {(stats.bitrate / 1000000).toFixed(1)}
                </span>
                <span className={styles.statLabel}>Mbps</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.latency}</span>
                <span className={styles.statLabel}>ms</span>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
