import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function resolveBinary(binary: string): Promise<string | null> {
  if (binary.includes(path.sep)) {
    return binary;
  }

  try {
    const { stdout } = await execFileAsync("which", [binary]);
    const resolved = stdout.trim();
    return resolved || null;
  } catch {
    return null;
  }
}

async function requireBinary(binary: string, envName: string): Promise<string> {
  const resolved = await resolveBinary(binary);
  if (!resolved) {
    throw new Error(`Could not resolve ${envName} (${binary})`);
  }
  return resolved;
}

export async function loadConfig() {
  const downloadDir =
    process.env.DOWNLOAD_DIR ?? path.join(process.cwd(), "downloads");

  const [ytDlpPath, ffmpegPath, aria2cPath] = await Promise.all([
    requireBinary(process.env.YT_DLP_PATH ?? "yt-dlp", "YT_DLP_PATH"),
    requireBinary(process.env.FFMPEG_PATH ?? "ffmpeg", "FFMPEG_PATH"),
    resolveBinary(process.env.ARIA2C_PATH ?? "aria2c"),
  ]);

  return {
    downloadDir,
    maxConcurrentJobs: Number(process.env.MAX_CONCURRENT_JOBS ?? "2"),
    fileTtlMs: Number(process.env.FILE_TTL_MS ?? "3600000"),
    ytDlpPath,
    ffmpegPath,
    aria2cPath,
    concurrentFragments: Number(process.env.YT_DLP_CONCURRENT_FRAGMENTS ?? "16"),
    httpChunkSize: process.env.YT_DLP_HTTP_CHUNK_SIZE ?? "10M",
    bufferSize: process.env.YT_DLP_BUFFER_SIZE ?? "128K",
    cookiesFile: process.env.YT_DLP_COOKIES_FILE,
    rateLimitPerHour: Number(process.env.RATE_LIMIT_PER_HOUR ?? "30"),
    adminKey: process.env.ADMIN_KEY,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  };
}

export type AppConfig = Awaited<ReturnType<typeof loadConfig>>;

let cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadConfig();
  }
  return cachedConfig;
}
