import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import readline from 'readline';
import path from 'path';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

import Functions from '../functions/Functions';
const functions = new Functions();

import {SocketInit} from "../serverSocket";

import async from 'async';

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
                            this.downloadMP3(video, output, socketInstance, sessionId, index);
                            break;
                        
                        case 'mp4':
                            this.downloadMP4(video, output, socketInstance, sessionId, index);
                            break;
                    }
                })
            }
        })
    }

    //download mp3 files
    downloadMP3(music: videoObject, output: string, socketInstance: SocketInit, sessionId: string, index: number) {
        let downloadMusic = ytdl(music.url, {
            quality: 'highestaudio',
            filter: 'audioonly',
        });

        let starttime;
        
        ffmpeg(downloadMusic)
            .toFormat('mp3')
            .audioBitrate(128)
            .save(output)

            //Download Started
            .on('start', () => {
                console.log('Download Iniciado');
                starttime = Date.now();

                socketInstance.publishEvent("startDownload", ({msg: "progress", index: index}), sessionId);
            })

            // Download Progress
            .on('progress', p => {
                console.log(p);
                // console.log('Show progress ', downloaded, total );
                // const percent = downloaded / total;
                // const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
                // const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
                // console.log(percent);   

                //socketInstance.publishEvent("progressDownload", ({percent: (percent * 100).toFixed(2), index: index}), sessionId);
            })

            // Download Finished
            .on('end', () => {
                console.log('download finlaizado');

                socketInstance.publishEvent("finishedDownload", ({msg: "finished", index: index}), sessionId);
            })

            //Download wth Error
            .on('error', (error) => {
                //Error.message = "ffmpeg exited with code 1: E:\Meus Documentos\Downloads/The Beatles - Help |.mp3: Invalid argument"
                socketInstance.publishEvent("errorInDownload", ({msg: error.message}), sessionId);
            })
    }

    //download mp4 files
    downloadMP4(video: videoObject, output: string, socketInstance: SocketInit, sessionId: string, index: number) {
        const downloadVideo = ytdl(video.url, {
            filter: format => format.container === 'mp4'
        });

        let starttime;
        downloadVideo.pipe(fs.createWriteStream(output));

        //Download started
        downloadVideo.once('response', () => {
            console.log('Download Iniciado');
            starttime = Date.now();

            socketInstance.publishEvent("startDownload", ({msg: "progress", index: index}), sessionId);
        });

        //Download Progress
        downloadVideo.on('progress', (chunkLength, downloaded, total) => {
            const percent = downloaded / total;

            socketInstance.publishEvent("progressDownload", ({percent: (percent * 100).toFixed(2), index: index}), sessionId);
        });
        
        //Download Finished
        downloadVideo.on('end', () => {
            process.stdout.write('\n\n');
            // console.log(`\ndone, thanks - ${(Date.now() - starttime) / 1000}s`);

            socketInstance.publishEvent("finishedDownload", ({msg: "finished", index: index}), sessionId);
        });
    }

    //get the title of the video by the youtube url(id)
    async getInformations(id: string) {
        const infos = await ytdl.getInfo(id);

        const title = infos.videoDetails.title;

        return title;
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