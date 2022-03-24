import validator from 'validator';
import ytdl from 'ytdl-core';

class Functions {
    // verify if the id is a uuid
    verifyUUID(id: string) {
        return validator.isUUID(id, [4])        
    }

    // get the youtube video id by the video url
    getIdByURL(url: string) {
        return ytdl.getVideoID(url);
    }

    // convert format hh/mm/ss to seconds
    convertHMS(stringTime: string) {
        const arrTime = stringTime.split(":");
        const seconds = (Number(arrTime[0]) * 3600) + (Number(arrTime[1]) * 60) + (Number(arrTime[2]));
       
        return Number(seconds.toFixed(2));
    }

    // convert seconds to video size(KB)
    convertToKb(seconds: number, format: string) {
        const conversionTable = {
            "mp3": 15.65,
            "mp4": 90 //86.2, 89,1, 91,9, 90,4, 109,2
        }

        const conversionValue: number = conversionTable[format];
        
        return Number((seconds * conversionValue).toFixed(0));
    }
}

export default Functions;