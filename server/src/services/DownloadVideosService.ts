import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import youtubeDl from "youtube-dl-exec";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);
const ffmpegDir = path.dirname(ffmpegPath);

import { SocketInit } from "../serverSocket";
import { StreamEventsService } from "./StreamEventsService";
import { VideoInfo } from "../types/VideoInfo";
import { parseYouTubeUrl, buildEmbedUrl, sanitizeName } from "../utils/youtubeUrl";

const streamEventsService = new StreamEventsService();

interface videoObject {
  name: string;
  url: string;
}

interface downloadInfosObject {
  videos: Array<videoObject>;
  format: string;
  sessionId: string;
  downloadPath: string;
}

class DownloadVideosService {
  private static readonly MAX_CONCURRENT = 6;
  private static readonly DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  downloadAll(downloadInfos: downloadInfosObject) {
    const { videos, format, downloadPath, sessionId } = downloadInfos;

    const socketInstance = SocketInit.getInstance();

    fs.access(downloadPath, (error) => {
      if (error) {
        socketInstance.publishEvent(
          "noPath",
          { msg: "This is a invalid Path" },
          sessionId,
        );
      } else {
        socketInstance.publishEvent(
          "showProgress",
          { msg: "Show Progress" },
          sessionId,
        );

        let nextIndex = 0;
        let running = 0;

        const runNext = () => {
          while (
            running < DownloadVideosService.MAX_CONCURRENT &&
            nextIndex < videos.length
          ) {
            const index = nextIndex++;
            const video = videos[index];
            const name = video.name.replace(/([^\w ]|_)/g, "");
            const output = path.resolve(downloadPath, `${name}.${format}`);
            running++;

            const onComplete = () => {
              running--;
              runNext();
            };

            switch (format) {
              case "mp3":
                this.downloadMP3(
                  video,
                  output,
                  socketInstance,
                  sessionId,
                  index,
                  format,
                  onComplete,
                );
                break;
              case "mp4":
                this.downloadMP4(
                  video,
                  output,
                  socketInstance,
                  sessionId,
                  index,
                  format,
                  onComplete,
                );
                break;
              default:
                onComplete();
                break;
            }
          }
        };

        runNext();
      }
    });
  }

  downloadMP3(
    music: videoObject,
    output: string,
    socketInstance: SocketInit,
    sessionId: string,
    index: number,
    format: string,
    onComplete: () => void,
  ) {
    let completed = false;
    const safeOnComplete = () => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        onComplete();
      }
    };

    const subprocess = youtubeDl.exec(music.url, {
      format: "bestaudio",
      output: "-",
      noPlaylist: true,
    });

    const downloadStream = ffmpeg(subprocess.stdout)
      .toFormat(format)
      .save(output);

    const timeout = setTimeout(() => {
      subprocess.kill();
      downloadStream.kill("SIGKILL");
      socketInstance.publishEvent(
        "errorInDownload",
        { msg: `Download timeout (index ${index})` },
        sessionId,
      );
      safeOnComplete();
    }, DownloadVideosService.DOWNLOAD_TIMEOUT_MS);

    streamEventsService.ffmpegEvents(
      downloadStream,
      socketInstance,
      sessionId,
      index,
      format,
      safeOnComplete,
    );
  }

  downloadMP4(
    video: videoObject,
    output: string,
    socketInstance: SocketInit,
    sessionId: string,
    index: number,
    _format: string,
    onComplete: () => void,
  ) {
    let completed = false;
    const safeOnComplete = () => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        onComplete();
      }
    };

    const subprocess = youtubeDl.exec(video.url, {
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      output,
      mergeOutputFormat: "mp4",
      ffmpegLocation: ffmpegDir,
      noPlaylist: true,
    });

    const timeout = setTimeout(() => {
      subprocess.kill();
      socketInstance.publishEvent(
        "errorInDownload",
        { msg: `Download timeout (index ${index})` },
        sessionId,
      );
      safeOnComplete();
    }, DownloadVideosService.DOWNLOAD_TIMEOUT_MS);

    streamEventsService.ytdlCoreEvents(
      subprocess,
      socketInstance,
      sessionId,
      index,
      safeOnComplete,
    );
  }

  async getInformations(id: string) {
    try {
      const info = (await youtubeDl(id, {
        dumpSingleJson: true,
        noPlaylist: true,
      })) as any;
      return { title: info.title as string, success: true };
    } catch (error) {
      console.error(error);
      return { title: null, success: false };
    }
  }

  async searchVideos(query: string, limit: number = 6) {
    try {
      const results = (await youtubeDl(`ytsearch${limit}:${query}`, {
        dumpSingleJson: true,
        noPlaylist: true,
        flatPlaylist: true,
      })) as any;

      const entries = results.entries ?? [results];
      return entries.map((v: any) => ({
        id: { videoId: v.id },
        snippet: {
          title: v.title,
          channelTitle: v.uploader ?? v.channel,
          thumbnails: {
            medium: { url: v.thumbnail },
            high: { url: v.thumbnail },
          },
        },
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getInformationsByPlaylist(id: string, source?: string) {
    const domain = source === "music" ? "music.youtube.com" : "www.youtube.com";
    try {
      const playlist = (await youtubeDl(
        `https://${domain}/playlist?list=${id}`,
        {
          dumpSingleJson: true,
          flatPlaylist: true,
          yesPlaylist: true,
        },
      )) as any;
      return {
        items: playlist.entries.map((e: any) => ({
          url: e.url || e.webpage_url,
          title: e.title as string,
        })),
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async resolveUrl(raw: string): Promise<{ videos: VideoInfo[] }> {
    const parsed = parseYouTubeUrl(raw);

    if (parsed.type === "video") {
      const { videoId, canonicalUrl } = parsed;
      const info = await this.getInformations(videoId);
      if (!info.success || !info.title) {
        throw new Error("video_not_found");
      }
      return {
        videos: [
          {
            name: sanitizeName(info.title),
            url: canonicalUrl,
            embedUrl: buildEmbedUrl(videoId),
          },
        ],
      };
    }

    // type === "playlist"
    const { playlistId, source } = parsed;
    const playlist = await this.getInformationsByPlaylist(playlistId, source);
    if (!playlist) {
      throw new Error("playlist_not_found");
    }

    const videos: VideoInfo[] = playlist.items.map(
      (item: { url: string; title: string }) => {
        const itemUrl = new URL(item.url);
        const videoId =
          itemUrl.searchParams.get("v") ?? item.url.split("/").pop() ?? "";
        return {
          name: sanitizeName(item.title),
          url: item.url,
          embedUrl: buildEmbedUrl(videoId),
        };
      },
    );

    return { videos };
  }
}

export { DownloadVideosService };
