// const require = createRequire(import.meta.url);

import ytdl from "ytdl-core";
import ytpl from "ytpl";

import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

import Functions from "../functions/Functions";
const functions = new Functions();

import { StreamEventsService } from "./StreamEventsService";
const streamEventsService = new StreamEventsService();

import { SocketInit } from "../serverSocket";

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
    const {
      videos, //videos list
      format, //download format (mp3 | mp4)
      downloadPath, //directory path to download file
      sessionId, //sessionId for socket connection
    } = downloadInfos;

    //Get singleton instance
    const socketInstance = SocketInit.getInstance();

    fs.access(downloadPath, (error) => {
      if (error) {
        // inform front the path is invalid
        socketInstance.publishEvent(
          "noPath",
          { msg: "This is a invalid Path" },
          sessionId
        );
      } else {
        // inform front to show download progress
        socketInstance.publishEvent(
          "showProgress",
          { msg: "Show Progress" },
          sessionId
        );

        videos.forEach((video, index) => {
          const name = video.name.replace(/([^\w ]|_)/, "");

          const output = path.resolve(downloadPath, `${name}.${format}`);

          switch (format) {
            case "mp3":
              this.downloadMP3(
                video,
                output,
                socketInstance,
                sessionId,
                index,
                format
              );
              break;

            case "mp4":
              this.downloadMP4(
                video,
                output,
                socketInstance,
                sessionId,
                index,
                format
              );
              break;
          }
        });
      }
    });
  }

  //download mp3 files
  downloadMP3(
    music: videoObject,
    output: string,
    socketInstance: SocketInit,
    sessionId: string,
    index: number,
    format: string
  ) {
    const downloadMusic = ytdl(music.url, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    const downloadStream = ffmpeg(downloadMusic)
      .toFormat(format)
      .audioBitrate(128)
      .save(output);

    streamEventsService.ffmpegEvents(
      downloadStream,
      socketInstance,
      sessionId,
      index,
      format
    );
  }

  //download mp4 files
  downloadMP4(
    video: videoObject,
    output: string,
    socketInstance: SocketInit,
    sessionId: string,
    index: number,
    format: string
  ) {
    const downloadVideo = ytdl(video.url, {
      filter: (format) => format.container === "mp4",
    });

    downloadVideo.pipe(fs.createWriteStream(output));

    streamEventsService.ytdlCoreEvents(
      downloadVideo,
      socketInstance,
      sessionId,
      index
    );
  }

  //get some infos of the video by the youtube url(id)
  async getInformations(id: string) {
    let videoInfos = {
      title: "",
      success: false,
    };

    await ytdl
      .getInfo(id)
      .then((infos) => {
        videoInfos = {
          title: infos.videoDetails.title,
          success: true,
        };
      })
      .catch((error) => {
        console.log("Error: ", error.message);

        videoInfos = {
          title: null,
          success: false,
        };
      });

    return videoInfos;
  }

  //know if it is a valid youtube playlist
  async getInformationsByPlaylist(id: string) {
    //verifica se o id é válido
    const isValid = ytpl.validateID(id);

    if (isValid) {
      const playlist = await ytpl(id);

      return playlist;
    } else return null;
  }
}

export { DownloadVideosService };
