import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import readline from 'readline';
import path, { format } from 'path';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

import Functions from '../functions/Functions';
const functions = new Functions();

import {StreamEventsService} from './StreamEventsService';
const streamEventsService = new StreamEventsService();

import {SocketInit} from "../serverSocket";

interface videoObject {
    name: string,
    url: string
}

interface downloadInfosObject {
    videos: Array<videoObject>, 
    format: string,
    sessionId: string, 
    downloadPath: string
}

class DownloadVideosService {

    downloadAll( downloadInfos: downloadInfosObject ) {
        const {
            videos,       //videos list
            format,       //download format (mp3 | mp4)
            downloadPath, //directory path to download file
            sessionId     //sessionId for socket connection
        } = downloadInfos;

        //Get singleton instance
        const socketInstance = SocketInit.getInstance();

        fs.access(downloadPath, (error) => {
            if(error) {
                // inform front the path is invalid
                socketInstance.publishEvent("noPath", ({msg: "This is a invalid Path"}), sessionId);
            }
            else {
                // inform front to show download progress
                socketInstance.publishEvent("showProgress", ({msg: "Show Progress"}), sessionId);

                videos.forEach((video, index) => {
                    const output = path.resolve(downloadPath, `${video.name}.${format}`);  
            
                    switch (format) {
                        case 'mp3':
                            this.downloadMP3(video, output, socketInstance, sessionId, index, format);
                            break;
                        
                        case 'mp4':
                            this.downloadMP4(video, output, socketInstance, sessionId, index, format);
                            break;
                    }
                })
            }
        })
    }

    //download mp3 files
    downloadMP3(music: videoObject, output: string, socketInstance: SocketInit, sessionId: string, index: number, format: string) {
        const downloadMusic = ytdl(music.url, {
            quality: 'highestaudio',
            filter: 'audioonly',
        });
        
        const downloadStream = ffmpeg(downloadMusic)
            .toFormat(format)
            .audioBitrate(128)
            .save(output)

        streamEventsService.ffmpegEvents(downloadStream, socketInstance, sessionId, index, format);
    }

    //download mp4 files
    downloadMP4(video: videoObject, output: string, socketInstance: SocketInit, sessionId: string, index: number, format: string) {
        const downloadVideo = ytdl(video.url, {
            filter: format => format.container === 'mp4'
        });

        downloadVideo.pipe(fs.createWriteStream(output));

        streamEventsService.ytdlCoreEvents(downloadVideo, socketInstance, sessionId, index);    
    }

    //get some infos of the video by the youtube url(id)
    async getInformations(id: string) {
        let videoInfos = {
            title: '',
            success: false
        }

        await ytdl.getInfo(id)
            .then((infos) => {
                videoInfos = {
                    title: infos.videoDetails.title,
                    success: true
                }
            })
            .catch((error) => {
                console.log('Error: ', error.message);

                videoInfos = {
                    title: null,
                    success: false
                }
            })
        
        return videoInfos;
    }

    // async getInformationsYT(id: string) {
    //     const infos = await ytdl.getInfo(id);
    
    //     const title = infos.videoDetails.title;
    //     const newTitle = functions.removeSpecialCaracteres(title);   

    //     const isLicensed = infos.videoDetails.media['licensed to youtube by'];

    //     if(isLicensed) {
    //         return 'not allowed';
    //     }
    //     else {
    //         return newTitle;
    //     }
    // }

    // async getInformationsCC(id: string) {
    //     const infos = await ytdl.getInfo(id);

    //     const title = infos.videoDetails.title;
    //     const newTitle = functions.removeSpecialCaracteres(title);

    //     if(infos.videoDetails.media['license']) {
    //         const ccLicense = infos.videoDetails.media['license'];

    //         if(
    //             ccLicense.includes('reuse allowed')
    //             || newTitle.toLowerCase().includes('sem copyright')
    //             || newTitle.toLowerCase().includes('no copyright')
    //         ) {
    //             return newTitle;
    //         }
    //         else {
    //             return 'not allowed';
    //         }
    //     }
    //     else if(
    //         newTitle.toLowerCase().includes('sem copyright')
    //         || newTitle.toLowerCase().includes('no copyright')
    //     ) {
    //         return newTitle;
    //     }
    //     else {
    //         return 'not allowed';
    //     }
    // }

    //know if it is a valid youtube playlist
    async getInformationsByPlaylist(id: string) {
        //verifica se o id é válido
        const isValid = ytpl.validateID(id);
        
        if(isValid) {
            const playlist = await ytpl(id);
    
            return playlist;
        }
        else return null;
    }
}

export {DownloadVideosService};