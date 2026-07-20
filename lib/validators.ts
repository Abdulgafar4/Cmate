import { z } from "zod";

const ALLOWED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

export function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return false;
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.length > 1;
    }
    return (
      parsed.pathname === "/watch" ||
      parsed.pathname.startsWith("/shorts/") ||
      parsed.pathname.startsWith("/embed/")
    );
  } catch {
    return false;
  }
}

export const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isValidYouTubeUrl, "Only YouTube URLs are allowed"),
});

export const downloadSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isValidYouTubeUrl, "Only YouTube URLs are allowed"),
  formatId: z.enum(["best", "1080p", "720p", "audio"]),
  title: z.string().min(1, "Title is required").max(300),
});

export type FormatPresetId = z.infer<typeof downloadSchema>["formatId"];
