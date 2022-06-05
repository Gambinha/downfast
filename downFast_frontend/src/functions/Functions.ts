import {decode} from 'jsonwebtoken';

class Functions {
    getToken() {
        const token = localStorage.getItem('x-access-token');
        if(token) {
            return token;
        }
        else {
            return;
        }
    }

    setToken(token: string) {
        localStorage.setItem('x-access-token', token);
        return;
    }

    getIdByToken(token: string) {
        const decodindToken = token as string || '';
        const payload = decode(decodindToken);
        if(payload) {
            const userId = payload.sub;
            return userId;
        }
        
        return;
    }

    removeSpecialCaracteres(name: string) {
        const er = /[\\,"”“'`|$~%'"<>{}/|]/g;
        return name.replace(er, "");
    }

    getEmbedLink(url: string) {
        console.log(url.replace("https://www.youtube.com/watch?v=", "https://www.youtube.com/embed/"))
        return url.replace("watch?v=", "embed/");
    }
}

export default Functions;