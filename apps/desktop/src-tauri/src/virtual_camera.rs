use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualCameraInfo {
    pub id: String,
    pub name: String,
    pub installed: bool,
}

pub struct VirtualCamera {
    info: Option<VirtualCameraInfo>,
    is_active: bool,
    frame_rx: Option<mpsc::Receiver<Vec<u8>>>,
}

impl VirtualCamera {
    pub fn new() -> Self {
        Self {
            info: None,
            is_active: false,
            frame_rx: None,
        }
    }

    pub fn check_installed(&self) -> Option<VirtualCameraInfo> {
        // Platform-specific implementation to check if virtual camera is installed
        #[cfg(target_os = "windows")]
        {
            self.check_installed_windows()
        }

        #[cfg(target_os = "macos")]
        {
            self.check_installed_macos()
        }

        #[cfg(target_os = "linux")]
        {
            self.check_installed_linux()
        }
    }

    #[cfg(target_os = "windows")]
    fn check_installed_windows(&self) -> Option<VirtualCameraInfo> {
        // Check for DirectShow virtual camera filter
        // This is a simplified check - real implementation would query the registry
        Some(VirtualCameraInfo {
            id: "penmedia-vcam-win".to_string(),
            name: "PenMedia Camera".to_string(),
            installed: false, // TODO: Actually check registry
        })
    }

    #[cfg(target_os = "macos")]
    fn check_installed_macos(&self) -> Option<VirtualCameraInfo> {
        // Check for CoreMediaIO plugin
        let plugin_path = "/Library/CoreMediaIO/Plug-Ins/DAL/PenMediaCamera.plugin";
        let installed = std::path::Path::new(plugin_path).exists();

        Some(VirtualCameraInfo {
            id: "penmedia-vcam-mac".to_string(),
            name: "PenMedia Camera".to_string(),
            installed,
        })
    }

    #[cfg(target_os = "linux")]
    fn check_installed_linux(&self) -> Option<VirtualCameraInfo> {
        // Check for v4l2loopback module
        let module_loaded = std::process::Command::new("lsmod")
            .output()
            .map(|output| String::from_utf8_lossy(&output.stdout).contains("v4l2loopback"))
            .unwrap_or(false);

        Some(VirtualCameraInfo {
            id: "penmedia-vcam-linux".to_string(),
            name: "PenMedia Camera".to_string(),
            installed: module_loaded,
        })
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    fn check_installed_other(&self) -> Option<VirtualCameraInfo> {
        None
    }

    pub fn info(&self) -> Option<&VirtualCameraInfo> {
        self.info.as_ref()
    }

    pub fn is_active(&self) -> bool {
        self.is_active
    }

    pub async fn install(&mut self) -> AppResult<()> {
        #[cfg(target_os = "linux")]
        {
            // Try to load v4l2loopback module
            let result = tokio::process::Command::new("sudo")
                .args(["modprobe", "v4l2loopback", "devices=1", "video_nr=10", "card_label=PenMedia Camera", "exclusive_caps=1"])
                .output()
                .await
                .map_err(|e| AppError::VirtualCameraError(e.to_string()))?;

            if !result.status.success() {
                return Err(AppError::VirtualCameraError(
                    "Failed to load v4l2loopback module. Please install it first: sudo apt install v4l2loopback-dkms".into()
                ));
            }

            self.info = self.check_installed();
            return Ok(());
        }

        #[cfg(target_os = "windows")]
        {
            // Windows requires installing a DirectShow filter
            // This would typically involve running an installer
            return Err(AppError::VirtualCameraError(
                "Please download and run the PenMedia Camera installer for Windows".into()
            ));
        }

        #[cfg(target_os = "macos")]
        {
            // macOS requires installing a CoreMediaIO plugin
            return Err(AppError::VirtualCameraError(
                "Please download and run the PenMedia Camera installer for macOS".into()
            ));
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Err(AppError::VirtualCameraError("Unsupported platform".into()))
        }
    }

    pub async fn start(&mut self, frame_rx: mpsc::Receiver<Vec<u8>>) -> AppResult<()> {
        if self.is_active {
            return Ok(());
        }

        let info = self.check_installed()
            .ok_or_else(|| AppError::VirtualCameraError("Virtual camera not installed".into()))?;

        if !info.installed {
            return Err(AppError::VirtualCameraError("Virtual camera not installed".into()));
        }

        self.frame_rx = Some(frame_rx);
        self.is_active = true;
        self.info = Some(info);

        // Start the frame processing loop
        // In a real implementation, this would write frames to the virtual camera device
        log::info!("Virtual camera started");

        Ok(())
    }

    pub fn stop(&mut self) {
        self.is_active = false;
        self.frame_rx = None;
        log::info!("Virtual camera stopped");
    }
}

#[cfg(target_os = "linux")]
pub fn get_v4l2_device() -> Option<String> {
    // Find the v4l2loopback device
    for i in 0..20 {
        let device = format!("/dev/video{}", i);
        if std::path::Path::new(&device).exists() {
            // Check if it's a v4l2loopback device
            if let Ok(output) = std::process::Command::new("v4l2-ctl")
                .args(["--device", &device, "--info"])
                .output()
            {
                if String::from_utf8_lossy(&output.stdout).contains("PenMedia") {
                    return Some(device);
                }
            }
        }
    }
    None
}
