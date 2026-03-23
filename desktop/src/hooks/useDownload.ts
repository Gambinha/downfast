import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "./useTauri";

export interface DownloadEvent {
  index: number;
  percent: number;
  status: string; // "start" | "progress" | "finished" | "error"
  message: string | null;
}

export interface LocalDownloadRequest {
  videos: { name: string; url: string }[];
  format: string;
  download_path: string;
}

export function useDownload(onEvent: (event: DownloadEvent) => void) {
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;

    listen<DownloadEvent>("download:event", (e) => {
      if (!cancelled) {
        onEvent(e.payload);
      }
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
      } else {
        unlistenRef.current = unlisten;
      }
    });

    return () => {
      cancelled = true;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [onEvent]);

  async function startDownload(request: LocalDownloadRequest) {
    if (!isTauri()) {
      throw new Error("Tauri runtime not available.");
    }
    await invoke("start_download", { request });
  }

  async function cancelDownload(index: number) {
    if (!isTauri()) return;
    await invoke("cancel_download", { index });
  }

  async function cancelAllDownloads() {
    if (!isTauri()) return;
    await invoke("cancel_all_downloads");
  }

  return { startDownload, cancelDownload, cancelAllDownloads };
}
