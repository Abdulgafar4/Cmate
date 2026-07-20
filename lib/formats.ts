import type { FormatPresetId } from "./validators";

export interface FormatOption {
  id: FormatPresetId;
  label: string;
  description: string;
  badge?: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "best",
    label: "Best",
    description: "Highest available quality",
    badge: "Best quality",
  },
  {
    id: "1080p",
    label: "1080p",
    description: "Full HD video",
    badge: "Full HD",
  },
  {
    id: "720p",
    label: "720p",
    description: "HD video, faster download",
    badge: "Fastest",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Audio track only (M4A)",
    badge: "Smallest",
  },
];

const FORMAT_SPECS: Record<FormatPresetId, string> = {
  best: "best[ext=mp4]/bestvideo+bestaudio/best",
  "1080p":
    "best[height<=1080][ext=mp4]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
  "720p":
    "best[height<=720][ext=mp4]/bestvideo[height<=720]+bestaudio/best[height<=720]",
  audio: "bestaudio[ext=m4a]/bestaudio/best",
};

export function getFormatSpec(formatId: FormatPresetId): string {
  return FORMAT_SPECS[formatId];
}

export function isAudioOnly(formatId: FormatPresetId): boolean {
  return formatId === "audio";
}
