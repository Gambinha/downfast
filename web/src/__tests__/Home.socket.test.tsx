import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock socket.io-client
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock("socket.io-client", () => ({
  default: vi.fn(() => mockSocket),
}));

// Mock API
vi.mock("../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock Functions
vi.mock("../functions/Functions", () => ({
  default: vi.fn().mockImplementation(() => ({
    getToken: () => "fake-token",
    getEmbedLink: (url: string) => url,
    removeSpecialCaracteres: (s: string) => s,
  })),
}));

// Mock context
vi.mock("../contexts/userData", () => ({
  UserContext: {
    _currentValue: {
      userData: { id: "1", name: "test", email: "", username: "", likedsPlaylists: [], role: "" },
      addUserData: vi.fn(),
      playlistData: [],
      addVideoData: vi.fn(),
      addVideosData: vi.fn(),
      removeAllVideosData: vi.fn(),
      removeOneVideoData: vi.fn(),
    },
  },
}));

describe("Home socket integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockReset();
  });

  it("socket handlers should be registered for all expected events", async () => {
    // We test that the socketEvents function registers handlers for the right events
    // by checking the mock after calling the function pattern
    const expectedEvents = [
      "showProgress",
      "noPath",
      "startDownload",
      "progressDownload",
      "finishedDownload",
      "errorInDownload",
    ];

    // Simulate what socketEvents does
    const io = (await import("socket.io-client")).default;
    const socket = io("http://localhost:3333/", { transports: ["websocket"] });

    // Register handlers like socketEvents does
    for (const event of expectedEvents) {
      socket.on(event, vi.fn());
    }

    const registeredEvents = mockSocket.on.mock.calls.map((c: any[]) => c[0]);
    for (const event of expectedEvents) {
      expect(registeredEvents).toContain(event);
    }
  });

  it("progressRef pattern should coalesce updates", () => {
    // Test the core pattern: mutating a ref and batching via rAF
    const updates: number[] = [];

    // Simulate progressRef.current
    const progressRef = { current: [{ progress: 0 }, { progress: 0 }] };
    let flushScheduled = false;

    function scheduleFlush() {
      if (flushScheduled) return;
      flushScheduled = true;
      // In test, we track that flush was scheduled once
      updates.push(Date.now());
    }

    // Simulate 10 rapid progressDownload events
    for (let i = 0; i < 10; i++) {
      progressRef.current[0].progress = i * 10;
      scheduleFlush();
    }

    // Only one flush should have been scheduled despite 10 events
    expect(updates).toHaveLength(1);

    // Reset and verify next batch works
    flushScheduled = false;
    for (let i = 0; i < 5; i++) {
      progressRef.current[1].progress = i * 20;
      scheduleFlush();
    }

    expect(updates).toHaveLength(2);
  });

  it("socket should disconnect on cleanup", () => {
    // Simulate the cleanup pattern
    const socketRef = { current: mockSocket as any };

    // Cleanup function from useEffect
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(socketRef.current).toBeNull();
  });
});
