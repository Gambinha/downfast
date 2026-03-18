import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFolderDialog } from '../../hooks/useFolderDialog'

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}))

describe('useFolderDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a pickFolder function', () => {
    const { result } = renderHook(() => useFolderDialog())
    expect(typeof result.current.pickFolder).toBe('function')
  })

  it('pickFolder returns selected path when user picks folder', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    vi.mocked(open).mockResolvedValue('/home/user/downloads')

    const { result } = renderHook(() => useFolderDialog())

    let path: string | null = null
    await act(async () => {
      path = await result.current.pickFolder()
    })

    expect(path).toBe('/home/user/downloads')
    expect(open).toHaveBeenCalledWith({ directory: true, multiple: false })
  })

  it('pickFolder returns null when user cancels', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    vi.mocked(open).mockResolvedValue(null)

    const { result } = renderHook(() => useFolderDialog())

    let path: string | null = '/initial'
    await act(async () => {
      path = await result.current.pickFolder()
    })

    expect(path).toBeNull()
  })
})
