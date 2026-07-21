import { NextResponse } from "next/server";
import { createJobs } from "@/lib/jobs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { batchDownloadSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`batch:${getClientIp(request)}`, 10);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = batchDownloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const ownerKey =
      request.headers.get("x-access-key") ??
      request.headers.get("cookie")?.match(/yc_access_key=([^;]+)/)?.[1];

    const jobs = createJobs(
      parsed.data.items.map((item) => ({
        url: item.url,
        formatId: item.formatId,
        title: item.title,
        options: item.options,
        channel: item.options?.channel,
      })),
      ownerKey ?? undefined,
    );

    return NextResponse.json({
      jobIds: jobs.map((job) => job.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start batch",
      },
      { status: 500 },
    );
  }
}
