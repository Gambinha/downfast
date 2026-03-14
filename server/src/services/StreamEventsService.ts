const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

import { ChildProcess } from 'child_process';
import {SocketInit} from "../serverSocket";

import Functions from '../functions/Functions';
const functions = new Functions();

class StreamEventsService {

    // yt-dlp subprocess events to download mp4 videos (parse stderr progress)
    ytdlCoreEvents(subprocess: ChildProcess, socketInstance: SocketInit, sessionId: string, index: number) {
        socketInstance.publishEvent("startDownload", ({ msg: "progress", index }), sessionId);

        subprocess.stderr?.on('data', (data: Buffer) => {
            const match = data.toString().match(/\[download\]\s+([\d.]+)%/);
            if (match) {
                const percent = parseFloat(match[1]);
                socketInstance.publishEvent("progressDownload", ({ percent: percent.toFixed(2), index }), sessionId);
            }
        });

        subprocess.on('close', (code) => {
            if (code === 0) {
                socketInstance.publishEvent("finishedDownload", ({ msg: "finished", index }), sessionId);
            } else {
                socketInstance.publishEvent("errorInDownload", ({ msg: `yt-dlp falhou (código ${code})` }), sessionId);
            }
        });
    }

    // ffmpeg events to download cut mp4 videos or mp3 musics
    ffmpegEvents(downloadStream: ffmpeg.FfmpegCommand, socketInstance: SocketInit, sessionId: string, index: number, format: string) {
        // while not automatic
        const durationTime: number = null;

        let kbFileSize: number;

        downloadStream
            //Download Started
            .on('start', () => {
                console.log('Download Iniciado');

                socketInstance.publishEvent("startDownload", ({msg: "progress", index: index}), sessionId);
            })

            // Download Infos
            .on('codecData', function(data) {
                let seconds: number;

                if(durationTime != null) {
                    seconds = durationTime;
                }
                else {
                    seconds = functions.convertHMS(data.duration);
                }

                kbFileSize = functions.convertToKb(seconds, format)
            })

            // Download Progress
            .on('progress', progress => {
                const currentDownloadedKbSize = progress.targetSize;
                const percent = (currentDownloadedKbSize * 1 / kbFileSize); // Regra de 3 to find percent of download file

                socketInstance.publishEvent("progressDownload", ({percent: (percent * 100).toFixed(2), index: index}), sessionId);
            })

            // Download Finished
            .on('end', () => {
                console.log('Download finalizado');

                socketInstance.publishEvent("finishedDownload", ({msg: "finished", index: index}), sessionId);
            })

            //Download wth Error
            .on('error', (error) => {
                //Error.message = "ffmpeg exited with code 1: E:\Meus Documentos\Downloads/The Beatles - Help |.mp3: Invalid argument"
                socketInstance.publishEvent("errorInDownload", ({msg: error.message}), sessionId);
            })
    }
}

export {StreamEventsService};