export function getToken(): string | undefined {
    const token = localStorage.getItem('x-access-token');
    return token || undefined;
}

export function setToken(token: string) {
    localStorage.setItem('x-access-token', token);
}

export function getIdByToken(token: string): string | undefined {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(atob(parts[1]));
        return payload.sub as string | undefined;
    } catch {
        return undefined;
    }
}

export function removeSpecialCaracteres(name: string): string {
    const er = /[\\,"""'`|$~%'"<>{}/|]/g;
    return name.replace(er, "");
}

export function getEmbedLink(url: string): string {
    let normalized = url.replace("music.youtube.com", "www.youtube.com");
    return normalized.replace("watch?v=", "embed/");
}
