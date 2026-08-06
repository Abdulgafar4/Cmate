import { randomUUID } from "crypto";
import { getConfig } from "./config";
import { cleanupExpiredFiles, deleteFile, ensureDownloadDir } from "./cleanup";
import type { DownloadOptions } from "./downloadOptions";
import { buildDownloadFilename } from "./filename";
import { notifyDiscord } from "./notify";
import { createShareToken } from "./shareLinks";
import { addServerHistory } from "./serverHistory";
import type { FormatPresetId } from "./validators";
import { cancelDownloadProcess, startDownload } from "./ytdlp";

export type JobStatus =
  | "queued"
  | "downloading"
  | "done"
  | "error"
  | "cancelled";

export interface Job {
  id: string;
  url: string;
  formatId: FormatPresetId;
  videoTitle: string;
  channel?: string;
  options: DownloadOptions;
  status: JobStatus;
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBps?: number;
  etaSeconds?: number;
  filePath?: string;
  fileName?: string;
  subtitlePaths?: string[];
  shareToken?: string;
  error?: string;
  createdAt: number;
  ownerKey?: string;
  toolSlug?: string;
}

interface QueueItem {
  jobId: string;
}

interface GlobalJobs {
  jobs: Map<string, Job>;
  activeCount: number;
  queue: QueueItem[];
  processes: Map<string, true>;
}

const globalForJobs = globalThis as typeof globalThis & {
  __cmateJobs?: GlobalJobs;
};

function getStore(): GlobalJobs {
  if (!globalForJobs.__cmateJobs) {
    globalForJobs.__cmateJobs = {
      jobs: new Map(),
      activeCount: 0,
      queue: [],
      processes: new Map(),
    };
  }
  return globalForJobs.__cmateJobs;
}

export function getJob(jobId: string): Job | undefined {
  return getStore().jobs.get(jobId);
}

export function listJobs(): Job[] {
  return Array.from(getStore().jobs.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function createJob(
  url: string,
  formatId: FormatPresetId,
  videoTitle: string,
  options: DownloadOptions = {},
  meta?: { channel?: string; ownerKey?: string; toolSlug?: string },
): Job {
  const job: Job = {
    id: randomUUID(),
    url,
    formatId,
    videoTitle,
    channel: meta?.channel ?? options.channel,
    options: { ...options, channel: meta?.channel ?? options.channel },
    status: "queued",
    progress: 0,
    createdAt: Date.now(),
    ownerKey: meta?.ownerKey,
    toolSlug: meta?.toolSlug ?? "youtube",
  };

  const store = getStore();
  store.jobs.set(job.id, job);
  store.queue.push({ jobId: job.id });
  void processQueue();

  return job;
}

export function createJobs(
  items: Array<{
    url: string;
    formatId: FormatPresetId;
    title: string;
    options?: DownloadOptions;
    channel?: string;
  }>,
  ownerKey?: string,
): Job[] {
  return items.map((item) =>
    createJob(item.url, item.formatId, item.title, item.options ?? {}, {
      channel: item.channel,
      ownerKey,
    }),
  );
}

export function cancelJob(jobId: string): Job | undefined {
  const store = getStore();
  const job = store.jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  if (job.status === "queued") {
    store.queue = store.queue.filter((item) => item.jobId !== jobId);
    job.status = "cancelled";
    job.error = "Download cancelled";
    return job;
  }

  if (job.status === "downloading") {
    cancelDownloadProcess(jobId);
    job.status = "cancelled";
    job.error = "Download cancelled";
    return job;
  }

  return job;
}

async function processQueue(): Promise<void> {
  const store = getStore();
  const config = await getConfig();

  while (
    store.activeCount < config.maxConcurrentJobs &&
    store.queue.length > 0
  ) {
    const next = store.queue.shift();
    if (!next) {
      break;
    }

    const job = store.jobs.get(next.jobId);
    if (!job || job.status !== "queued") {
      continue;
    }

    store.activeCount += 1;
    void runJob(job).finally(() => {
      store.activeCount -= 1;
      void processQueue();
    });
  }
}

async function runJob(job: Job): Promise<void> {
  if (job.status === "cancelled") {
    return;
  }

  job.status = "downloading";
  job.progress = 0;

  const wasCancelled = () => getJob(job.id)?.status === "cancelled";

  try {
    const config = await getConfig();
    await cleanupExpiredFiles();
    await ensureDownloadDir();

    const result = await startDownload(
      job.url,
      job.formatId,
      config.downloadDir,
      job.id,
      (update) => {
        if (wasCancelled()) {
          return;
        }
        job.progress = update.progress;
        job.downloadedBytes = update.downloadedBytes;
        job.totalBytes = update.totalBytes;
        job.speedBps = update.speedBps;
        job.etaSeconds = update.etaSeconds;
      },
      job.options,
    );

    if (wasCancelled()) {
      await deleteFile(result.filePath);
      for (const subtitle of result.subtitlePaths) {
        await deleteFile(subtitle);
      }
      return;
    }

    job.filePath = result.filePath;
    job.subtitlePaths = result.subtitlePaths;
    job.fileName = buildDownloadFilename(job.videoTitle, result.filePath, {
      template: job.options.filenameTemplate,
      channel: job.channel,
      id: job.id.slice(0, 8),
    });
    job.shareToken = createShareToken(job.id);
    job.status = "done";
    job.progress = 100;

    addServerHistory({
      jobId: job.id,
      title: job.videoTitle,
      url: job.url,
      formatId: job.formatId,
      fileName: job.fileName,
      shareToken: job.shareToken,
      ownerKey: job.ownerKey,
      createdAt: Date.now(),
      toolSlug: job.toolSlug ?? "youtube",
    });

    void notifyDiscord({
      title: job.videoTitle,
      fileName: job.fileName,
      jobId: job.id,
      shareToken: job.shareToken,
    });
  } catch (error) {
    if (wasCancelled()) {
      return;
    }
    job.status = "error";
    job.error =
      error instanceof Error ? error.message : "Unknown download error";
  }
}

export async function removeJobFile(job: Job): Promise<void> {
  if (job.filePath) {
    await deleteFile(job.filePath);
    job.filePath = undefined;
  }
  if (job.subtitlePaths?.length) {
    await Promise.all(job.subtitlePaths.map((filePath) => deleteFile(filePath)));
    job.subtitlePaths = [];
  }
}

export function getQueueStats() {
  const store = getStore();
  const jobs = listJobs();
  return {
    activeCount: store.activeCount,
    queuedCount: store.queue.length,
    totalJobs: jobs.length,
    downloading: jobs.filter((job) => job.status === "downloading").length,
    done: jobs.filter((job) => job.status === "done").length,
    error: jobs.filter((job) => job.status === "error").length,
  };
}
