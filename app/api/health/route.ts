import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConfig();

    return NextResponse.json({
      ok: true,
      ytDlp: Boolean(config.ytDlpPath),
      ffmpeg: Boolean(config.ffmpegPath),
      downloadDir: config.downloadDir,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 },
    );
  }
}
