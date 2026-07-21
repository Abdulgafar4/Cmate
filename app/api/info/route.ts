import { NextResponse } from "next/server";
import { FORMAT_OPTIONS } from "@/lib/formats";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isPlaylistUrl, urlSchema } from "@/lib/validators";
import { getPlaylistInfo, getVideoInfo } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`info:${getClientIp(request)}`, 60);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = urlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (isPlaylistUrl(parsed.data.url) && !parsed.data.url.includes("watch")) {
      const playlist = await getPlaylistInfo(parsed.data.url);
      return NextResponse.json({
        type: "playlist",
        id: playlist.id,
        title: playlist.title,
        entries: playlist.entries,
        formats: FORMAT_OPTIONS,
      });
    }

    // watch URLs with list= still fetch single video by default
    const info = await getVideoInfo(parsed.data.url);
    return NextResponse.json({
      type: "video",
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
