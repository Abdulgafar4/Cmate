import { getTool } from "./tools";

const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

/** Host suffixes → tool slug / platform label */
const HOST_RULES: Array<{ match: (host: string) => boolean; platform: string; slugs: string[] }> = [
  {
    match: (h) => YOUTUBE_HOSTS.has(h),
    platform: "YouTube",
    slugs: ["youtube", "social"],
  },
  {
    match: (h) => h === "tiktok.com" || h.endsWith(".tiktok.com"),
    platform: "TikTok",
    slugs: ["tiktok", "social"],
  },
  {
    match: (h) =>
      h === "instagram.com" ||
      h.endsWith(".instagram.com") ||
      h === "instagr.am",
    platform: "Instagram",
    slugs: ["instagram", "social"],
  },
  {
    match: (h) =>
      h === "facebook.com" ||
      h.endsWith(".facebook.com") ||
      h === "fb.watch" ||
      h === "fb.com",
    platform: "Facebook",
    slugs: ["facebook", "social"],
  },
  {
    match: (h) =>
      h === "x.com" ||
      h === "twitter.com" ||
      h.endsWith(".twitter.com") ||
      h === "t.co",
    platform: "X",
    slugs: ["x", "social"],
  },
  {
    match: (h) => h === "reddit.com" || h.endsWith(".reddit.com") || h === "redd.it",
    platform: "Reddit",
    slugs: ["reddit", "social"],
  },
  {
    match: (h) => h === "vimeo.com" || h.endsWith(".vimeo.com"),
    platform: "Vimeo",
    slugs: ["vimeo", "social"],
  },
  {
    match: (h) =>
      h === "twitch.tv" ||
      h.endsWith(".twitch.tv") ||
      h === "clips.twitch.tv",
    platform: "Twitch",
    slugs: ["twitch", "social"],
  },
  {
    match: (h) =>
      h === "soundcloud.com" || h.endsWith(".soundcloud.com"),
    platform: "SoundCloud",
    slugs: ["soundcloud", "social"],
  },
];

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function detectPlatform(url: string): {
  platform: string;
  host: string;
} | null {
  try {
    const parsed = new URL(normalizeUrl(url));
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const full = parsed.hostname;
    for (const rule of HOST_RULES) {
      if (rule.match(full) || rule.match(host)) {
        return { platform: rule.platform, host: full };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function isUrlAllowedForTool(url: string, toolSlug: string): boolean {
  try {
    const parsed = new URL(normalizeUrl(url));
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const full = parsed.hostname;
    const host = full.replace(/^www\./, "");

    if (toolSlug === "youtube") {
      return YOUTUBE_HOSTS.has(full);
    }

    for (const rule of HOST_RULES) {
      if ((rule.match(full) || rule.match(host)) && rule.slugs.includes(toolSlug)) {
        if (toolSlug === "youtube" || rule.platform === "YouTube") {
          // keep youtube path checks for dedicated youtube tool
          if (toolSlug === "youtube") {
            if (full === "youtu.be" || host === "youtu.be") {
              return parsed.pathname.length > 1;
            }
            return (
              parsed.pathname === "/watch" ||
              parsed.pathname.startsWith("/shorts/") ||
              parsed.pathname.startsWith("/embed/") ||
              parsed.pathname.startsWith("/playlist")
            );
          }
        }
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function isSupportedDownloadUrl(url: string): boolean {
  return detectPlatform(url) !== null;
}

export function toolSupportsUrl(toolSlug: string): boolean {
  const tool = getTool(toolSlug);
  return Boolean(tool && tool.input === "url");
}

export const SOCIAL_PLATFORMS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Facebook",
  "X",
  "Reddit",
  "Vimeo",
  "Twitch",
  "SoundCloud",
] as const;
