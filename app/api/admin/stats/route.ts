import { readdir, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getQueueStats, listJobs } from "@/lib/jobs";
import { listServerHistory } from "@/lib/serverHistory";
import { getTool, TOOLS } from "@/lib/tools";
import { getToolQueueStats, listToolJobs } from "@/lib/toolJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const adminKey = process.env.ADMIN_KEY;
  // Open by default when no ADMIN_KEY (same pattern as ACCESS_KEY)
  if (!adminKey) return true;
  const header = request.headers.get("x-admin-key");
  const query = new URL(request.url).searchParams.get("key");
  return header === adminKey || query === adminKey;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getConfig();
  let diskBytes = 0;
  let fileCount = 0;

  try {
    const entries = await readdir(config.downloadDir);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      try {
        const fileStat = await stat(path.join(config.downloadDir, entry));
        if (fileStat.isFile()) {
          diskBytes += fileStat.size;
          fileCount += 1;
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* empty */
  }

  const downloadJobs = listJobs();
  const toolJobs = listToolJobs();
  const history = listServerHistory();
  const now = Date.now();
  const dayMs = 86_400_000;
  const days = 30;

  // Jobs per day (last 30)
  const dayCounts = Array.from({ length: days }, () => 0);
  const allCreated = [
    ...downloadJobs.map((j) => j.createdAt),
    ...toolJobs.map((j) => j.createdAt),
    ...history.map((h) => h.createdAt),
  ];
  for (const ts of allCreated) {
    const ageDays = Math.floor((now - ts) / dayMs);
    if (ageDays >= 0 && ageDays < days) {
      dayCounts[days - 1 - ageDays] += 1;
    }
  }
  const maxDay = Math.max(1, ...dayCounts);

  // Durations from finished download jobs still in memory
  const durations: number[] = [];
  for (const j of downloadJobs) {
    if (j.status === "done" || j.status === "error") {
      // approximate: no finishedAt stored — skip precise median; use progress proxies later
    }
  }
  void durations;

  const finished = [
    ...downloadJobs.filter((j) =>
      ["done", "error", "cancelled"].includes(j.status),
    ),
    ...toolJobs.filter((j) =>
      ["done", "error", "cancelled"].includes(j.status),
    ),
  ];
  const errors = finished.filter((j) => j.status === "error");
  const failureRate =
    finished.length === 0
      ? 0
      : Math.round((errors.length / finished.length) * 1000) / 10;

  const totalJobs =
    history.length +
    downloadJobs.length +
    toolJobs.length;

  // Top tools from history toolSlug
  const counts = new Map<string, number>();
  for (const h of history) {
    const slug = h.toolSlug || (h.url?.includes("youtube") ? "youtube" : "unknown");
    counts.set(slug, (counts.get(slug) || 0) + 1);
  }
  for (const j of toolJobs) {
    counts.set(j.toolSlug, (counts.get(j.toolSlug) || 0) + 1);
  }
  // youtube downloads without history toolSlug already counted via history
  for (const j of downloadJobs) {
    if (!history.some((h) => h.jobId === j.id)) {
      counts.set("youtube", (counts.get("youtube") || 0) + 1);
    }
  }

  const topTools = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, n]) => {
      const tool = getTool(slug);
      return {
        slug,
        name: tool?.name ?? slug,
        count: n,
      };
    });
  const topMax = Math.max(1, ...topTools.map((t) => t.count));

  const queue = getQueueStats();
  const toolQueue = getToolQueueStats();

  return NextResponse.json({
    generatedAt: now,
    stats: [
      {
        k: "JOBS · TRACKED",
        v: String(totalJobs),
        note: `${history.length} in history · ${queue.activeCount + toolQueue.active} active now`,
      },
      {
        k: "QUEUE",
        v: String(queue.activeCount + toolQueue.active),
        note: `${queue.queuedCount + toolQueue.queued} waiting · max ${config.maxConcurrentJobs} concurrent`,
      },
      {
        k: "FAILURE RATE",
        v: `${failureRate}%`,
        note:
          finished.length === 0
            ? "No finished jobs in memory yet"
            : `${errors.length} of ${finished.length} recent finished jobs`,
      },
      {
        k: "STORAGE",
        v: formatBytes(diskBytes),
        note: `${fileCount} files · auto-purged hourly`,
      },
    ],
    chart: dayCounts.map((n) => ({
      count: n,
      h: `${Math.round((n / maxDay) * 100)}%`,
    })),
    chartLabels: {
      start: new Date(now - (days - 1) * dayMs).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      mid: new Date(now - 15 * dayMs).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      end: new Date(now).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    },
    topTools: topTools.map((t) => ({
      ...t,
      w: `${Math.round((t.count / topMax) * 100)}%`,
    })),
    toolCatalogSize: TOOLS.length,
    queue: { ...queue, tools: toolQueue },
    jobs: [
      ...downloadJobs.slice(0, 30).map((job) => ({
        id: job.id,
        title: job.videoTitle,
        status: job.status,
        progress: job.progress,
        error: job.error,
        createdAt: job.createdAt,
        fileName: job.fileName,
        kind: "download" as const,
      })),
      ...toolJobs.slice(0, 30).map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        progress: job.progress,
        error: job.error,
        createdAt: job.createdAt,
        fileName: job.fileName,
        kind: "tool" as const,
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50),
    history: history.slice(0, 30),
    disk: {
      fileCount,
      bytes: diskBytes,
      label: formatBytes(diskBytes),
      downloadDir: config.downloadDir,
    },
  });
}
