import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { contentDispositionHeader } from "@/lib/filename";
import { getJob } from "@/lib/jobs";
import { getToolJob } from "@/lib/toolJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = getJob(id);
  const toolJob = job ? null : getToolJob(id);

  if (!job && !toolJob) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const filePath = job?.filePath ?? toolJob?.outputPath;
  const done =
    (job && job.status === "done" && filePath) ||
    (toolJob && toolJob.status === "done" && filePath);

  if (!done || !filePath) {
    return NextResponse.json(
      { error: "File is not ready yet" },
      { status: 409 },
    );
  }

  const fileName = job?.fileName ?? toolJob?.fileName ?? "download.bin";

  try {
    const fileStat = await stat(filePath);
    const stream = createReadStream(filePath);
    const webStream = Readable.toWeb(stream) as ReadableStream;

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
