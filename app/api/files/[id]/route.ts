import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { contentDispositionHeader } from "@/lib/filename";
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

  if (job.status !== "done" || !job.filePath) {
    return NextResponse.json(
      { error: "File is not ready yet" },
      { status: 409 },
    );
  }

  try {
    const fileStat = await stat(job.filePath);
    const stream = createReadStream(job.filePath);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    const fileName = job.fileName ?? "download.mp4";

    const response = new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": contentDispositionHeader(fileName),
        "Cache-Control": "no-store",
      },
    });

    return response;
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
