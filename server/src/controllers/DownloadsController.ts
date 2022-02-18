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
    async getLinks(request:Request, response: Response) {
        const {
            videos,
            format,
            downloadPath,
            sessionId
        } = request.body 

        if(format === 'mp4') {
            await downloadVideosService.executeMP4(videos, sessionId, downloadPath);
        }
        else if(format === 'mp3') {
            await downloadVideosService.executeMP3(videos, sessionId, downloadPath);
        }

        return response.status(201).json({message: 'Download Iniciado'});
    }

    async downloadOneVideo(request:Request, response: Response) {
        const {
            videos,
            format,
            downloadPath,
            sessionId
        } = request.body 

        if(format === 'mp4') {
            await downloadVideosService.executeMP4(videos, sessionId, downloadPath);
        }
        else if(format === 'mp3') {
            await downloadVideosService.executeMP3(videos, sessionId, downloadPath);
        }

        return response.status(201).json({message: 'Download Iniciado'});
    }

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

    async getInformations(request:Request, response: Response) {
        const {
            id
        } = request.body

        const isValidId = ytdl.validateID(id);

        if(isValidId) {
            const info = await downloadVideosService.getInformations(id);

            return response.status(201).json(info);

            // if(license === 'youtube') {
            //     const info = await downloadVideosService.getInformationsYT(id);

            //     return response.status(201).json(info);
            // }
            // else if(license === 'creativeCommon') {
            //     const info = await downloadVideosService.getInformationsCC(id);

            //     return response.status(201).json(info);
            // }
            // else {
            //     const info = await downloadVideosService.getInformations(id);

            //     return response.status(201).json(info);
            // }
        }
        else {
            return response.status(201).json("false");
        }
    }

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
