import { NextResponse } from "next/server";
import { getLauncherStatus } from "@/lib/launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getLauncherStatus());
}
