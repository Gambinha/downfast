export interface ParsedVideo {
  type: "video";
  videoId: string;
  canonicalUrl: string;
}

export interface ParsedPlaylist {
  type: "playlist";
  playlistId: string;
  source: "music" | "youtube";
}

export type ParsedYouTubeUrl = ParsedVideo | ParsedPlaylist;

export function parseYouTubeUrl(raw: string): ParsedYouTubeUrl {
  if (!raw || !raw.trim()) {
    throw new Error("invalid_url");
  }

  let normalized = raw.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error("invalid_url");
  }

  const host = url.hostname.replace(/^www\./, "");
  const isMusic = host === "music.youtube.com";
  const isYouTube = host === "youtube.com" || host === "youtu.be";

  if (!isMusic && !isYouTube) {
    throw new Error("invalid_url");
  }

  const listParam = url.searchParams.get("list");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.slice(1) || null;
  } else {
    videoId = url.searchParams.get("v");
  }

  if (listParam) {
    if (listParam.length <= 13) {
      // Short ID = MIX; if a video is also present, treat as video
      if (videoId) {
        const canonicalUrl = isMusic
          ? `https://music.youtube.com/watch?v=${videoId}`
          : `https://www.youtube.com/watch?v=${videoId}`;
        return { type: "video", videoId, canonicalUrl };
      }
      throw new Error("playlist_too_short");
    }
    return {
      type: "playlist",
      playlistId: listParam,
      source: isMusic ? "music" : "youtube",
    };
  }

  if (videoId) {
    const canonicalUrl = isMusic
      ? `https://music.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;
    return { type: "video", videoId, canonicalUrl };
  }

  throw new Error("invalid_url");
}

export function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function sanitizeName(title: string): string {
  return title.replace(/([^\w ]|_)/g, "");
}
