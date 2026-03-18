import { DownloadVideosService } from "../services/DownloadVideosService";

// Mock dependencies
jest.mock("youtube-dl-exec", () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    exec: jest.fn(() => ({
      stdout: null,
      stderr: null,
      kill: jest.fn(),
      on: jest.fn(),
    })),
  }),
}));

jest.mock("fluent-ffmpeg", () => {
  const mockStream = {
    toFormat: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    kill: jest.fn(),
  };
  const ffmpeg = jest.fn(() => mockStream);
  (ffmpeg as any).setFfmpegPath = jest.fn();
  return { __esModule: true, default: ffmpeg };
});

jest.mock("@ffmpeg-installer/ffmpeg", () => ({
  path: "/fake/ffmpeg",
}));

jest.mock("fs", () => ({
  access: jest.fn((path: string, cb: (err: Error | null) => void) => cb(null)),
}));

const mockPublishEvent = jest.fn();
jest.mock("../serverSocket", () => ({
  SocketInit: {
    getInstance: () => ({
      publishEvent: mockPublishEvent,
    }),
  },
}));

// Track onComplete callbacks from StreamEventsService
const onCompleteCallbacks: Array<() => void> = [];

jest.mock("../services/StreamEventsService", () => ({
  StreamEventsService: jest.fn().mockImplementation(() => ({
    ffmpegEvents: jest.fn(
      (_stream: any, _socket: any, _session: string, _index: number, _format: string, onComplete: () => void) => {
        onCompleteCallbacks.push(onComplete);
      },
    ),
    ytdlCoreEvents: jest.fn(
      (_sub: any, _socket: any, _session: string, _index: number, onComplete: () => void) => {
        onCompleteCallbacks.push(onComplete);
      },
    ),
  })),
}));

describe("DownloadVideosService - concurrency queue", () => {
  let service: DownloadVideosService;

  beforeEach(() => {
    jest.clearAllMocks();
    onCompleteCallbacks.length = 0;
    service = new DownloadVideosService();
  });

  function makeVideos(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      name: `video${i}`,
      url: `https://youtube.com/watch?v=test${i}`,
    }));
  }

  it("should start at most 3 downloads concurrently", () => {
    const videos = makeVideos(6);

    service.downloadAll({
      videos,
      format: "mp4",
      sessionId: "test-session",
      downloadPath: "/tmp",
    });

    // fs.access calls back synchronously in our mock, so downloads start immediately
    // Should have started exactly 3 (MAX_CONCURRENT)
    expect(onCompleteCallbacks).toHaveLength(3);
  });

  it("should start next download when one completes", () => {
    const videos = makeVideos(5);

    service.downloadAll({
      videos,
      format: "mp4",
      sessionId: "test-session",
      downloadPath: "/tmp",
    });

    expect(onCompleteCallbacks).toHaveLength(3);

    // Complete first download
    onCompleteCallbacks[0]();
    expect(onCompleteCallbacks).toHaveLength(4);

    // Complete second download
    onCompleteCallbacks[1]();
    expect(onCompleteCallbacks).toHaveLength(5);

    // Complete third — no more videos to start
    onCompleteCallbacks[2]();
    expect(onCompleteCallbacks).toHaveLength(5);
  });

  it("should process all downloads eventually", () => {
    const videos = makeVideos(7);

    service.downloadAll({
      videos,
      format: "mp3",
      sessionId: "test-session",
      downloadPath: "/tmp",
    });

    // Drain the queue by completing each download as it starts
    while (onCompleteCallbacks.length < 7) {
      const current = onCompleteCallbacks.length;
      onCompleteCallbacks[current - 1]();
    }

    expect(onCompleteCallbacks).toHaveLength(7);
  });

  it("should emit showProgress on valid path", () => {
    service.downloadAll({
      videos: makeVideos(1),
      format: "mp4",
      sessionId: "sess",
      downloadPath: "/tmp",
    });

    expect(mockPublishEvent).toHaveBeenCalledWith(
      "showProgress",
      { msg: "Show Progress" },
      "sess",
    );
  });

  it("should emit noPath on invalid path", () => {
    const fs = require("fs");
    fs.access.mockImplementationOnce(
      (_path: string, cb: (err: Error | null) => void) =>
        cb(new Error("ENOENT")),
    );

    service.downloadAll({
      videos: makeVideos(1),
      format: "mp4",
      sessionId: "sess",
      downloadPath: "/nonexistent",
    });

    expect(mockPublishEvent).toHaveBeenCalledWith(
      "noPath",
      { msg: "This is a invalid Path" },
      "sess",
    );
    expect(onCompleteCallbacks).toHaveLength(0);
  });
});
