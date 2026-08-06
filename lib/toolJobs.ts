import { randomUUID } from "crypto";
import { getConfig } from "./config";
import { cleanupExpiredFiles, deleteFile, ensureDownloadDir } from "./cleanup";
import { addServerHistory } from "./serverHistory";
import { createShareToken } from "./shareLinks";
import { getTool } from "./tools";

// runners imported dynamically inside runToolJob to avoid pulling sharp into unrelated routes

export type ToolJobStatus =
  | "queued"
  | "running"
  | "done"
  | "error"
  | "cancelled";

export interface ToolJob {
  id: string;
  toolSlug: string;
  title: string;
  status: ToolJobStatus;
  progress: number;
  options: Record<string, string>;
  inputPaths: string[];
  textInput?: string;
  outputPath?: string;
  fileName?: string;
  shareToken?: string;
  error?: string;
  resultText?: string;
  createdAt: number;
  ownerKey?: string;
}

interface Store {
  jobs: Map<string, ToolJob>;
  queue: string[];
  activeCount: number;
}

const globalForTools = globalThis as typeof globalThis & {
  __tfToolJobs?: Store;
};

function getStore(): Store {
  if (!globalForTools.__tfToolJobs) {
    globalForTools.__tfToolJobs = {
      jobs: new Map(),
      queue: [],
      activeCount: 0,
    };
  }
  return globalForTools.__tfToolJobs;
}

export function getToolJob(id: string): ToolJob | undefined {
  return getStore().jobs.get(id);
}

export function listToolJobs(): ToolJob[] {
  return Array.from(getStore().jobs.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function createToolJob(input: {
  toolSlug: string;
  title?: string;
  options?: Record<string, string>;
  inputPaths?: string[];
  textInput?: string;
  ownerKey?: string;
}): ToolJob {
  const tool = getTool(input.toolSlug);
  if (!tool) {
    throw new Error(`Unknown tool: ${input.toolSlug}`);
  }

  const job: ToolJob = {
    id: randomUUID(),
    toolSlug: input.toolSlug,
    title: input.title?.trim() || tool.name,
    status: "queued",
    progress: 0,
    options: input.options ?? {},
    inputPaths: input.inputPaths ?? [],
    textInput: input.textInput,
    createdAt: Date.now(),
    ownerKey: input.ownerKey,
  };

  const store = getStore();
  store.jobs.set(job.id, job);
  store.queue.push(job.id);
  void processQueue();
  return job;
}

export function cancelToolJob(jobId: string): ToolJob | undefined {
  const store = getStore();
  const job = store.jobs.get(jobId);
  if (!job) return undefined;

  if (job.status === "queued") {
    store.queue = store.queue.filter((id) => id !== jobId);
    job.status = "cancelled";
    job.error = "Cancelled";
    return job;
  }

  if (job.status === "running") {
    job.status = "cancelled";
    job.error = "Cancelled";
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
    const id = store.queue.shift();
    if (!id) break;
    const job = store.jobs.get(id);
    if (!job || job.status !== "queued") continue;

    store.activeCount += 1;
    void runToolJob(job).finally(() => {
      store.activeCount -= 1;
      void processQueue();
    });
  }
}

async function runToolJob(job: ToolJob): Promise<void> {
  if (job.status === "cancelled") return;

  job.status = "running";
  job.progress = 5;

  const wasCancelled = () => getToolJob(job.id)?.status === "cancelled";

  try {
    await cleanupExpiredFiles();
    await ensureDownloadDir();
    const config = await getConfig();

    const { runTool } = await import("./runners");
    const result = await runTool({
      toolSlug: job.toolSlug,
      jobId: job.id,
      options: job.options,
      inputPaths: job.inputPaths,
      textInput: job.textInput,
      outputDir: config.downloadDir,
      onProgress: (pct) => {
        if (!wasCancelled()) job.progress = Math.min(99, Math.max(5, pct));
      },
    });

    if (wasCancelled()) {
      if (result.outputPath) await deleteFile(result.outputPath);
      return;
    }

    job.progress = 100;
    job.status = "done";
    job.outputPath = result.outputPath;
    job.fileName = result.fileName;
    job.resultText = result.resultText;
    if (result.outputPath) {
      job.shareToken = createShareToken(job.id);
    }

    addServerHistory({
      jobId: job.id,
      title: job.title,
      url: job.toolSlug,
      formatId: job.toolSlug,
      fileName: job.fileName ?? job.title,
      shareToken: job.shareToken,
      ownerKey: job.ownerKey,
      createdAt: Date.now(),
      toolSlug: job.toolSlug,
    });
  } catch (error) {
    if (wasCancelled()) return;
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Tool failed";
  }
}

export function getToolQueueStats() {
  const jobs = listToolJobs();
  return {
    active: jobs.filter((j) => j.status === "running").length,
    queued: jobs.filter((j) => j.status === "queued").length,
    total: jobs.length,
    byStatus: {
      queued: jobs.filter((j) => j.status === "queued").length,
      running: jobs.filter((j) => j.status === "running").length,
      done: jobs.filter((j) => j.status === "done").length,
      error: jobs.filter((j) => j.status === "error").length,
      cancelled: jobs.filter((j) => j.status === "cancelled").length,
    },
  };
}
