import axios from 'axios'

const DEFAULT_URL = 'http://localhost:3333'

const api = axios.create({
  baseURL: DEFAULT_URL,
})

async function initApiUrl() {
  try {
    const { load } = await import('@tauri-apps/plugin-store')
    const store = await load('settings.json')
    const url = await store.get<string>('serverUrl')
    if (url) {
      api.defaults.baseURL = url
    }
  } catch {
    // Keep default URL if store is unavailable
  }
}

initApiUrl()

export async function updateApiBaseUrl(url: string): Promise<void> {
  try {
    const { load } = await import('@tauri-apps/plugin-store')
    const store = await load('settings.json')
    await store.set('serverUrl', url)
    await store.save()
  } catch {
    // Ignore store errors
  }
  api.defaults.baseURL = url
}

export async function getServerUrl(): Promise<string> {
  try {
    const { load } = await import('@tauri-apps/plugin-store')
    const store = await load('settings.json')
    const url = await store.get<string>('serverUrl')
    return url || DEFAULT_URL
  } catch {
    return DEFAULT_URL
  }
}

export default api
