import { NextResponse } from "next/server";
import { cancelJob, getJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = getJob(id);
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const job = cancelJob(id);
  return NextResponse.json({
    id: job?.id,
    status: job?.status,
  });
}
