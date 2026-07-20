import { NextResponse } from "next/server";
import { FORMAT_OPTIONS } from "@/lib/formats";
import { getVideoInfo } from "@/lib/ytdlp";
import { urlSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = urlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const info = await getVideoInfo(parsed.data.url);

    return NextResponse.json({
      ...info,
      formats: FORMAT_OPTIONS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch video info",
      },
      { status: 500 },
    );
  }
}
