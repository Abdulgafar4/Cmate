import { NextResponse } from "next/server";
import { touchLauncherHeartbeat } from "@/lib/launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  touchLauncherHeartbeat();
  return NextResponse.json({ ok: true });
}
