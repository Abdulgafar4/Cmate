import { NextResponse } from "next/server";
import { createJob } from "@/lib/jobs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { downloadSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`download:${getClientIp(request)}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rate.resetAt),
          },
        },
      );
    }

    const body = await request.json();
    const parsed = downloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const ownerKey =
      request.headers.get("x-access-key") ??
      request.headers.get("cookie")?.match(/yc_access_key=([^;]+)/)?.[1];

    const job = createJob(
      parsed.data.url,
      parsed.data.formatId,
      parsed.data.title,
      parsed.data.options ?? {},
      {
        channel: parsed.data.options?.channel,
        ownerKey: ownerKey ?? undefined,
        toolSlug: parsed.data.toolSlug,
      },
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
