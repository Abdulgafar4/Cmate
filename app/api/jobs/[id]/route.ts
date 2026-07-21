import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    downloadedBytes: job.downloadedBytes,
    totalBytes: job.totalBytes,
    speedBps: job.speedBps,
    etaSeconds: job.etaSeconds,
    fileName: job.fileName,
    videoTitle: job.videoTitle,
    shareToken: job.shareToken,
    subtitlePaths: job.subtitlePaths?.map((path) => path.split("/").pop()),
    error: job.error,
  });
}
