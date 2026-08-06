import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { contentDispositionHeader } from "@/lib/filename";
import { getJob } from "@/lib/jobs";
import { resolveShareToken } from "@/lib/shareLinks";
import { getToolJob } from "@/lib/toolJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const jobId = resolveShareToken(token);
  if (!jobId) {
    return NextResponse.json(
      { error: "Share link expired or invalid" },
      { status: 404 },
    );
  }

  const job = getJob(jobId);
  const toolJob = job ? null : getToolJob(jobId);
  const filePath = job?.filePath ?? toolJob?.outputPath;
  const ready =
    (job && job.status === "done" && filePath) ||
    (toolJob && toolJob.status === "done" && filePath);

  if (!ready || !filePath) {
    return NextResponse.json(
      { error: "File is not available" },
      { status: 409 },
    );
  }

  try {
    const fileStat = await stat(filePath);
    const stream = createReadStream(filePath);
    const webStream = Readable.toWeb(stream) as ReadableStream;
    const fileName = job?.fileName ?? toolJob?.fileName ?? "download.bin";

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": contentDispositionHeader(fileName),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to stream file",
      },
      { status: 500 },
    );
  }
}
