import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./useTauri";

export interface TauriVideoInfo {
  name: string;
  url: string;
  embed_url: string;
}

export interface TauriResolvedVideos {
  videos: TauriVideoInfo[];
}

export interface TauriSearchResult {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

/** Convert snake_case from Rust to camelCase used in the frontend */
function mapVideoInfo(v: TauriVideoInfo) {
  return {
    name: v.name,
    url: v.url,
    embedUrl: v.embed_url,
  };
}

function ensureTauri() {
  if (!isTauri()) {
    throw new Error(
      "Tauri runtime not available. Run the app with 'npm run tauri dev'.",
    );
  }
}

export function useYoutube() {
  async function resolveUrl(url: string) {
    ensureTauri();
    const result = await invoke<TauriResolvedVideos>("resolve_url", { url });
    return {
      videos: result.videos.map(mapVideoInfo),
    };
  }

  async function getVideoInfo(id: string) {
    ensureTauri();
    const result = await invoke<TauriVideoInfo>("get_video_info", { id });
    return mapVideoInfo(result);
  }

  async function searchVideos(query: string, limit: number = 6) {
    ensureTauri();
    const results = await invoke<TauriSearchResult[]>("search_videos", {
      query,
      limit,
    });
    return results;
  }

  return { resolveUrl, getVideoInfo, searchVideos };
}
