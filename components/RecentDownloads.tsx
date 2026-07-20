"use client";

import Image from "next/image";
import { Clock, X } from "lucide-react";
import type { RecentDownload } from "@/lib/recentDownloads";

interface RecentDownloadsProps {
  items: RecentDownload[];
  onSelect: (url: string) => void;
  onClear: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentDownloads({ items, onSelect, onClear }: RecentDownloadsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="animate-fade-in-up mt-8" aria-label="Recent downloads">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Recent downloads</h2>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.id}-${item.downloadedAt}`}>
            <button
              type="button"
              onClick={() => onSelect(item.url)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-2 text-left transition-colors hover:bg-muted"
            >
              {item.thumbnail ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <X className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {timeAgo(item.downloadedAt)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
