import { NextResponse } from "next/server";
import {
  clearServerHistory,
  listServerHistory,
  setHistoryPinned,
} from "@/lib/serverHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerFromRequest(request: Request): string | undefined {
  return (
    request.headers.get("x-access-key") ??
    request.headers.get("cookie")?.match(/yc_access_key=([^;]+)/)?.[1] ??
    undefined
  );
}

export async function GET(request: Request) {
  const ownerKey = ownerFromRequest(request);
  return NextResponse.json({
    items: listServerHistory(ownerKey),
  });
}

export async function DELETE(request: Request) {
  const ownerKey = ownerFromRequest(request);
  const cleared = clearServerHistory(ownerKey);
  return NextResponse.json({ ok: true, cleared });
}

export async function PATCH(request: Request) {
  const ownerKey = ownerFromRequest(request);
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    pinned?: boolean;
  } | null;

  const jobId = body?.jobId?.trim();
  if (!jobId || typeof body?.pinned !== "boolean") {
    return NextResponse.json(
      { error: "Expected { jobId, pinned }" },
      { status: 400 },
    );
  }

  const entry = setHistoryPinned(jobId, body.pinned, ownerKey);
  if (!entry) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: entry });
}
