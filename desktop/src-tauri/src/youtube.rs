use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::process::Command;

use crate::binaries;

// --- Types ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub name: String,
    pub url: String,
    pub embed_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedVideos {
    pub videos: Vec<VideoInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub video_id: String,
    pub title: String,
    pub channel: String,
    pub thumbnail: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ParsedUrl {
    Video {
        video_id: String,
        canonical_url: String,
    },
    Playlist {
        playlist_id: String,
        source: String, // "music" or "youtube"
    },
}

// --- URL Parsing (ported from server/src/utils/youtubeUrl.ts) ---

pub fn parse_youtube_url(raw: &str) -> Result<ParsedUrl, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("invalid_url".into());
    }

    let normalized = if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        format!("https://{trimmed}")
    } else {
        trimmed.to_string()
    };

    let url = url::Url::parse(&normalized).map_err(|_| "invalid_url".to_string())?;

    let host = url
        .host_str()
        .unwrap_or("")
        .trim_start_matches("www.");
    let is_music = host == "music.youtube.com";
    let is_youtube = host == "youtube.com" || host == "youtu.be";

    if !is_music && !is_youtube {
        return Err("invalid_url".into());
    }

    let list_param: Option<String> = url
        .query_pairs()
        .find(|(k, _)| k == "list")
        .map(|(_, v)| v.to_string());

    let video_id: Option<String> = if host == "youtu.be" {
        let path = url.path().trim_start_matches('/');
        if path.is_empty() {
            None
        } else {
            Some(path.to_string())
        }
    } else {
        url.query_pairs()
            .find(|(k, _)| k == "v")
            .map(|(_, v)| v.to_string())
    };

    if let Some(ref list_id) = list_param {
        if list_id.len() <= 13 {
            // Short ID = MIX; if a video is also present, treat as video
            if let Some(ref vid) = video_id {
                let canonical_url = if is_music {
                    format!("https://music.youtube.com/watch?v={vid}")
                } else {
                    format!("https://www.youtube.com/watch?v={vid}")
                };
                return Ok(ParsedUrl::Video {
                    video_id: vid.clone(),
                    canonical_url,
                });
            }
            return Err("playlist_too_short".into());
        }
        return Ok(ParsedUrl::Playlist {
            playlist_id: list_id.clone(),
            source: if is_music {
                "music".into()
            } else {
                "youtube".into()
            },
        });
    }

    if let Some(vid) = video_id {
        let canonical_url = if is_music {
            format!("https://music.youtube.com/watch?v={vid}")
        } else {
            format!("https://www.youtube.com/watch?v={vid}")
        };
        return Ok(ParsedUrl::Video {
            video_id: vid,
            canonical_url,
        });
    }

    Err("invalid_url".into())
}

pub fn build_embed_url(video_id: &str) -> String {
    format!("https://www.youtube.com/embed/{video_id}")
}

pub fn sanitize_name(title: &str) -> String {
    let re = Regex::new(r"[^\w ]").unwrap();
    re.replace_all(title, "").to_string()
}

// --- yt-dlp execution helpers ---

fn get_ytdlp_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    binaries::resolve_binary_path(app, "yt-dlp").ok_or_else(|| "yt-dlp not found".to_string())
}

async fn run_ytdlp_json(
    ytdlp_path: &PathBuf,
    args: &[&str],
) -> Result<serde_json::Value, String> {
    let output = Command::new(ytdlp_path)
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Failed to run yt-dlp: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse yt-dlp JSON: {e}"))
}

// --- Tauri Commands ---

#[tauri::command]
pub async fn get_video_info(
    app: tauri::AppHandle,
    id: String,
) -> Result<VideoInfo, String> {
    let ytdlp = get_ytdlp_path(&app)?;
    let json = run_ytdlp_json(&ytdlp, &["--dump-single-json", "--no-playlist", &id]).await?;

    let title = json["title"]
        .as_str()
        .ok_or("Missing title in yt-dlp response")?;
    let video_id = json["id"]
        .as_str()
        .unwrap_or(&id);

    Ok(VideoInfo {
        name: sanitize_name(title),
        url: format!("https://www.youtube.com/watch?v={video_id}"),
        embed_url: build_embed_url(video_id),
    })
}

#[tauri::command]
pub async fn resolve_url(
    app: tauri::AppHandle,
    url: String,
) -> Result<ResolvedVideos, String> {
    let parsed = parse_youtube_url(&url)?;
    let ytdlp = get_ytdlp_path(&app)?;

    match parsed {
        ParsedUrl::Video {
            video_id,
            canonical_url,
        } => {
            let json =
                run_ytdlp_json(&ytdlp, &["--dump-single-json", "--no-playlist", &video_id])
                    .await?;
            let title = json["title"]
                .as_str()
                .ok_or("Missing title")?;

            Ok(ResolvedVideos {
                videos: vec![VideoInfo {
                    name: sanitize_name(title),
                    url: canonical_url,
                    embed_url: build_embed_url(&video_id),
                }],
            })
        }
        ParsedUrl::Playlist {
            playlist_id,
            source,
        } => {
            let domain = if source == "music" {
                "music.youtube.com"
            } else {
                "www.youtube.com"
            };
            let playlist_url = format!("https://{domain}/playlist?list={playlist_id}");

            let json = run_ytdlp_json(
                &ytdlp,
                &[
                    "--dump-single-json",
                    "--flat-playlist",
                    "--yes-playlist",
                    &playlist_url,
                ],
            )
            .await?;

            let entries = json["entries"]
                .as_array()
                .ok_or("No entries in playlist")?;

            let videos = entries
                .iter()
                .filter_map(|entry| {
                    let title = entry["title"].as_str()?;
                    let entry_url = entry["url"]
                        .as_str()
                        .or_else(|| entry["webpage_url"].as_str())?;

                    // Extract video ID from URL
                    let vid_id = if let Ok(u) = url::Url::parse(entry_url) {
                        u.query_pairs()
                            .find(|(k, _)| k == "v")
                            .map(|(_, v)| v.to_string())
                            .unwrap_or_else(|| {
                                u.path().split('/').last().unwrap_or("").to_string()
                            })
                    } else {
                        entry["id"].as_str().unwrap_or("").to_string()
                    };

                    Some(VideoInfo {
                        name: sanitize_name(title),
                        url: entry_url.to_string(),
                        embed_url: build_embed_url(&vid_id),
                    })
                })
                .collect();

            Ok(ResolvedVideos { videos })
        }
    }
}

#[tauri::command]
pub async fn search_videos(
    app: tauri::AppHandle,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<SearchResult>, String> {
    let ytdlp = get_ytdlp_path(&app)?;
    let limit = limit.unwrap_or(6);
    let search_query = format!("ytsearch{limit}:{query}");

    let json = run_ytdlp_json(
        &ytdlp,
        &[
            "--dump-single-json",
            "--no-playlist",
            "--flat-playlist",
            &search_query,
        ],
    )
    .await?;

    let entries = json["entries"]
        .as_array()
        .map(|e| e.as_slice())
        .unwrap_or_else(|| std::slice::from_ref(&json));

    let results = entries
        .iter()
        .filter_map(|v| {
            let id = v["id"].as_str()?;
            let title = v["title"].as_str().unwrap_or("Unknown");
            let channel = v["uploader"]
                .as_str()
                .or_else(|| v["channel"].as_str())
                .unwrap_or("Unknown");
            let thumbnail = v["thumbnail"].as_str().unwrap_or("");

            Some(SearchResult {
                video_id: id.to_string(),
                title: title.to_string(),
                channel: channel.to_string(),
                thumbnail: thumbnail.to_string(),
            })
        })
        .collect();

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_youtube_url_standard_video() {
        let result = parse_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ").unwrap();
        assert_eq!(
            result,
            ParsedUrl::Video {
                video_id: "dQw4w9WgXcQ".into(),
                canonical_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ".into(),
            }
        );
    }

    #[test]
    fn test_parse_youtube_url_short_url() {
        let result = parse_youtube_url("https://youtu.be/dQw4w9WgXcQ").unwrap();
        assert_eq!(
            result,
            ParsedUrl::Video {
                video_id: "dQw4w9WgXcQ".into(),
                canonical_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ".into(),
            }
        );
    }

    #[test]
    fn test_parse_youtube_url_music() {
        let result =
            parse_youtube_url("https://music.youtube.com/watch?v=dQw4w9WgXcQ").unwrap();
        assert_eq!(
            result,
            ParsedUrl::Video {
                video_id: "dQw4w9WgXcQ".into(),
                canonical_url: "https://music.youtube.com/watch?v=dQw4w9WgXcQ".into(),
            }
        );
    }

    #[test]
    fn test_parse_youtube_url_playlist() {
        let result = parse_youtube_url(
            "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
        )
        .unwrap();
        assert_eq!(
            result,
            ParsedUrl::Playlist {
                playlist_id: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf".into(),
                source: "youtube".into(),
            }
        );
    }

    #[test]
    fn test_parse_youtube_url_mix_with_video() {
        // Short list ID (MIX) with video present should return video
        let result = parse_youtube_url(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ",
        )
        .unwrap();
        assert!(matches!(result, ParsedUrl::Video { .. }));
    }

    #[test]
    fn test_parse_youtube_url_mix_without_video() {
        let result = parse_youtube_url("https://www.youtube.com/playlist?list=RDshortmix");
        assert_eq!(result.unwrap_err(), "playlist_too_short");
    }

    #[test]
    fn test_parse_youtube_url_no_protocol() {
        let result = parse_youtube_url("youtube.com/watch?v=dQw4w9WgXcQ").unwrap();
        assert!(matches!(result, ParsedUrl::Video { .. }));
    }

    #[test]
    fn test_parse_youtube_url_invalid() {
        assert!(parse_youtube_url("https://example.com").is_err());
        assert!(parse_youtube_url("").is_err());
        assert!(parse_youtube_url("   ").is_err());
    }

    #[test]
    fn test_sanitize_name() {
        assert_eq!(sanitize_name("Hello World"), "Hello World");
        assert_eq!(sanitize_name("The Beatles - Help!"), "The Beatles  Help");
        assert_eq!(
            sanitize_name("Test|Video/Name\\Here"),
            "TestVideoNameHere"
        );
    }

    #[test]
    fn test_build_embed_url() {
        assert_eq!(
            build_embed_url("dQw4w9WgXcQ"),
            "https://www.youtube.com/embed/dQw4w9WgXcQ"
        );
    }
}
