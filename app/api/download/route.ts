import { NextResponse } from "next/server";
import { createJob } from "@/lib/jobs";
import { downloadSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = downloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const job = createJob(
      parsed.data.url,
      parsed.data.formatId,
      parsed.data.title,
    );

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start download",
      },
      { status: 500 },
    );
  }
}
