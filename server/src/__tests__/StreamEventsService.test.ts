import { EventEmitter } from "events";
import { StreamEventsService } from "../services/StreamEventsService";

jest.mock("@ffmpeg-installer/ffmpeg", () => ({
  path: "/fake/ffmpeg",
}));

jest.mock("fluent-ffmpeg", () => {
  const ffmpeg = jest.fn();
  (ffmpeg as any).setFfmpegPath = jest.fn();
  return { __esModule: true, default: ffmpeg };
});

jest.mock("../functions/Functions", () => {
  return jest.fn().mockImplementation(() => ({
    convertHMS: jest.fn(() => 300),
    convertToKb: jest.fn(() => 10000),
  }));
});

function createMockSocketInstance() {
  return {
    publishEvent: jest.fn(),
  } as any;
}

describe("StreamEventsService - throttle", () => {
  let service: StreamEventsService;

  beforeEach(() => {
    service = new StreamEventsService();
  });

  describe("ytdlCoreEvents", () => {
    it("should throttle progress events (delta < 2%)", () => {
      const subprocess = new EventEmitter() as any;
      subprocess.stderr = new EventEmitter();
      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ytdlCoreEvents(subprocess, socket, "sess", 0, onComplete);

      // Emit progress at 1%, 1.5%, 2%, 3%, 3.5%, 100%
      const percents = [1, 1.5, 2, 3, 3.5, 100];
      for (const p of percents) {
        subprocess.stderr.emit("data", Buffer.from(`[download] ${p}%`));
      }

      const progressCalls = socket.publishEvent.mock.calls.filter(
        (c: any[]) => c[0] === "progressDownload",
      );

      // Should emit: 1% (first, delta from 0 >= 2? no... but 1-0=1 < 2, skip)
      // Actually: lastEmittedPercent starts at 0.
      // 1%: 1-0=1 < 2, skip
      // 1.5%: 1.5-0=1.5 < 2, skip
      // 2%: 2-0=2 >= 2, emit (lastEmitted=2)
      // 3%: 3-2=1 < 2, skip
      // 3.5%: 3.5-2=1.5 < 2, skip
      // 100%: 100 >= 100, emit
      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0][1].percent).toBe("2.00");
      expect(progressCalls[1][1].percent).toBe("100.00");
    });

    it("should call onComplete on close", () => {
      const subprocess = new EventEmitter() as any;
      subprocess.stderr = new EventEmitter();
      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ytdlCoreEvents(subprocess, socket, "sess", 0, onComplete);
      subprocess.emit("close", 0);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(socket.publishEvent).toHaveBeenCalledWith(
        "finishedDownload",
        { msg: "finished", index: 0 },
        "sess",
      );
    });

    it("should call onComplete on error close", () => {
      const subprocess = new EventEmitter() as any;
      subprocess.stderr = new EventEmitter();
      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ytdlCoreEvents(subprocess, socket, "sess", 0, onComplete);
      subprocess.emit("close", 1);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(socket.publishEvent).toHaveBeenCalledWith(
        "errorInDownload",
        expect.objectContaining({ msg: expect.stringContaining("yt-dlp") }),
        "sess",
      );
    });
  });

  describe("ffmpegEvents", () => {
    it("should throttle ffmpeg progress events", () => {
      const stream = new EventEmitter() as any;
      stream.on = jest.fn(function (this: any, event: string, handler: any) {
        EventEmitter.prototype.on.call(this, event, handler);
        return this;
      });

      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ffmpegEvents(stream, socket, "sess", 0, "mp3", onComplete);

      // Trigger codecData to set kbFileSize
      stream.emit("codecData", { duration: "00:05:00.00" });

      // kbFileSize mocked to 10000
      // percent = (targetSize / 10000) * 100
      // Emit at 1%, 2%, 2.5%, 4%, 100%
      stream.emit("progress", { targetSize: 100 }); // 1%
      stream.emit("progress", { targetSize: 200 }); // 2%
      stream.emit("progress", { targetSize: 250 }); // 2.5%
      stream.emit("progress", { targetSize: 400 }); // 4%
      stream.emit("progress", { targetSize: 10000 }); // 100%

      const progressCalls = socket.publishEvent.mock.calls.filter(
        (c: any[]) => c[0] === "progressDownload",
      );

      // 1%: 1-0=1 < 2, skip
      // 2%: 2-0=2 >= 2, emit (last=2)
      // 2.5%: 2.5-2=0.5 < 2, skip
      // 4%: 4-2=2 >= 2, emit (last=4)
      // 100%: 100 >= 100, emit
      expect(progressCalls).toHaveLength(3);
    });

    it("should call onComplete on end", () => {
      const stream = new EventEmitter() as any;
      stream.on = jest.fn(function (this: any, event: string, handler: any) {
        EventEmitter.prototype.on.call(this, event, handler);
        return this;
      });

      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ffmpegEvents(stream, socket, "sess", 0, "mp3", onComplete);
      stream.emit("end");

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("should call onComplete on error", () => {
      const stream = new EventEmitter() as any;
      stream.on = jest.fn(function (this: any, event: string, handler: any) {
        EventEmitter.prototype.on.call(this, event, handler);
        return this;
      });

      const socket = createMockSocketInstance();
      const onComplete = jest.fn();

      service.ffmpegEvents(stream, socket, "sess", 0, "mp3", onComplete);
      stream.emit("error", new Error("test error"));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
