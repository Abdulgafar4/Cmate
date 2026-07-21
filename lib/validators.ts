import { z } from "zod";
import type { FormatPresetId } from "./downloadOptions";

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
      parsed.pathname.startsWith("/embed/") ||
      parsed.pathname === "/playlist" ||
      parsed.pathname.startsWith("/playlist")
    );
  } catch {
    return false;
  }
}

export function isPlaylistUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.pathname === "/playlist" ||
      parsed.searchParams.has("list")
    );
  } catch {
    return false;
  }
}

const formatEnum = z.enum([
  "best",
  "1080p",
  "720p",
  "audio",
  "mp3",
  "opus",
]);

export const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isValidYouTubeUrl, "Only YouTube URLs are allowed"),
});

export const downloadOptionsSchema = z
  .object({
    startSeconds: z.number().int().min(0).optional(),
    endSeconds: z.number().int().min(1).optional(),
    writeSubtitles: z.boolean().optional(),
    filenameTemplate: z.string().max(200).optional(),
    channel: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      value.startSeconds == null ||
      value.endSeconds == null ||
      value.endSeconds > value.startSeconds,
    { message: "End time must be after start time" },
  );

export const downloadSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isValidYouTubeUrl, "Only YouTube URLs are allowed"),
  formatId: formatEnum,
  title: z.string().min(1, "Title is required").max(300),
  options: downloadOptionsSchema.optional(),
});

export const batchDownloadSchema = z.object({
  items: z
    .array(
      z.object({
        url: z
          .string()
          .min(1)
          .refine(isValidYouTubeUrl, "Only YouTube URLs are allowed"),
        formatId: formatEnum,
        title: z.string().min(1).max(300),
        options: downloadOptionsSchema.optional(),
      }),
    )
    .min(1, "Add at least one video")
    .max(25, "Maximum 25 videos per batch"),
});

export type { FormatPresetId };
export type DownloadSchema = z.infer<typeof downloadSchema>;
