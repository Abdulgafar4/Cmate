import { readdir, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getQueueStats, listJobs } from "@/lib/jobs";
import { listServerHistory } from "@/lib/serverHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return false;
  }
  const header = request.headers.get("x-admin-key");
  const query = new URL(request.url).searchParams.get("key");
  return header === adminKey || query === adminKey;
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
      if (entry.startsWith(".")) {
        continue;
      }
      const fileStat = await stat(path.join(config.downloadDir, entry));
      if (fileStat.isFile()) {
        diskBytes += fileStat.size;
        fileCount += 1;
      }
    }
  } catch {
    // Directory may be empty.
  }

  return NextResponse.json({
    queue: getQueueStats(),
    jobs: listJobs().slice(0, 50).map((job) => ({
      id: job.id,
      title: job.videoTitle,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      fileName: job.fileName,
    })),
    history: listServerHistory().slice(0, 30),
    disk: {
      fileCount,
      bytes: diskBytes,
      downloadDir: config.downloadDir,
    },
  });
}
