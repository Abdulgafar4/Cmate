/**
 * Public site origin for canonical / Open Graph URLs.
 * Social crawlers need a reachable https URL — never localhost in production.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (
        process.env.NODE_ENV === "production" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      ) {
        continue;
      }
      return url.origin;
    } catch {
      continue;
    }
  }

  if (process.env.NODE_ENV === "production") {
    return "https://www.toolferry.org";
  }
  return "http://localhost:9090";
}

export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ToolFerry — downloaders, converters, PDF and document tools in one shell",
  type: "image/png",
} as const;
