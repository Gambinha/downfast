import { Request, Response } from 'express';
import { DownloadVideosService } from '../services/DownloadVideosService';

import Functions from '../functions/Functions';
const functions = new Functions();

const downloadVideosService = new DownloadVideosService();

import ytdl from 'ytdl-core';
import ytpl from 'ytpl';


import fs from 'fs';

import {SocketInit} from "../serverSocket";

class DownloadsController {

    // download all videos
    downloadVideosList(request:Request, response: Response) {
        const {
            videos,
            format,
            downloadPath,
            sessionId
        } = request.body 

        const downloadsInfo = {
            videos,
            format,
            downloadPath,
            sessionId
        }

        downloadVideosService.downloadAll(downloadsInfo);

        return response.status(201).json({message: 'Download Iniciado'});
    }

    // download one video by browser
    async getLink(request: Request, response: Response) {
        const {
            url,
            name,
            format
        } = request.query;

        const newUrl = url.toString();

        try {
            if(format === 'mp4') {
                response.header('Content-Disposition', `attachment; filename=${name}.mp4`);
    
                ytdl(newUrl, {quality: 'highest'})
                    .pipe(response);
            }
            else if(format === 'mp3') {
                response.header('Content-Disposition', `attachment; filename=${name}.mp3`);
                
                ytdl(newUrl, {filter: 'audioonly', quality: 'highestaudio'})
                    .pipe(response);
            }
        } catch (error) {
            return error;
        }
    }

    // validate and get some infos of a youtube video
    async getInformations(request:Request, response: Response) {
        const {
            id
        } = request.body

        const isValidId = ytdl.validateID(id);

        if(isValidId) {
            const videoInfos = await downloadVideosService.getInformations(id);

            if(videoInfos.success) {
                return response.status(201).json({success: true, message: "Success", data: videoInfos});
            }
            else {
                return response.status(403).json({success: false, message: "Invalid Video", data: null});
            }
        }
        else {
            return response.status(403).json({success: false, message: "Invalid ID", data: null});
        }
    }

    // get all the video of a playlist
    async getUrlsByPlaylistId(request: Request, response: Response) {
        const {
            playlistId
        } = request.body;

        const videosList = await downloadVideosService.getInformationsByPlaylist(playlistId);

        if(videosList !== null) {
            
            const videos = videosList.items.map(video => {
                return video.shortUrl;
            })


            return response.status(201).json({videos});
        }

        //no playlist (NULL)
        return response.status(201).json({videosList});
    }

    async upload(request: Request, response: Response) {
        const filePath = request.file.path;

        const data = fs.readFileSync(filePath, 'utf-8');
        const links = data.split('\r\n');

        return response.status(201).json(links);
    }
}

export {DownloadsController};
