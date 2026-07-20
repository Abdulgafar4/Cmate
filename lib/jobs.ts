import { randomUUID } from "crypto";
import { getConfig } from "./config";
import { cleanupExpiredFiles, deleteFile, ensureDownloadDir } from "./cleanup";
import { buildDownloadFilename } from "./filename";
import type { FormatPresetId } from "./validators";
import { startDownload } from "./ytdlp";

export type JobStatus = "queued" | "downloading" | "done" | "error";

export interface Job {
  id: string;
  url: string;
  formatId: FormatPresetId;
  videoTitle: string;
  status: JobStatus;
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBps?: number;
  etaSeconds?: number;
  filePath?: string;
  fileName?: string;
  error?: string;
  createdAt: number;
}

interface GlobalJobs {
  jobs: Map<string, Job>;
  activeCount: number;
  queue: Array<{ jobId: string; url: string; formatId: FormatPresetId }>;
}

const globalForJobs = globalThis as typeof globalThis & {
  __ycDownloaderJobs?: GlobalJobs;
};

function getStore(): GlobalJobs {
  if (!globalForJobs.__ycDownloaderJobs) {
    globalForJobs.__ycDownloaderJobs = {
      jobs: new Map(),
      activeCount: 0,
      queue: [],
    };
  }
  return globalForJobs.__ycDownloaderJobs;
}

export function getJob(jobId: string): Job | undefined {
  return getStore().jobs.get(jobId);
}

export function createJob(
  url: string,
  formatId: FormatPresetId,
  videoTitle: string,
): Job {
  const job: Job = {
    id: randomUUID(),
    url,
    formatId,
    videoTitle,
    status: "queued",
    progress: 0,
    createdAt: Date.now(),
  };

  const store = getStore();
  store.jobs.set(job.id, job);
  store.queue.push({ jobId: job.id, url, formatId });
  void processQueue();

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
  job.status = "downloading";
  job.progress = 0;

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
        job.progress = update.progress;
        job.downloadedBytes = update.downloadedBytes;
        job.totalBytes = update.totalBytes;
        job.speedBps = update.speedBps;
        job.etaSeconds = update.etaSeconds;
      },
    );

    job.filePath = result.filePath;
    job.fileName = buildDownloadFilename(job.videoTitle, result.filePath);
    job.status = "done";
    job.progress = 100;
  } catch (error) {
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
}
