import { NextResponse } from "next/server";
import { listServerHistory } from "@/lib/serverHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ownerKey =
    request.headers.get("x-access-key") ??
    request.headers.get("cookie")?.match(/yc_access_key=([^;]+)/)?.[1];

  return NextResponse.json({
    items: listServerHistory(ownerKey ?? undefined),
  });
}
