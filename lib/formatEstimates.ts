import type { FormatPresetId } from "./validators";

// Rough size estimates from typical bitrates (not exact).
const BITRATE_MB_PER_MIN: Record<FormatPresetId, number> = {
  best: 12,
  "1080p": 8,
  "720p": 4,
  audio: 1,
};

export function estimateFileSize(
  formatId: FormatPresetId,
  durationSeconds: number,
): string {
  if (!durationSeconds) {
    return "Size varies";
  }

  const minutes = durationSeconds / 60;
  const mb = minutes * BITRATE_MB_PER_MIN[formatId];

  if (mb < 1) {
    return `~${Math.max(1, Math.round(mb * 1024))} KB`;
  }

  if (mb >= 1024) {
    return `~${(mb / 1024).toFixed(1)} GB`;
  }

  return `~${Math.round(mb)} MB`;
}
