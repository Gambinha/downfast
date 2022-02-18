import validator from 'validator';
import ytdl from 'ytdl-core';

class Functions {
    verifyUUID(id: string) {
        return validator.isUUID(id, [4])        
    }

    getIdByURL(url: string) {
        return ytdl.getVideoID(url);
    }

    removeSpecialCaracteres(name: string) {
        const er = /[&\/\\#,"”“'`[+||()$~%.'":*?\]<>\{}/|]/g;
        let newName = name.replace(er, "");
        
        return newName;
    }
}

export default Functions;