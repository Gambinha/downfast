import { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import youtubeDl from "youtube-dl-exec";
import { DownloadVideosService } from "../services/DownloadVideosService";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const downloadVideosService = new DownloadVideosService();

class DownloadsController {
  downloadVideosList(request: Request, response: Response) {
    const { videos, format, downloadPath, sessionId } = request.body;

    downloadVideosService.downloadAll({
      videos,
      format,
      downloadPath,
      sessionId,
    });

    return response.status(201).json({ message: "Download Iniciado" });
  }

  async getLink(request: Request, response: Response) {
    const { url, name, format } = request.query;

    const newUrl = url.toString();

    try {
      if (format === "mp4") {
        response.header(
          "Content-Disposition",
          `attachment; filename=${name}.mp4`,
        );
        const subprocess = youtubeDl.exec(newUrl, {
          format: "best[ext=mp4]/bestvideo[ext=mp4]/best",
          output: "-",
          noPlaylist: true,
        });
        subprocess.stdout?.pipe(response);
      } else if (format === "mp3") {
        response.header(
          "Content-Disposition",
          `attachment; filename=${name}.mp3`,
        );
        const subprocess = youtubeDl.exec(newUrl, {
          format: "bestaudio",
          output: "-",
          noPlaylist: true,
        });
        ffmpeg(subprocess.stdout).toFormat("mp3").pipe(response);
      }
    } catch (error) {
      return error;
    }
  }

  async getInformations(request: Request, response: Response) {
    const { id } = request.body;

    const videoInfos = await downloadVideosService.getInformations(id);

    if (videoInfos.success) {
      return response
        .status(201)
        .json({ success: true, message: "Success", data: videoInfos });
    } else {
      return response
        .status(403)
        .json({ success: false, message: "Invalid Video", data: null });
    }
  }

  async getUrlsByPlaylistId(request: Request, response: Response) {
    const { playlistId } = request.body;

    const videosList =
      await downloadVideosService.getInformationsByPlaylist(playlistId);

    if (videosList !== null) {
      const videos = videosList.items.map((video) => video.shortUrl);
      return response.status(201).json({ videos });
    }

    return response.status(201).json({ videosList });
  }

  async upload(request: Request, response: Response) {
    const filePath = request.file.path;
    const data = fs.readFileSync(filePath, "utf-8");
    const links = data.split("\r\n");
    return response.status(201).json(links);
  }
}

export { DownloadsController };
