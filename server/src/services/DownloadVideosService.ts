import youtubeDl from "youtube-dl-exec";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);
const ffmpegDir = path.dirname(ffmpegPath);

import Functions from "../functions/Functions";
import { SocketInit } from "../serverSocket";
import { StreamEventsService } from "./StreamEventsService";

const functions = new Functions();
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

        videos.forEach((video, index) => {
          const name = video.name.replace(/([^\w ]|_)/g, "");
          const output = path.resolve(downloadPath, `${name}.${format}`);

          switch (format) {
            case "mp3":
              this.downloadMP3(
                video,
                output,
                socketInstance,
                sessionId,
                index,
                format,
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
              );
              break;
          }
        });
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
  ) {
    const subprocess = youtubeDl.exec(music.url, {
      format: "bestaudio",
      output: "-",
      noPlaylist: true,
    });

    const downloadStream = ffmpeg(subprocess.stdout)
      .toFormat(format)
      .save(output);

    streamEventsService.ffmpegEvents(
      downloadStream,
      socketInstance,
      sessionId,
      index,
      format,
    );
  }

  downloadMP4(
    video: videoObject,
    output: string,
    socketInstance: SocketInit,
    sessionId: string,
    index: number,
    _format: string,
  ) {
    const subprocess = youtubeDl.exec(video.url, {
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      output,
      mergeOutputFormat: "mp4",
      ffmpegLocation: ffmpegDir,
      noPlaylist: true,
    });

    streamEventsService.ytdlCoreEvents(
      subprocess,
      socketInstance,
      sessionId,
      index,
    );
  }

  async getInformations(id: string) {
    try {
      const info = await youtubeDl(id, {
        dumpSingleJson: true,
        noPlaylist: true,
      }) as any;
      return { title: info.title as string, success: true };
    } catch (error) {
      console.error(error);
      return { title: null, success: false };
    }
  }

  async getInformationsByPlaylist(id: string) {
    try {
      const playlist = await youtubeDl(
        `https://www.youtube.com/playlist?list=${id}`,
        {
          dumpSingleJson: true,
          flatPlaylist: true,
          yesPlaylist: true,
        },
      ) as any;
      return {
        items: playlist.entries.map((e: any) => ({
          shortUrl: e.url || e.webpage_url,
        })),
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export { DownloadVideosService };
