import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "yc_access_key";

const PUBLIC_PATHS = [
  "/api/health",
  "/api/auth",
  "/api/share",
  "/api/admin",
  "/unlock",
  "/admin",
  "/icon",
  "/opengraph-image",
];

function isPublic(pathname: string) {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".webp")
  ) {
    return true;
  }

  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const accessKey = process.env.ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const header = request.headers.get("x-access-key");
  const authorized = cookie === accessKey || header === accessKey;

  if (authorized) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid access key." },
      { status: 401 },
    );
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  unlockUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
