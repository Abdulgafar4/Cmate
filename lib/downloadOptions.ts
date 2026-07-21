export type FormatPresetId =
  | "best"
  | "1080p"
  | "720p"
  | "audio"
  | "mp3"
  | "opus";

export interface DownloadOptions {
  startSeconds?: number;
  endSeconds?: number;
  writeSubtitles?: boolean;
  filenameTemplate?: string;
  channel?: string;
}

export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function parseTimestamp(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0)) {
    return undefined;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return undefined;
}

export function buildSectionArg(
  startSeconds?: number,
  endSeconds?: number,
): string | undefined {
  if (startSeconds == null && endSeconds == null) {
    return undefined;
  }
  const start = formatTimestamp(startSeconds ?? 0);
  if (endSeconds == null) {
    return `*${start}-inf`;
  }
  return `*${start}-${formatTimestamp(endSeconds)}`;
}
