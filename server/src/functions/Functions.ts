import validator from 'validator';

class Functions {
    verifyUUID(id: string) {
        return validator.isUUID(id, [4]);
    }

    getIdByURL(url: string): string | null {
        const match = url.match(/(?:(?:music\.)?youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    convertHMS(stringTime: string) {
        const arrTime = stringTime.split(":");
        const seconds = (Number(arrTime[0]) * 3600) + (Number(arrTime[1]) * 60) + (Number(arrTime[2]));
        return Number(seconds.toFixed(2));
    }

    convertToKb(seconds: number, format: string) {
        const conversionTable = {
            "mp3": 15.65,
            "mp4": 90
        };
        const conversionValue: number = conversionTable[format];
        return Number((seconds * conversionValue).toFixed(0));
    }
}

export default Functions;
