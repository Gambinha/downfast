type AuthEventCallback = (message: string) => void;

let listener: AuthEventCallback | null = null;
let logoutInProgress = false;

export function onAuthLogout(callback: AuthEventCallback) {
  listener = callback;
  logoutInProgress = false;
  return () => {
    listener = null;
  };
}

export function emitAuthLogout(message: string) {
  if (logoutInProgress) return;
  logoutInProgress = true;
  if (listener) listener(message);
}
