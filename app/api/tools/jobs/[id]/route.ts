import { NextResponse } from "next/server";
import { cancelToolJob, getToolJob } from "@/lib/toolJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = getToolJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    toolSlug: job.toolSlug,
    title: job.title,
    status: job.status,
    progress: job.progress,
    fileName: job.fileName,
    shareToken: job.shareToken,
    error: job.error,
    resultText: job.resultText,
    createdAt: job.createdAt,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;
  if (body?.action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
  const job = cancelToolJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, status: job.status });
}
