"use client";

import Link from "next/link";
import { useMemo, useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToolTile } from "@/components/tf/HomePage";
import { ToolCategoryIcon } from "@/components/tf/ToolCategoryIcon";
import {
  TOOLS,
  getTool,
  type Tool,
  type ToolCategory,
} from "@/lib/tools";
import { cn } from "@/lib/utils";

const RECENT_KEY = "tf-recent-tools";

const CATEGORIES: Array<{
  id: ToolCategory;
  blurb: string;
}> = [
  {
    id: "Downloaders",
    blurb:
      "Save video and audio from ten platforms — single links or batches of 25.",
  },
  {
    id: "Media",
    blurb:
      "Convert, compress, trim and rescale video, audio and images.",
  },
  {
    id: "PDF",
    blurb: "Merge, split, protect, watermark and turn pages into images.",
  },
  {
    id: "Documents",
    blurb: "Word, Markdown and plain text both directions into PDF.",
  },
  {
    id: "Utilities",
    blurb: "QR, hashes, Base64, JSON and metadata — the small daily stuff.",
  },
];

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return parsed.filter((s) => TOOLS.some((t) => t.slug === s)).slice(0, 4);
  } catch {
    return ["youtube", "pdf-merge", "image-convert", "video-convert"];
  }
}

function toolsForCategory(cat: ToolCategory, query: string): Tool[] {
  const q = query.trim().toLowerCase();
  return TOOLS.filter((t) => {
    if (t.cat !== cat) return false;
    if (!q) return true;
    return `${t.name} ${t.desc} ${t.cat} ${t.accepts}`
      .toLowerCase()
      .includes(q);
  });
}

export function ToolsHub() {
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<ToolCategory>>(() => new Set());
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
    if (params.get("focus") === "1") {
      inputRef.current?.focus();
    }
  }, [params]);

  // While searching, auto-open categories that have matches
  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    const next = new Set<ToolCategory>();
    for (const c of CATEGORIES) {
      if (toolsForCategory(c.id, query).length > 0) next.add(c.id);
    }
    setOpen(next);
  }, [q]);

  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        tools: toolsForCategory(c.id, q),
      })).filter((g) => g.tools.length > 0 || !q.trim()),
    [q],
  );

  const totalVisible = groups.reduce((n, g) => n + g.tools.length, 0);
  const showRecent = !q.trim() && recent.length > 0;

  function toggle(cat: ToolCategory) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function expandAll() {
    setOpen(new Set(CATEGORIES.map((c) => c.id)));
  }

  function collapseAll() {
    setOpen(new Set());
  }

  return (
    <main className="animate-tf-fade relative z-1 mx-auto max-w-[1240px] px-5 py-10 pb-20 md:px-7">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 font-display text-[clamp(2.2rem,4.4vw,52px)] font-extrabold uppercase tracking-[-0.045em] tf-display-shadow">
            Tools
          </h1>
          <p className="mt-2 text-[15px] text-[var(--ink2)]">
            {TOOLS.length} tools across {CATEGORIES.length} categories. Open a
            card to see what’s inside.
          </p>
        </div>
        <div className="flex h-12 items-center gap-2 rounded-[12px] border border-[var(--line2)] bg-[var(--surface)] px-3.5 tf-shadow sm:min-w-[320px]">
          <span className="block size-3 rounded-full border-[1.4px] border-[var(--muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${TOOLS.length} tools…`}
            className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--muted)]"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="border-0 bg-transparent text-[16px] leading-none text-[var(--muted)]"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {showRecent ? (
        <section className="mb-8">
          <div className="mb-3 font-mono text-[10.5px] tracking-wider text-[var(--muted)] uppercase">
            Recently used
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((slug, i) => {
              const tool = getTool(slug);
              if (!tool) return null;
              return (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  className="flex items-center justify-between rounded-[13px] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 transition-colors hover:border-[var(--line2)]"
                >
                  <span className="truncate text-[14px] font-semibold">
                    {tool.name}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {["2m ago", "1h ago", "yesterday", "3d ago"][i] ?? ""}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wider text-[var(--muted)] uppercase">
          {q.trim()
            ? `${totalVisible} match${totalVisible === 1 ? "" : "es"}`
            : "Categories"}
        </span>
        {!q.trim() ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-full border border-[var(--line2)] bg-[var(--surface)] px-3 py-1 text-[12.5px] text-[var(--ink2)] hover:border-[var(--ink2)]"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-full border border-[var(--line2)] bg-[var(--surface)] px-3 py-1 text-[12.5px] text-[var(--ink2)] hover:border-[var(--ink2)]"
            >
              Collapse all
            </button>
          </div>
        ) : null}
      </div>

      {totalVisible === 0 && q.trim() ? (
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-8 py-16 text-center tf-shadow">
          <div className="font-display text-[28px] font-extrabold tracking-tight">
            Nothing matched
          </div>
          <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-[var(--ink2)]">
            No tool matches “{q}”. Try a platform name, a format, or clear the
            search.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className="mt-5 h-10 rounded-full border border-[var(--line2)] px-4 text-[13.5px]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {groups.map((group) => {
            const isOpen = open.has(group.id);
            const count = group.tools.length;
            const fullCount = TOOLS.filter((t) => t.cat === group.id).length;

            return (
              <section
                key={group.id}
                className={cn(
                  "overflow-hidden rounded-[24px] border bg-[var(--surface)] transition-[border-color,box-shadow] duration-200 tf-shadow",
                  isOpen
                    ? "border-[var(--accent)]"
                    : "border-[var(--line)] hover:border-[var(--line2)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 px-5 py-5 text-left sm:items-center sm:px-6 sm:py-6"
                >
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-[14px] border transition-colors sm:size-14 sm:rounded-[16px]",
                      isOpen
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--accent)]",
                    )}
                  >
                    <ToolCategoryIcon cat={group.id} size={22} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[clamp(1.5rem,3vw,28px)] font-extrabold uppercase tracking-[-0.03em]">
                        {group.id}
                      </span>
                      <span className="font-mono text-[12px] text-[var(--muted)]">
                        {q.trim()
                          ? `${count} of ${fullCount}`
                          : `${fullCount} tools`}
                      </span>
                    </span>
                    <span className="mt-1 block max-w-[52ch] text-[14px] leading-relaxed text-[var(--ink2)]">
                      {group.blurb}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "mt-1 grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line2)] text-[var(--ink2)] transition-transform duration-200 sm:mt-0",
                      isOpen && "rotate-180 border-[var(--accent)] text-[var(--accent)]",
                    )}
                    aria-hidden
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.8,.3,1)]",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[var(--line)] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                      {count === 0 ? (
                        <p className="py-6 text-center text-[14px] text-[var(--muted)]">
                          No tools in this category match your search.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.tools.map((t, i) => (
                            <ToolTile
                              key={t.slug}
                              tool={t}
                              delayMs={isOpen ? (i % 12) * 26 : 0}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

export function rememberTool(slug: string) {
  try {
    const next = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
