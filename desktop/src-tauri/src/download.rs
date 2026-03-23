use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::timeout;

use crate::binaries;

const MAX_CONCURRENT: usize = 6;
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(600); // 10 minutes
const PROGRESS_THROTTLE: f64 = 2.0; // Emit only when >= 2% change

// --- Types ---

#[derive(Debug, Clone, Deserialize)]
pub struct VideoItem {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DownloadRequest {
    pub videos: Vec<VideoItem>,
    pub format: String,
    pub download_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadEvent {
    pub index: usize,
    pub percent: f64,
    pub status: String,
    pub message: Option<String>,
}

pub struct DownloadState {
    processes: Arc<Mutex<HashMap<usize, Vec<u32>>>>, // index -> list of PIDs
    cancel_flag: Arc<Mutex<HashMap<usize, bool>>>,
}

impl Default for DownloadState {
    fn default() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            cancel_flag: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

fn emit_event(app: &tauri::AppHandle, index: usize, percent: f64, status: &str, message: Option<String>) {
    let _ = app.emit(
        "download:event",
        DownloadEvent {
            index,
            percent,
            status: status.to_string(),
            message,
        },
    );
}

/// Parse yt-dlp stderr progress line: "[download]  45.2%"
fn parse_ytdlp_progress(line: &str) -> Option<f64> {
    let re = Regex::new(r"\[download\]\s+([\d.]+)%").ok()?;
    let caps = re.captures(line)?;
    caps.get(1)?.as_str().parse::<f64>().ok()
}

/// Parse ffmpeg stderr progress: "size=   1234kB"
fn parse_ffmpeg_progress(line: &str, total_kb: f64) -> Option<f64> {
    let re = Regex::new(r"size=\s*(\d+)kB").ok()?;
    let caps = re.captures(line)?;
    let current_kb: f64 = caps.get(1)?.as_str().parse().ok()?;
    if total_kb > 0.0 {
        Some((current_kb / total_kb) * 100.0)
    } else {
        None
    }
}

/// Parse ffmpeg duration from stderr: "Duration: HH:MM:SS.xx"
fn parse_ffmpeg_duration(line: &str) -> Option<f64> {
    let re = Regex::new(r"Duration:\s*(\d+):(\d+):(\d+)").ok()?;
    let caps = re.captures(line)?;
    let h: f64 = caps.get(1)?.as_str().parse().ok()?;
    let m: f64 = caps.get(2)?.as_str().parse().ok()?;
    let s: f64 = caps.get(3)?.as_str().parse().ok()?;
    Some(h * 3600.0 + m * 60.0 + s)
}

/// Estimate file size in KB based on duration and format.
/// Same heuristic as server/src/functions/Functions.ts convertToKb()
fn estimate_size_kb(seconds: f64, format: &str) -> f64 {
    let rate = match format {
        "mp3" => 15.65,
        "mp4" => 90.0,
        _ => 15.65,
    };
    seconds * rate
}

fn sanitize_filename(name: &str) -> String {
    let re = Regex::new(r"[^\w ]").unwrap();
    re.replace_all(name, "").to_string()
}

async fn register_pid(state: &DownloadState, index: usize, pid: u32) {
    let mut procs = state.processes.lock().await;
    procs.entry(index).or_default().push(pid);
}

async fn is_cancelled(state: &DownloadState, index: usize) -> bool {
    let flags = state.cancel_flag.lock().await;
    flags.get(&index).copied().unwrap_or(false)
}

async fn kill_processes(state: &DownloadState, index: usize) {
    let mut procs = state.processes.lock().await;
    if let Some(pids) = procs.remove(&index) {
        for pid in pids {
            #[cfg(unix)]
            {
                unsafe {
                    libc::kill(pid as i32, libc::SIGKILL);
                }
            }
            #[cfg(windows)]
            {
                let _ = Command::new("taskkill")
                    .args(&["/PID", &pid.to_string(), "/F"])
                    .output()
                    .await;
            }
        }
    }
}

// --- Download MP3: yt-dlp audio stream piped to ffmpeg ---

async fn download_mp3(
    app: &tauri::AppHandle,
    state: &DownloadState,
    video: &VideoItem,
    output: &str,
    index: usize,
    ytdlp_path: &Path,
    ffmpeg_path: &Path,
) -> Result<(), String> {
    // Use std::process for yt-dlp so we can pipe its stdout to ffmpeg's stdin
    let mut ytdlp_std = std::process::Command::new(ytdlp_path)
        .args(["--format", "bestaudio", "--output", "-", "--no-playlist", &video.url])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {e}"))?;

    let ytdlp_pid = ytdlp_std.id();
    register_pid(state, index, ytdlp_pid).await;

    let ytdlp_stdout = ytdlp_std
        .stdout
        .take()
        .ok_or("Failed to get yt-dlp stdout")?;

    // Spawn ffmpeg with yt-dlp's stdout as stdin (using std handles for piping)
    let mut ffmpeg_proc = Command::new(ffmpeg_path)
        .args(["-i", "pipe:0", "-f", "mp3", "-y", output])
        .stdin(ytdlp_stdout)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {e}"))?;

    if let Some(pid) = ffmpeg_proc.id() {
        register_pid(state, index, pid).await;
    }

    let stderr = ffmpeg_proc
        .stderr
        .take()
        .ok_or("Failed to get ffmpeg stderr")?;

    // Parse ffmpeg progress from stderr
    let mut reader = BufReader::new(stderr).lines();
    let mut last_emitted: f64 = 0.0;
    let mut total_kb: f64 = 0.0;

    while let Ok(Some(line)) = reader.next_line().await {
        if is_cancelled(state, index).await {
            kill_processes(state, index).await;
            return Err("cancelled".into());
        }

        // Try to get duration for size estimation
        if total_kb == 0.0 {
            if let Some(duration) = parse_ffmpeg_duration(&line) {
                total_kb = estimate_size_kb(duration, "mp3");
            }
        }

        if let Some(percent) = parse_ffmpeg_progress(&line, total_kb) {
            let percent = percent.min(100.0);
            if percent - last_emitted >= PROGRESS_THROTTLE || percent >= 100.0 {
                last_emitted = percent;
                emit_event(app, index, percent, "progress", None);
            }
        }
    }

    let status = ffmpeg_proc
        .wait()
        .await
        .map_err(|e| format!("ffmpeg wait failed: {e}"))?;

    // Also wait for yt-dlp to finish
    let _ = tokio::task::spawn_blocking(move || ytdlp_std.wait()).await;

    if status.success() {
        Ok(())
    } else {
        Err(format!("ffmpeg exited with code {}", status))
    }
}

// --- Download MP4: yt-dlp handles merging ---

async fn download_mp4(
    app: &tauri::AppHandle,
    state: &DownloadState,
    video: &VideoItem,
    output: &str,
    index: usize,
    ytdlp_path: &Path,
    ffmpeg_path: &Path,
) -> Result<(), String> {
    let ffmpeg_dir = ffmpeg_path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut proc = Command::new(ytdlp_path)
        .args(&[
            "--format",
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--merge-output-format",
            "mp4",
            "--ffmpeg-location",
            &ffmpeg_dir,
            "--no-playlist",
            "-o",
            output,
            &video.url,
        ])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {e}"))?;

    if let Some(pid) = proc.id() {
        register_pid(state, index, pid).await;
    }

    let stderr = proc.stderr.take().ok_or("Failed to get yt-dlp stderr")?;
    let mut reader = BufReader::new(stderr).lines();
    let mut last_emitted: f64 = 0.0;

    while let Ok(Some(line)) = reader.next_line().await {
        if is_cancelled(state, index).await {
            kill_processes(state, index).await;
            return Err("cancelled".into());
        }

        if let Some(percent) = parse_ytdlp_progress(&line) {
            if percent - last_emitted >= PROGRESS_THROTTLE || percent >= 100.0 {
                last_emitted = percent;
                emit_event(app, index, percent, "progress", None);
            }
        }
    }

    let status = proc
        .wait()
        .await
        .map_err(|e| format!("yt-dlp wait failed: {e}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("yt-dlp exited with code {}", status))
    }
}

// --- Tauri Commands ---

#[tauri::command]
pub async fn start_download(
    app: tauri::AppHandle,
    state: tauri::State<'_, DownloadState>,
    request: DownloadRequest,
) -> Result<(), String> {
    let download_path = Path::new(&request.download_path);
    if !download_path.is_dir() {
        return Err("invalid_path".into());
    }

    let ytdlp_path = binaries::resolve_binary_path(&app, "yt-dlp")
        .ok_or("yt-dlp not found")?;
    let ffmpeg_path = binaries::resolve_binary_path(&app, "ffmpeg")
        .ok_or("ffmpeg not found")?;

    // Clear previous state
    {
        let mut procs = state.processes.lock().await;
        procs.clear();
        let mut flags = state.cancel_flag.lock().await;
        flags.clear();
    }

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT));
    let processes = state.processes.clone();
    let cancel_flag = state.cancel_flag.clone();

    let state_for_tasks = DownloadState {
        processes,
        cancel_flag,
    };
    let state_arc = Arc::new(state_for_tasks);

    let mut handles = Vec::new();

    for (index, video) in request.videos.iter().enumerate() {
        let app = app.clone();
        let video = video.clone();
        let format = request.format.clone();
        let download_path = request.download_path.clone();
        let ytdlp = ytdlp_path.clone();
        let ffmpeg = ffmpeg_path.clone();
        let sem = semaphore.clone();
        let state = state_arc.clone();

        let handle = tokio::spawn(async move {
            // Wait for a permit (concurrency limit)
            let _permit = sem.acquire().await.expect("semaphore closed");

            if is_cancelled(&state, index).await {
                emit_event(&app, index, 0.0, "error", Some("cancelled".into()));
                return;
            }

            let name = sanitize_filename(&video.name);
            let output = format!("{}/{}.{}", download_path, name, format);

            emit_event(&app, index, 0.0, "start", None);

            let result = timeout(DOWNLOAD_TIMEOUT, async {
                match format.as_str() {
                    "mp3" => {
                        download_mp3(&app, &state, &video, &output, index, &ytdlp, &ffmpeg)
                            .await
                    }
                    "mp4" => {
                        download_mp4(&app, &state, &video, &output, index, &ytdlp, &ffmpeg)
                            .await
                    }
                    _ => Err(format!("Unsupported format: {format}")),
                }
            })
            .await;

            // Clean up process references
            {
                let mut procs = state.processes.lock().await;
                procs.remove(&index);
            }

            match result {
                Ok(Ok(())) => {
                    emit_event(&app, index, 100.0, "finished", None);
                }
                Ok(Err(e)) => {
                    emit_event(&app, index, 0.0, "error", Some(e));
                }
                Err(_) => {
                    kill_processes(&state, index).await;
                    emit_event(
                        &app,
                        index,
                        0.0,
                        "error",
                        Some(format!("Download timeout (index {index})")),
                    );
                }
            }
        });

        handles.push(handle);
    }

    // Wait for all downloads in background (don't block the command response)
    tokio::spawn(async move {
        for handle in handles {
            let _ = handle.await;
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_download(
    state: tauri::State<'_, DownloadState>,
    index: usize,
) -> Result<(), String> {
    {
        let mut flags = state.cancel_flag.lock().await;
        flags.insert(index, true);
    }
    kill_processes(&state, index).await;
    Ok(())
}

#[tauri::command]
pub async fn cancel_all_downloads(
    state: tauri::State<'_, DownloadState>,
) -> Result<(), String> {
    let indices: Vec<usize> = {
        let procs = state.processes.lock().await;
        procs.keys().copied().collect()
    };

    {
        let mut flags = state.cancel_flag.lock().await;
        for &idx in &indices {
            flags.insert(idx, true);
        }
    }

    for idx in indices {
        kill_processes(&state, idx).await;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ytdlp_progress() {
        assert_eq!(
            parse_ytdlp_progress("[download]  45.2% of ~  10.00MiB at  1.23MiB/s"),
            Some(45.2)
        );
        assert_eq!(
            parse_ytdlp_progress("[download] 100% of 10.00MiB"),
            Some(100.0)
        );
        assert_eq!(
            parse_ytdlp_progress("[download]   0.0% of ~  10.00MiB"),
            Some(0.0)
        );
        assert_eq!(parse_ytdlp_progress("[info] Downloading video"), None);
        assert_eq!(parse_ytdlp_progress("random text"), None);
    }

    #[test]
    fn test_parse_ffmpeg_progress() {
        assert_eq!(
            parse_ffmpeg_progress("size=    500kB time=00:00:32.00 bitrate= 128.0kbits/s", 1000.0),
            Some(50.0)
        );
        assert_eq!(
            parse_ffmpeg_progress("size=   1000kB time=00:01:04.00", 1000.0),
            Some(100.0)
        );
        assert_eq!(
            parse_ffmpeg_progress("no size info here", 1000.0),
            None
        );
        // Zero total should return None
        assert_eq!(
            parse_ffmpeg_progress("size=    500kB", 0.0),
            None
        );
    }

    #[test]
    fn test_parse_ffmpeg_duration() {
        assert_eq!(
            parse_ffmpeg_duration("  Duration: 00:03:45.67, start: 0.000000"),
            Some(225.0)
        );
        assert_eq!(
            parse_ffmpeg_duration("  Duration: 01:00:00.00"),
            Some(3600.0)
        );
        assert_eq!(parse_ffmpeg_duration("no duration here"), None);
    }

    #[test]
    fn test_estimate_size_kb() {
        // 60 seconds of mp3 at 15.65 kb/s
        assert_eq!(estimate_size_kb(60.0, "mp3"), 60.0 * 15.65);
        // 60 seconds of mp4 at 90 kb/s
        assert_eq!(estimate_size_kb(60.0, "mp4"), 60.0 * 90.0);
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Hello World"), "Hello World");
        assert_eq!(sanitize_filename("Test|File/Name"), "TestFileName");
        assert_eq!(sanitize_filename("The Beatles - Help!"), "The Beatles  Help");
    }
}
