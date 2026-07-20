"use client";

import Image from "next/image";
import { Clock3 } from "lucide-react";

interface VideoPreviewProps {
  title: string;
  thumbnail: string;
  duration: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) {
    return "Unknown duration";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function VideoPreview({ title, thumbnail, duration }: VideoPreviewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {thumbnail ? (
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium text-white bg-black/80">
              <Clock3 className="size-3" />
              {formatDuration(duration)}
            </div>
            <h2 className="line-clamp-2 text-base font-medium leading-snug text-white">
              {title}
            </h2>
          </div>
        </div>
      ) : (
        <div className="space-y-2 p-4">
          <h2 className="line-clamp-2 text-base font-medium leading-snug">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDuration(duration)}
          </p>
        </div>
      )}
    </div>
  );
}
