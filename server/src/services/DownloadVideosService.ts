import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import fs from 'fs';
import readline from 'readline';
import path from 'path';

import Functions from '../functions/Functions';
const functions = new Functions();

import {SocketInit} from "../serverSocket";

import async from 'async';

interface videoObject {
    name: string,
    url: string
}

class DownloadVideosService {

    async executeMP4(videos: Array<videoObject>, sessionId: string, downloadPath: string) {
        //Get singleton instance
        const socketInstance = SocketInit.getInstance();

        fs.access(downloadPath, (error) => {
            if(error) {
                socketInstance.publishEvent("noPath", ({msg: "This is a invalid Path"}), sessionId);
            }
            else {
                socketInstance.publishEvent("showProgress", ({msg: "Show Progress"}), sessionId);

                videos.forEach((video, index) => {
                    const caminho = path.resolve(downloadPath, `${video.name}.mp4`);  
        
                    const downloadVideo = ytdl(video.url, {filter: format => format.container === 'mp4'});

                    console.log(caminho);
        
                    let starttime;
                    downloadVideo.pipe(fs.createWriteStream(caminho));
            
                    downloadVideo.once('response', () => {
                        console.log('Download Iniciado');
                        starttime = Date.now();
        
                        socketInstance.publishEvent("startDownload", ({msg: "progress", index: index}), sessionId);
                    });
            
                    downloadVideo.on('progress', (chunkLength, downloaded, total) => {
                        const percent = downloaded / total;
                        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
                        const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
        
                        socketInstance.publishEvent("progressDownload", ({percent: (percent * 100).toFixed(2), index: index}), sessionId);
                    });
                    
                    downloadVideo.on('end', () => {
                        process.stdout.write('\n\n');
                        // console.log(`\ndone, thanks - ${(Date.now() - starttime) / 1000}s`);
        
                        socketInstance.publishEvent("finishedDownload", ({msg: "finished", index: index}), sessionId);
                    });
                });
            }
        })

        return;
    }

    async executeMP3(musics: Array<videoObject>, sessionId: string, downloadPath: string) {
        //Get singleton instance
        const socketInstance = SocketInit.getInstance();

        fs.access(downloadPath, (error) => {
            if(error) {
                console.log('Caminho Inválido!');
                socketInstance.publishEvent("noPath", ({msg: "This is a invalid Path"}), sessionId);
            }
            else {
                socketInstance.publishEvent("showProgress", ({msg: "Show Progress"}), sessionId);

                musics.forEach((music, index) => {
                    const caminho = `${downloadPath}\\${music.name}.mp3`;

                    let downloadMusic = ytdl(music.url, {filter: 'audioonly', quality: 'highestaudio'});

                    let starttime;
                    downloadMusic.pipe(fs.createWriteStream(caminho));

                    downloadMusic.once('response', () => {
                        console.log('Download Iniciado');
                        starttime = Date.now();

                        socketInstance.publishEvent("startDownload", ({msg: "progress", index: index}), sessionId);
                    });
                    
                    downloadMusic.on('progress', (chunkLength, downloaded, total) => {
                        const percent = downloaded / total;
                        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
                        const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
                        console.log(percent);
                        // readline.cursorTo(process.stdout, 0);
                        // process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
                        // process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
                        // process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
                        // process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
                        // // readline.moveCursor(process.stdout, 0, -1);

                        socketInstance.publishEvent("progressDownload", ({percent: (percent * 100).toFixed(2), index: index}), sessionId);
                    });

                    downloadMusic.on('end', () => {
                        // process.stdout.write('\n\n');
                        // console.log(`\ndone, thanks - ${(Date.now() - starttime) / 1000}s`);
                        console.log('download finlaizado4');

                        socketInstance.publishEvent("finishedDownload", ({msg: "finished", index: index}), sessionId);
                    });

                    downloadMusic.on('error', () => {
                        console.log('Download com Erro!');
                    })
                })
            }
        })

        return;
    }

    async getInformations(id: string) {
        const infos = await ytdl.getInfo(id);

        const title = infos.videoDetails.title;
        const newTitle = functions.removeSpecialCaracteres(title);

        return newTitle;
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

    async getInformationsByPlaylist(id: string) {
        //verifica se o id é válido
        const isValid = await ytpl.validateID(id);
        
        if(isValid) {
            const playlist = await ytpl(id);
    
            return playlist;
        }
        else return null;
    }
}

export {DownloadVideosService};