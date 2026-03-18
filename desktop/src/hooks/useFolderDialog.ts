import { open } from '@tauri-apps/plugin-dialog'

export function useFolderDialog() {
  const pickFolder = async (): Promise<string | null> => {
    const result = await open({ directory: true, multiple: false })
    return result as string | null
  }

  return { pickFolder }
}
