import { DownloadVideosService } from "../services/DownloadVideosService";
import { VideoInfo } from "../types/VideoInfo";

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

import youtubeDlModule from "youtube-dl-exec";
const youtubeDlMock = youtubeDlModule as jest.MockedFunction<typeof youtubeDlModule>;

describe("DownloadVideosService - searchVideos", () => {
  let service: DownloadVideosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DownloadVideosService();
  });

  it("returns mapped entries from yt-dlp search results", async () => {
    const fakeResults = {
      entries: [
        {
          id: "abc123",
          title: "Test Video",
          uploader: "Test Channel",
          thumbnail: "https://i.ytimg.com/vi/abc123/mqdefault.jpg",
        },
        {
          id: "def456",
          title: "Another Video",
          channel: "Another Channel",
          uploader: undefined,
          thumbnail: "https://i.ytimg.com/vi/def456/mqdefault.jpg",
        },
      ],
    };

    youtubeDlMock.mockResolvedValueOnce(fakeResults as any);

    const results = await service.searchVideos("test query");

    expect(youtubeDlMock).toHaveBeenCalledWith("ytsearch6:test query", {
      dumpSingleJson: true,
      noPlaylist: true,
      flatPlaylist: true,
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      id: { videoId: "abc123" },
      snippet: {
        title: "Test Video",
        channelTitle: "Test Channel",
        thumbnails: {
          medium: { url: "https://i.ytimg.com/vi/abc123/mqdefault.jpg" },
          high: { url: "https://i.ytimg.com/vi/abc123/mqdefault.jpg" },
        },
      },
    });
    expect(results[1].snippet.channelTitle).toBe("Another Channel");
  });

  it("respects the limit parameter", async () => {
    youtubeDlMock.mockResolvedValueOnce({ entries: [] } as any);

    await service.searchVideos("query", 3);

    expect(youtubeDlMock).toHaveBeenCalledWith("ytsearch3:query", expect.anything());
  });

  it("handles single result (no entries array)", async () => {
    const single = {
      id: "single1",
      title: "Single Result",
      uploader: "Channel",
      thumbnail: "https://thumb.url/img.jpg",
    };
    youtubeDlMock.mockResolvedValueOnce(single as any);

    const results = await service.searchVideos("query");

    expect(results).toHaveLength(1);
    expect(results[0].id.videoId).toBe("single1");
  });

  it("returns empty array on yt-dlp error", async () => {
    youtubeDlMock.mockRejectedValueOnce(new Error("yt-dlp failed"));

    const results = await service.searchVideos("bad query");

    expect(results).toEqual([]);
  });
});

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

  it("should start at most 6 downloads concurrently", () => {
    const videos = makeVideos(8);

    service.downloadAll({
      videos,
      format: "mp4",
      sessionId: "test-session",
      downloadPath: "/tmp",
    });

    // fs.access calls back synchronously in our mock, so downloads start immediately
    // Should have started exactly 6 (MAX_CONCURRENT)
    expect(onCompleteCallbacks).toHaveLength(6);
  });

  it("should start next download when one completes", () => {
    const videos = makeVideos(8);

    service.downloadAll({
      videos,
      format: "mp4",
      sessionId: "test-session",
      downloadPath: "/tmp",
    });

    expect(onCompleteCallbacks).toHaveLength(6);

    // Complete first download — 7th video starts
    onCompleteCallbacks[0]();
    expect(onCompleteCallbacks).toHaveLength(7);

    // Complete second — 8th video starts
    onCompleteCallbacks[1]();
    expect(onCompleteCallbacks).toHaveLength(8);

    // Complete third — no more videos to start
    onCompleteCallbacks[2]();
    expect(onCompleteCallbacks).toHaveLength(8);
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

describe("DownloadVideosService - resolveUrl", () => {
  let service: DownloadVideosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DownloadVideosService();
  });

  it("returns video info for a youtube.com URL", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "Test Video", success: true });

    const result = await service.resolveUrl(
      "https://www.youtube.com/watch?v=abc123",
    );

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0]).toMatchObject<VideoInfo>({
      name: "Test Video",
      url: "https://www.youtube.com/watch?v=abc123",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("returns video info for a music.youtube.com URL", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "Music Track", success: true });

    const result = await service.resolveUrl(
      "https://music.youtube.com/watch?v=mus456",
    );

    expect(result.videos[0]).toMatchObject<VideoInfo>({
      name: "Music Track",
      url: "https://music.youtube.com/watch?v=mus456",
      embedUrl: "https://www.youtube.com/embed/mus456",
    });
  });

  it("returns video info for a youtu.be URL", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "Short Link Video", success: true });

    const result = await service.resolveUrl("https://youtu.be/short99");

    expect(result.videos[0]).toMatchObject<VideoInfo>({
      name: "Short Link Video",
      url: "https://www.youtube.com/watch?v=short99",
      embedUrl: "https://www.youtube.com/embed/short99",
    });
  });

  it("handles URL without protocol (no https://)", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "No Protocol", success: true });

    const result = await service.resolveUrl(
      "www.youtube.com/watch?v=noproto1",
    );

    expect(result.videos[0].url).toBe(
      "https://www.youtube.com/watch?v=noproto1",
    );
  });

  it("treats URL with &si= as video (ignores tracking param)", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "Tracked Video", success: true });

    const result = await service.resolveUrl(
      "https://www.youtube.com/watch?v=tracked1&si=abc",
    );

    expect(result.videos[0].url).toBe(
      "https://www.youtube.com/watch?v=tracked1",
    );
  });

  it("treats URL with short &list=RD (MIX) + video id as video", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: "Mix Video", success: true });

    const result = await service.resolveUrl(
      "https://www.youtube.com/watch?v=mixvid1&list=RDmixvid1",
    );

    expect(result.videos[0].url).toBe(
      "https://www.youtube.com/watch?v=mixvid1",
    );
  });

  it("returns multiple videos for a playlist URL", async () => {
    jest.spyOn(service, "getInformationsByPlaylist").mockResolvedValueOnce({
      items: [
        { url: "https://www.youtube.com/watch?v=vid1", title: "Video One" },
        { url: "https://www.youtube.com/watch?v=vid2", title: "Video Two" },
      ],
    });

    const result = await service.resolveUrl(
      "https://www.youtube.com/playlist?list=PLabc123def456ghij",
    );

    expect(result.videos).toHaveLength(2);
    expect(result.videos[0]).toMatchObject<VideoInfo>({
      name: "Video One",
      url: "https://www.youtube.com/watch?v=vid1",
      embedUrl: "https://www.youtube.com/embed/vid1",
    });
    expect(result.videos[1]).toMatchObject<VideoInfo>({
      name: "Video Two",
      url: "https://www.youtube.com/watch?v=vid2",
      embedUrl: "https://www.youtube.com/embed/vid2",
    });
  });

  it("throws playlist_too_short for playlist with short ID", async () => {
    await expect(
      service.resolveUrl("https://www.youtube.com/playlist?list=RDshort"),
    ).rejects.toThrow("playlist_too_short");
  });

  it("throws invalid_url for empty string", async () => {
    await expect(service.resolveUrl("")).rejects.toThrow("invalid_url");
  });

  it("throws invalid_url for non-YouTube URL", async () => {
    await expect(
      service.resolveUrl("https://example.com/video"),
    ).rejects.toThrow("invalid_url");
  });

  it("throws video_not_found when yt-dlp returns success: false", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({ title: null, success: false });

    await expect(
      service.resolveUrl("https://www.youtube.com/watch?v=invalid1"),
    ).rejects.toThrow("video_not_found");
  });

  it("throws playlist_not_found when getInformationsByPlaylist returns null", async () => {
    jest
      .spyOn(service, "getInformationsByPlaylist")
      .mockResolvedValueOnce(null);

    await expect(
      service.resolveUrl(
        "https://www.youtube.com/playlist?list=PLabc123def456ghij",
      ),
    ).rejects.toThrow("playlist_not_found");
  });

  it("sanitizes special characters in title", async () => {
    jest
      .spyOn(service, "getInformations")
      .mockResolvedValueOnce({
        title: "Video: Special/Chars & More!",
        success: true,
      });

    const result = await service.resolveUrl(
      "https://www.youtube.com/watch?v=special1",
    );

    expect(result.videos[0].name).not.toMatch(/[:/&!]/);
  });
});
