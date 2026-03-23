mod binaries;
mod download;
mod youtube;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(download::DownloadState::default())
        .invoke_handler(tauri::generate_handler![
            binaries::check_binaries,
            youtube::resolve_url,
            youtube::get_video_info,
            youtube::search_videos,
            download::start_download,
            download::cancel_download,
            download::cancel_all_downloads,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
