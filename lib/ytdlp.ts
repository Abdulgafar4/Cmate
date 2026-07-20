import { spawn } from "child_process";
import type { AppConfig } from "./config";
import { getConfig } from "./config";
import {
  deleteJobArtifacts,
  findJobOutputFile,
} from "./cleanup";
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
}

interface YtDlpJson {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  webpage_url?: string;
  thumbnails?: Array<{ url: string; height?: number }>;
}

let toolsVerified = false;

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

function getSpeedArgs(config: AppConfig): string[] {
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
    "--no-write-subs",
    "--no-embed-thumbnail",
    "--no-write-info-json",
    "--no-mtime",
  ];

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

  return {
    id: data.id,
    title: data.title,
    thumbnail: pickThumbnail(data),
    duration: data.duration ?? 0,
    url: data.webpage_url ?? url,
  };
}

export interface DownloadResult {
  filePath: string;
  title: string;
}

export type ProgressCallback = (update: DownloadProgressUpdate) => void;

export async function startDownload(
  url: string,
  formatId: FormatPresetId,
  outputDir: string,
  jobId: string,
  onProgress: ProgressCallback,
): Promise<DownloadResult> {
  const config = await getConfig();
  await verifyTools();

  const formatSpec = getFormatSpec(formatId);
  const outputTemplate = `${outputDir}/${jobId}.%(ext)s`;

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
    ...getSpeedArgs(config),
    url,
  ];

  if (isAudioOnly(formatId)) {
    args.push(
      "--remux-audio",
      "m4a",
      "--postprocessor-args",
      "ffmpeg:-threads 0 -c:a copy",
    );
  } else {
    args.push(
      "--merge-output-format",
      "mp4",
      "--postprocessor-args",
      "ffmpeg:-threads 0 -c copy",
    );
  }

  if (config.cookiesFile) {
    args.push("--cookies", config.cookiesFile);
  }

  let title = "";

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(config.ytDlpPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

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

    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || `yt-dlp exited with code ${code ?? "unknown"}`,
          ),
        );
        return;
      }
      resolve();
    });
  });

  const filePath = await findJobOutputFile(outputDir, jobId);
  await deleteJobArtifacts(outputDir, jobId, filePath);
  onProgress({ progress: 100 });

  return { filePath, title: title || jobId };
}
