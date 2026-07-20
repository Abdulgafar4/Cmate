import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "yc_access_key";

export async function POST(request: Request) {
  const expected = process.env.ACCESS_KEY;
  if (!expected) {
    return NextResponse.json({ ok: true, required: false });
  }

  const body = (await request.json().catch(() => null)) as {
    key?: string;
  } | null;
  const key = body?.key?.trim() ?? "";

  if (key !== expected) {
    return NextResponse.json({ error: "Invalid access key" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const expected = process.env.ACCESS_KEY;
  if (!expected) {
    return NextResponse.json({ required: false, unlocked: true });
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  return NextResponse.json({
    required: true,
    unlocked: cookie === expected,
  });
}
