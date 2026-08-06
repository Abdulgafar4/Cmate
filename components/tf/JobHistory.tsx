"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearRecentDownloads,
  getRecentDownloads,
} from "@/lib/recentDownloads";

type HistoryItem = {
  jobId: string;
  title: string;
  url: string;
  formatId: string;
  fileName: string;
  shareToken?: string;
  createdAt: number;
  pinned?: boolean;
  pinnedUntil?: number;
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function pinDaysLeft(pinnedUntil?: number): string {
  if (!pinnedUntil) return "7d";
  const days = Math.max(1, Math.ceil((pinnedUntil - Date.now()) / 86_400_000));
  return `${days}d left`;
}

export function JobHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Could not load history");
      const data = (await res.json()) as { items?: HistoryItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePin(item: HistoryItem) {
    setPinningId(item.jobId);
    setError(null);
    const nextPinned = !item.pinned;
    // optimistic
    setItems((prev) =>
      prev
        .map((row) =>
          row.jobId === item.jobId
            ? {
                ...row,
                pinned: nextPinned,
                pinnedUntil: nextPinned
                  ? Date.now() + 7 * 24 * 60 * 60 * 1000
                  : undefined,
              }
            : row,
        )
        .sort((a, b) => {
          const ap = a.pinned ? 1 : 0;
          const bp = b.pinned ? 1 : 0;
          if (ap !== bp) return bp - ap;
          return b.createdAt - a.createdAt;
        }),
    );
    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.jobId, pinned: nextPinned }),
      });
      if (!res.ok) {
        throw new Error("Could not update pin");
      }
      const data = (await res.json()) as { item?: HistoryItem };
      if (data.item) {
        setItems((prev) =>
          prev
            .map((row) => (row.jobId === item.jobId ? { ...row, ...data.item } : row))
            .sort((a, b) => {
              const ap = a.pinned ? 1 : 0;
              const bp = b.pinned ? 1 : 0;
              if (ap !== bp) return bp - ap;
              return b.createdAt - a.createdAt;
            }),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update pin");
      await load();
    } finally {
      setPinningId(null);
    }
  }

  async function clearHistory() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setClearing(true);
    setError(null);
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not clear history");
      clearRecentDownloads();
      // Keep pinned rows locally until reload
      setItems((prev) => prev.filter((i) => i.pinned));
      setConfirm(false);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("yc-downloader-recent-change"));
      void getRecentDownloads();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not clear history");
    } finally {
      setClearing(false);
    }
  }

  const hasUnpinned = items.some((i) => !i.pinned);

  return (
    <main className="animate-tf-fade relative z-1 mx-auto max-w-[1240px] px-4 py-8 pb-16 sm:px-5 sm:py-10 md:px-7">
      <div className="mb-[26px] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 font-display text-[clamp(2.2rem,4.4vw,52px)] font-extrabold uppercase tracking-[-0.045em] tf-display-shadow">
            Job history
          </h1>
          <p className="mt-2.5 text-[15px] text-[var(--ink2)]">
            Files are removed about an hour after completion. Pin a job to keep
            its file for seven days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirm ? (
            <>
              <span className="text-[13px] text-[var(--ink2)]">
                Clear unpinned history? Pinned jobs stay.
              </span>
              <button
                type="button"
                disabled={clearing}
                onClick={() => void clearHistory()}
                className="h-9 rounded-full border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_12%,transparent)] px-4 text-[13px] font-medium text-[var(--warn)] disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Yes, clear"}
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={() => setConfirm(false)}
                className="h-9 rounded-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[13px] text-[var(--ink2)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading || !hasUnpinned}
              onClick={() => void clearHistory()}
              className="h-9 rounded-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[13px] font-medium text-[var(--ink2)] transition-colors hover:border-[var(--ink2)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mb-4 text-[13.5px] text-[var(--warn)]">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] tf-shadow">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_100px_100px_88px] gap-4 border-b border-[var(--line)] px-5 py-3 font-mono text-[10.5px] tracking-wider text-[var(--muted)] sm:grid">
          <span>OUTPUT</span>
          <span>SOURCE</span>
          <span>FORMAT</span>
          <span>WHEN</span>
          <span>PIN</span>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-[14px] text-[var(--muted)]">
            Loading history…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="m-0 font-display text-[22px] font-extrabold tracking-tight">
              No jobs yet
            </p>
            <p className="mx-auto mt-2 max-w-[40ch] text-[14px] text-[var(--ink2)]">
              Finished downloads and conversions will show up here.
            </p>
          </div>
        ) : (
          items.map((j) => {
            const pinned = Boolean(j.pinned);
            return (
              <div
                key={`${j.jobId}-${j.createdAt}`}
                className="grid grid-cols-1 gap-2.5 border-b border-[var(--line)] px-4 py-4 text-[13.5px] last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_100px_100px_88px] sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
              >
                <span className="flex min-w-0 flex-col gap-1 sm:block">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] sm:hidden">
                    OUTPUT
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium" title={j.fileName}>
                      {j.fileName || j.title}
                    </span>
                    {pinned ? (
                      <span
                        className="shrink-0 rounded-[5px] border px-[7px] py-0.5 font-mono text-[10.5px]"
                        style={{
                          color: "var(--accent)",
                          borderColor: "var(--accent)",
                        }}
                      >
                        PINNED · {pinDaysLeft(j.pinnedUntil)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-1 sm:block">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] sm:hidden">
                    SOURCE
                  </span>
                  <span className="truncate text-[var(--ink2)]" title={j.title}>
                    {j.title}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-3 sm:block">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] sm:hidden">
                    FORMAT
                  </span>
                  <span className="font-mono text-[12px] text-[var(--ink2)]">
                    {j.formatId}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-3 sm:block">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] sm:hidden">
                    WHEN
                  </span>
                  <span className="font-mono text-[12px] text-[var(--muted)]">
                    {timeAgo(j.createdAt)}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={pinningId === j.jobId}
                  onClick={() => void togglePin(j)}
                  aria-pressed={pinned}
                  title={
                    pinned
                      ? "Unpin — file follows normal 1-hour cleanup"
                      : "Pin — keep file for 7 days"
                  }
                  className="min-h-11 justify-self-start rounded-full border px-4 text-[13px] font-medium transition-colors disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-[12px]"
                  style={
                    pinned
                      ? {
                          borderColor: "var(--accent)",
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }
                      : {
                          borderColor: "var(--line2)",
                          background: "var(--surface)",
                          color: "var(--ink2)",
                        }
                  }
                >
                  {pinned ? "Unpin" : "Pin"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
