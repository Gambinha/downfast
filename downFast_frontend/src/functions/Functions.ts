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
        let newName = name.replace(er, "");
        
        return newName;
    }
}

export default Functions;