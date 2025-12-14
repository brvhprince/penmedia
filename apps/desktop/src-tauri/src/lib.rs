mod commands;
mod config;
mod connection;
mod error;
mod protocol;
mod server;
mod virtual_camera;

use commands::*;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize logger
            env_logger::init();

            // Initialize app state
            let state = AppState::new();
            app.manage(state);

            log::info!("PenMedia initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connect_to_device,
            get_connection_info,
            disconnect_from_device,
            start_server,
            stop_server,
            get_server_info,
            get_virtual_camera_status,
            install_virtual_camera,
            start_virtual_camera,
            stop_virtual_camera,
            get_config,
            save_config,
            generate_qr_code,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
