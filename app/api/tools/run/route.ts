import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getTool } from "@/lib/tools";
import { createToolJob } from "@/lib/toolJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  toolSlug: z.string().min(1),
  title: z.string().max(300).optional(),
  options: z.record(z.string(), z.string()).optional(),
  inputPaths: z.array(z.string()).optional(),
  textInput: z.string().max(2_000_000).optional(),
});

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`tool-run:${getClientIp(request)}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const tool = getTool(parsed.data.toolSlug);
    if (!tool) {
      return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
    }
    if (tool.input === "url") {
      return NextResponse.json(
        { error: "URL tools use /api/info and /api/download" },
        { status: 400 },
      );
    }

    const ownerKey =
      request.headers.get("x-access-key") ??
      request.headers.get("cookie")?.match(/yc_access_key=([^;]+)/)?.[1];

    const job = createToolJob({
      toolSlug: parsed.data.toolSlug,
      title: parsed.data.title,
      options: parsed.data.options,
      inputPaths: parsed.data.inputPaths,
      textInput: parsed.data.textInput,
      ownerKey: ownerKey ?? undefined,
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start tool",
      },
      { status: 500 },
    );
  }
}
