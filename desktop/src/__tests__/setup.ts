import '@testing-library/jest-dom'

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue('/mock/folder/path'),
}))

vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  openUrl: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  }),
}))

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    emit: vi.fn((event: string, _data: unknown, cb?: () => void) => {
      if (cb) cb()
    }),
    on: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

// Mock axios
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: 'http://localhost:3333' },
  },
  updateApiBaseUrl: vi.fn().mockResolvedValue(undefined),
  getServerUrl: vi.fn().mockResolvedValue('http://localhost:3333'),
}))
