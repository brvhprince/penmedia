use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub auto_connect: bool,
    pub start_minimized: bool,
    pub launch_on_startup: bool,
    pub default_port: u16,
    pub last_connected_device: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            auto_connect: true,
            start_minimized: false,
            launch_on_startup: false,
            default_port: 8765,
            last_connected_device: None,
        }
    }
}

impl AppConfig {
    pub fn config_path() -> AppResult<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| AppError::ConfigError("Could not find config directory".into()))?;
        Ok(config_dir.join("penmedia").join("config.json"))
    }

    pub fn load() -> AppResult<Self> {
        let path = Self::config_path()?;

        if !path.exists() {
            return Ok(Self::default());
        }

        let content = fs::read_to_string(&path)?;
        let config: Self = serde_json::from_str(&content)?;
        Ok(config)
    }

    pub fn save(&self) -> AppResult<()> {
        let path = Self::config_path()?;

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        fs::write(&path, content)?;
        Ok(())
    }
}
