/**
 * Check if the app is running inside the Tauri webview.
 * Returns false when running in a regular browser (e.g. `npm run dev` without Tauri).
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
