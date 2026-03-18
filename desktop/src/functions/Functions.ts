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
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return undefined;
            const payload = JSON.parse(atob(parts[1]));
            return payload.sub as string | undefined;
        } catch {
            return undefined;
        }
    }

    removeSpecialCaracteres(name: string) {
        const er = /[\\,"""'`|$~%'"<>{}/|]/g;
        return name.replace(er, "");
    }

    getEmbedLink(url: string) {
        let normalized = url.replace("music.youtube.com", "www.youtube.com");
        return normalized.replace("watch?v=", "embed/");
    }
}

export default Functions;
