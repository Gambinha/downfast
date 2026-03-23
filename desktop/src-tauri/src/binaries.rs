use std::path::PathBuf;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BinaryStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub ytdlp_path: Option<String>,
    pub ffmpeg_path: Option<String>,
}

/// Resolve the path to a sidecar binary bundled with the app.
/// In dev mode, sidecars are in src-tauri/binaries/ with the target triple suffix.
/// In production, Tauri places them next to the main executable.
pub fn resolve_binary_path(app: &tauri::AppHandle, name: &str) -> Option<PathBuf> {
    // Try sidecar path (next to executable)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            let candidate = exe_dir.join(name);
            if candidate.exists() {
                return Some(candidate);
            }

            // With platform extension (Windows)
            let candidate_exe = exe_dir.join(format!("{name}.exe"));
            if candidate_exe.exists() {
                return Some(candidate_exe);
            }
        }
    }

    // Try resource dir (Tauri bundled resources)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidate = resource_dir.join(name);
        if candidate.exists() {
            return Some(candidate);
        }
    }

    // Fallback: system PATH
    which_binary(name)
}

fn which_binary(name: &str) -> Option<PathBuf> {
    std::env::var_os("PATH").and_then(|paths| {
        std::env::split_paths(&paths)
            .map(|dir| dir.join(name))
            .find(|p| p.exists())
    })
}

use tauri::Manager;

#[tauri::command]
pub async fn check_binaries(app: tauri::AppHandle) -> Result<BinaryStatus, String> {
    let ytdlp = resolve_binary_path(&app, "yt-dlp");
    let ffmpeg = resolve_binary_path(&app, "ffmpeg");

    Ok(BinaryStatus {
        ytdlp: ytdlp.is_some(),
        ffmpeg: ffmpeg.is_some(),
        ytdlp_path: ytdlp.map(|p| p.to_string_lossy().into_owned()),
        ffmpeg_path: ffmpeg.map(|p| p.to_string_lossy().into_owned()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_which_binary_finds_common_tools() {
        // ls should exist on any Linux/macOS system
        let result = which_binary("ls");
        assert!(result.is_some());
    }

    #[test]
    fn test_which_binary_returns_none_for_nonexistent() {
        let result = which_binary("definitely_not_a_real_binary_12345");
        assert!(result.is_none());
    }
}
