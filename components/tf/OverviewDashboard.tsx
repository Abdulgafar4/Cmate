"use client";

import { useEffect, useState } from "react";

type StatsPayload = {
  stats: Array<{ k: string; v: string; note: string }>;
  chart: Array<{ count: number; h: string }>;
  chartLabels: { start: string; mid: string; end: string };
  topTools: Array<{ slug: string; name: string; count: number; w: string }>;
  toolCatalogSize: number;
  disk: { label: string; fileCount: number };
};

export function OverviewDashboard() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as StatsPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load overview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <main className="animate-tf-fade relative z-1 mx-auto max-w-[1240px] px-4 py-8 pb-16 sm:px-5 sm:py-10 md:px-7">
      <h1 className="m-0 font-display text-[clamp(1.85rem,7vw,52px)] font-extrabold uppercase tracking-[-0.045em] tf-display-shadow">
        Overview
      </h1>
      <p className="mt-2.5 mb-6 text-[14px] text-[var(--ink2)] sm:mb-[26px] sm:text-[15px]">
        Live instance performance
        {data ? ` · ${data.toolCatalogSize} tools in catalogue` : ""}
        {loading ? " · refreshing…" : ""}
      </p>

      {error ? (
        <p className="mb-4 text-[13.5px] text-[var(--warn)]">{error}</p>
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:mb-[22px] lg:grid-cols-4 lg:gap-3.5">
        {(data?.stats ?? [
          { k: "JOBS · TRACKED", v: "—", note: "Loading" },
          { k: "QUEUE", v: "—", note: "Loading" },
          { k: "FAILURE RATE", v: "—", note: "Loading" },
          { k: "STORAGE", v: "—", note: "Loading" },
        ]).map((s) => (
          <div
            key={s.k}
            className="flex flex-col gap-1.5 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 sm:px-5 sm:py-[18px]"
          >
            <span className="font-mono text-[10px] tracking-wider text-[var(--muted)] sm:text-[10.5px]">
              {s.k}
            </span>
            <span className="font-display text-[28px] font-medium tracking-tight sm:text-[32px]">
              {s.v}
            </span>
            <span className="text-[12.5px] text-[var(--ink2)]">{s.note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-[22px] py-5">
          <div className="mb-[18px] text-[13px] font-semibold">
            Jobs per day (30d)
          </div>
          <div className="flex h-[150px] items-end gap-1.5">
            {(data?.chart ?? Array.from({ length: 30 }, () => ({ h: "4%", count: 0 }))).map(
              (b, i) => (
                <span
                  key={i}
                  className="block flex-1 rounded-t-[3px]"
                  title={`${b.count} jobs`}
                  style={{
                    height: b.h === "0%" ? "4%" : b.h,
                    background:
                      b.count > 0 && parseInt(b.h, 10) > 85
                        ? "var(--accent)"
                        : "var(--line2)",
                  }}
                />
              ),
            )}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10.5px] text-[var(--muted)]">
            <span>{data?.chartLabels.start ?? "—"}</span>
            <span>{data?.chartLabels.mid ?? "—"}</span>
            <span>{data?.chartLabels.end ?? "—"}</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-[22px] py-5">
          <div className="mb-4 text-[13px] font-semibold">Top tools</div>
          {data?.topTools?.length ? (
            <div className="flex flex-col gap-3">
              {data.topTools.map((u) => (
                <div key={u.slug} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span>{u.name}</span>
                    <span className="font-mono text-[12px] text-[var(--muted)]">
                      {u.count}
                    </span>
                  </div>
                  <div className="h-[5px] rounded-full bg-[var(--paper2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: u.w }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-[var(--ink2)]">
              No tool usage yet. Run a download or conversion and it will show
              up here.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
