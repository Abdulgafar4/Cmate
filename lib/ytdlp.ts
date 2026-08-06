import { spawn, type ChildProcess } from "child_process";
import type { AppConfig } from "./config";
import { getConfig } from "./config";
import {
  deleteJobArtifacts,
  findJobOutputFile,
} from "./cleanup";
import {
  buildSectionArg,
  type DownloadOptions,
} from "./downloadOptions";
import type { FormatPresetId } from "./validators";
import { getFormatSpec, isAudioOnly } from "./formats";
import {
  type DownloadProgressUpdate,
  parseProgressLine,
} from "./downloadProgress";

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  url: string;
  channel?: string;
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  channel?: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  entries: PlaylistEntry[];
}

interface YtDlpJson {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  webpage_url?: string;
  channel?: string;
  uploader?: string;
  thumbnails?: Array<{ url: string; height?: number }>;
  entries?: Array<YtDlpJson | null>;
  _type?: string;
}

let toolsVerified = false;

const activeProcesses = new Map<string, ChildProcess>();

export async function verifyTools(): Promise<void> {
  if (toolsVerified) {
    return;
  }

  await getConfig();
  toolsVerified = true;
}

function getJsRuntimeArgs(): string[] {
  return ["--js-runtimes", "node"];
}

function getSpeedArgs(config: AppConfig, writeSubtitles: boolean): string[] {
  const args = [
    ...getJsRuntimeArgs(),
    "--concurrent-fragments",
    String(config.concurrentFragments),
    "--buffer-size",
    config.bufferSize,
    "--http-chunk-size",
    config.httpChunkSize,
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--no-write-thumbnail",
    "--no-embed-thumbnail",
    "--no-write-info-json",
    "--no-mtime",
  ];

  if (writeSubtitles) {
    args.push(
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      "en.*,en",
      "--convert-subs",
      "srt",
    );
  } else {
    args.push("--no-write-subs");
  }

  if (config.aria2cPath) {
    args.push(
      "--external-downloader",
      config.aria2cPath,
      "--external-downloader-args",
      "aria2c:-x 16 -s 16 -k 1M -j 16 --file-allocation=none --summary-interval=0",
    );
  }

  return args;
}

function runYtDlp(
  ytDlpPath: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          stderr.trim() || stdout.trim() || `yt-dlp exited with code ${code}`,
        ),
      );
    });
  });
}

function pickThumbnail(data: YtDlpJson): string {
  if (data.thumbnail) {
    return data.thumbnail;
  }

  const thumbnails = data.thumbnails ?? [];
  const best = thumbnails
    .filter((item) => item.url)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];

  return best?.url ?? "";
}

function mapVideo(data: YtDlpJson, fallbackUrl: string): VideoInfo {
  return {
    id: data.id,
    title: data.title,
    thumbnail: pickThumbnail(data),
    duration: data.duration ?? 0,
    url: data.webpage_url ?? fallbackUrl,
    channel: data.channel ?? data.uploader,
  };
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const config = await getConfig();
  await verifyTools();

  const args = [
    "-j",
    "--no-playlist",
    "--no-warnings",
    "--no-download",
    ...getJsRuntimeArgs(),
    url,
  ];

  if (config.cookiesFile) {
    args.push("--cookies", config.cookiesFile);
  }

  const { stdout } = await runYtDlp(config.ytDlpPath, args);
  const data = JSON.parse(stdout) as YtDlpJson;
  return mapVideo(data, url);
}

export async function getPlaylistInfo(url: string): Promise<PlaylistInfo> {
  const config = await getConfig();
  await verifyTools();

  const args = [
    "-J",
    "--flat-playlist",
    "--no-warnings",
    "--no-download",
    ...getJsRuntimeArgs(),
    url,
  ];

  if (config.cookiesFile) {
    args.push("--cookies", config.cookiesFile);
  }

  const { stdout } = await runYtDlp(config.ytDlpPath, args);
  const data = JSON.parse(stdout) as YtDlpJson;
  const entries = (data.entries ?? [])
    .filter((entry): entry is YtDlpJson => Boolean(entry?.id && entry.title))
    .slice(0, 50)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      url: entry.webpage_url ?? `https://www.youtube.com/watch?v=${entry.id}`,
      thumbnail: pickThumbnail(entry),
      duration: entry.duration ?? 0,
      channel: entry.channel ?? entry.uploader ?? data.channel,
    }));

  return {
    id: data.id,
    title: data.title || "Playlist",
    entries,
  };
}

export interface DownloadResult {
  filePath: string;
  title: string;
  subtitlePaths: string[];
}

export type ProgressCallback = (update: DownloadProgressUpdate) => void;

export function cancelDownloadProcess(jobId: string): boolean {
  const proc = activeProcesses.get(jobId);
  if (!proc || proc.killed) {
    return false;
  }
  proc.kill("SIGTERM");
  setTimeout(() => {
    if (!proc.killed) {
      proc.kill("SIGKILL");
    }
  }, 3000);
  return true;
}

function appendAudioArgs(args: string[], formatId: FormatPresetId): void {
  if (formatId === "mp3") {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    return;
  }
  if (formatId === "opus") {
    args.push("-x", "--audio-format", "opus", "--audio-quality", "0");
    return;
  }
  if (formatId === "audio") {
    args.push("-x", "--audio-format", "m4a", "--audio-quality", "0");
    return;
  }
  args.push(
    "--merge-output-format",
    "mp4",
    "--postprocessor-args",
    "ffmpeg:-threads 0 -c copy",
  );
}

export async function startDownload(
  url: string,
  formatId: FormatPresetId,
  outputDir: string,
  jobId: string,
  onProgress: ProgressCallback,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const config = await getConfig();
  await verifyTools();

  const formatSpec = getFormatSpec(formatId);
  const outputTemplate = `${outputDir}/${jobId}.%(ext)s`;
  const writeSubtitles = Boolean(options.writeSubtitles) && !isAudioOnly(formatId);

  const args = [
    "-f",
    formatSpec,
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "--progress-template",
    "PROGRESS:%(progress._percent_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s",
    "--ffmpeg-location",
    config.ffmpegPath,
    "-o",
    outputTemplate,
    ...getSpeedArgs(config, writeSubtitles),
    url,
  ];

  appendAudioArgs(args, formatId);

  const section = buildSectionArg(options.startSeconds, options.endSeconds);
  if (section) {
    args.push("--download-sections", section, "--force-keyframes-at-cuts");
  }

  if (config.cookiesFile) {
    args.push("--cookies", config.cookiesFile);
  }

  let title = "";

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(config.ytDlpPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeProcesses.set(jobId, proc);

    let stderr = "";
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      activeProcesses.delete(jobId);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const handleChunk = (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        const update = parseProgressLine(line.trim());
        if (update) {
          onProgress(update);
        }
      }
    };

    proc.stdout.on("data", handleChunk);
    proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      handleChunk(chunk);

      const titleMatch = text.match(/\[download\]\s+Destination:\s+.+\/(.+?)\./);
      if (titleMatch) {
        title = titleMatch[1];
      }
    });

    proc.on("error", (error) => finish(error));

    proc.on("close", (code, signal) => {
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        finish(new Error("Download cancelled"));
        return;
      }
      if (code !== 0) {
        finish(
          new Error(
            stderr.trim() || `yt-dlp exited with code ${code ?? "unknown"}`,
          ),
        );
        return;
      }
      finish();
    });
  });

  const filePath = await findJobOutputFile(outputDir, jobId);
  const { readdir } = await import("fs/promises");
  const path = await import("path");
  const entries = await readdir(outputDir);
  const subtitlePaths = entries
    .filter(
      (entry) =>
        entry.startsWith(jobId) &&
        (entry.endsWith(".srt") || entry.endsWith(".vtt")),
    )
    .map((entry) => path.join(outputDir, entry));

  await deleteJobArtifacts(outputDir, jobId, [filePath, ...subtitlePaths]);
  onProgress({ progress: 100 });

  return { filePath, title: title || jobId, subtitlePaths };
}
