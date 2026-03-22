import request from "supertest";
import express from "express";
import { router } from "../routes";

// Mock auth middleware so tests don't need JWT
jest.mock("../middlewares/permissions", () => ({
  is: () => (_req: any, _res: any, next: any) => next(),
}));

// eslint-disable-next-line no-var
var mockServiceImpl: { resolveUrl: jest.Mock; searchVideos: jest.Mock; [key: string]: jest.Mock };

jest.mock("../services/DownloadVideosService", () => {
  mockServiceImpl = {
    searchVideos: jest.fn().mockImplementation((query: string, limit: number) => {
      if (query === "error") throw new Error("yt-dlp failed");
      return Array.from({ length: limit }, (_, i) => ({
        id: { videoId: `id${i}` },
        snippet: {
          title: `${query} video ${i}`,
          channelTitle: "Channel",
          thumbnails: { medium: { url: "https://thumb.url" }, high: { url: "https://thumb.url" } },
        },
      }));
    }),
    downloadAll: jest.fn(),
    getInformations: jest.fn(),
    getInformationsByPlaylist: jest.fn(),
    resolveUrl: jest.fn(),
  };
  return {
    DownloadVideosService: jest.fn().mockImplementation(() => mockServiceImpl),
  };
});

jest.mock("fluent-ffmpeg", () => {
  const ffmpeg = jest.fn();
  (ffmpeg as any).setFfmpegPath = jest.fn();
  return { __esModule: true, default: ffmpeg };
});
jest.mock("@ffmpeg-installer/ffmpeg", () => ({ path: "/fake/ffmpeg" }));
jest.mock("youtube-dl-exec", () => ({ __esModule: true, default: jest.fn(), exec: jest.fn() }));
jest.mock("multer", () => {
  const m = jest.fn(() => ({ single: jest.fn(() => jest.fn((_r: any, _s: any, n: any) => n())) }));
  return m;
});
jest.mock("../config/multer", () => ({}));

const app = express();
app.use(express.json());
app.use(router);

describe("GET /search", () => {
  it("returns 6 results for a valid query", async () => {
    const res = await request(app).get("/search?q=stromae");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(6);
    expect(res.body.data[0]).toHaveProperty("id.videoId");
    expect(res.body.data[0]).toHaveProperty("snippet.title");
    expect(res.body.data[0]).toHaveProperty("snippet.thumbnails.high.url");
  });

  it("respects the limit query param", async () => {
    const res = await request(app).get("/search?q=test&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/search");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when q is empty string", async () => {
    const res = await request(app).get("/search?q=");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /downloads/resolveUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when url is missing", async () => {
    const res = await request(app).post("/downloads/resolveUrl").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 with invalid_url message when service throws invalid_url", async () => {
    mockServiceImpl.resolveUrl.mockRejectedValueOnce(new Error("invalid_url"));

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it("returns 400 with MIX message when service throws playlist_too_short", async () => {
    mockServiceImpl.resolveUrl.mockRejectedValueOnce(new Error("playlist_too_short"));

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/playlist?list=RDshort" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/MIX/i);
  });

  it("returns 404 when service throws video_not_found", async () => {
    mockServiceImpl.resolveUrl.mockRejectedValueOnce(new Error("video_not_found"));

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/watch?v=gone123" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBeTruthy();
  });

  it("returns 404 when service throws playlist_not_found", async () => {
    mockServiceImpl.resolveUrl.mockRejectedValueOnce(new Error("playlist_not_found"));

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/playlist?list=PLgone123456789" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBeTruthy();
  });

  it("returns 500 for unexpected errors", async () => {
    mockServiceImpl.resolveUrl.mockRejectedValueOnce(new Error("something unexpected"));

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/watch?v=abc123" });

    expect(res.status).toBe(500);
  });

  it("returns 200 with videos array for a valid single video", async () => {
    const video = {
      name: "Test Video",
      url: "https://www.youtube.com/watch?v=abc123",
      embedUrl: "https://www.youtube.com/embed/abc123",
    };
    mockServiceImpl.resolveUrl.mockResolvedValueOnce({ videos: [video] });

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/watch?v=abc123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.videos).toHaveLength(1);
    expect(res.body.videos[0]).toMatchObject(video);
  });

  it("returns 200 with multiple videos for a playlist", async () => {
    const videos = [
      { name: "Video One", url: "https://www.youtube.com/watch?v=v1", embedUrl: "https://www.youtube.com/embed/v1" },
      { name: "Video Two", url: "https://www.youtube.com/watch?v=v2", embedUrl: "https://www.youtube.com/embed/v2" },
    ];
    mockServiceImpl.resolveUrl.mockResolvedValueOnce({ videos });

    const res = await request(app)
      .post("/downloads/resolveUrl")
      .send({ url: "https://www.youtube.com/playlist?list=PLabc123def456ghij" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.videos).toHaveLength(2);
  });
});
