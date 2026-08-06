"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandMark } from "@/components/tf/BrandMark";
import { ToolCategoryIcon } from "@/components/tf/ToolCategoryIcon";
import {
  FEATURED_SLUGS,
  TOOLS,
  countByCategory,
  getTool,
  type Tool,
} from "@/lib/tools";
import { cn } from "@/lib/utils";

function ToolTile({
  tool,
  delayMs = 0,
  compact = false,
}: {
  tool: Tool;
  delayMs?: number;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group animate-tf-rise flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-[18px] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--line2)] tf-shadow",
        compact && "flex-row items-center gap-[13px] rounded-[13px] p-3.5",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <ToolCategoryIcon cat={tool.cat} />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight">
            {tool.name}
          </span>
          {tool.binary ? (
            <span className="hidden shrink-0 rounded-[5px] border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-[var(--muted)] sm:inline">
              NEEDS BINARY
            </span>
          ) : null}
        </span>
        <span className="line-clamp-2 text-[13.5px] leading-snug text-[var(--ink2)]">
          {tool.desc}
        </span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const featured = FEATURED_SLUGS.map((s) => getTool(s)!).filter(Boolean);
  const blurbs = [
    {
      name: "Downloaders",
      count: `${String(countByCategory("Downloaders")).padStart(2, "0")} tools`,
      blurb:
        "Save video and audio from ten platforms, single links or batches of 25.",
    },
    {
      name: "Media",
      count: `${String(countByCategory("Media")).padStart(2, "0")} tools`,
      blurb: "Convert, compress, trim and rescale video, audio and images.",
    },
    {
      name: "PDF & docs",
      count: `${String(countByCategory("PDF") + countByCategory("Documents")).padStart(2, "0")} tools`,
      blurb: "Merge, split, protect and convert documents both directions.",
    },
    {
      name: "Utilities",
      count: `${String(countByCategory("Utilities")).padStart(2, "0")} tools`,
      blurb:
        "QR, hashes, Base64, JSON and metadata — the small daily stuff.",
    },
  ];

  const footerCols = [
    { title: "Product", links: [
      { label: "Tools", href: "/tools" },
      { label: "Job history", href: "/history" },
      { label: "Overview", href: "/admin" },
    ]},
    { title: "Popular", links: [
      { label: "YouTube Downloader", href: "/tools/youtube" },
      { label: "Video Convert", href: "/tools/video-convert" },
      { label: "Merge PDF", href: "/tools/pdf-merge" },
      { label: "Image Convert", href: "/tools/image-convert" },
    ]},
    { title: "Legal", links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Acceptable use", href: "#" },
      { label: "DMCA", href: "#" },
    ]},
    { title: "Instance", links: [
      { label: "Status", href: "/api/health" },
      { label: "Overview", href: "/admin" },
    ]},
  ];

  return (
    <main className="animate-tf-fade relative z-1">
      <section className="relative z-5 px-6 pb-[60px] pt-24 sm:pt-28 md:pt-32">
        <div className="relative mx-auto flex w-full max-w-[1120px] flex-col items-center text-center">
          <div className="relative z-10 flex w-full flex-col items-center gap-1.5">
            <div className="relative z-30 flex w-full justify-start pl-[8%] sm:pl-[22%]">
              <h1 className="animate-tf-rise m-0 font-display text-[clamp(2.4rem,8.6vw,124px)] font-extrabold uppercase leading-[0.84] tracking-[-0.05em] text-[var(--accent)] tf-display-shadow-accent">
                {TOOLS.length} tools
              </h1>
            </div>
            <div className="relative z-20 flex w-full justify-center">
              <h1
                className="animate-tf-rise m-0 font-display text-[clamp(2.8rem,11.4vw,168px)] font-extrabold uppercase leading-[0.84] tracking-[-0.05em] text-[var(--ink)] tf-display-shadow"
                style={{ animationDelay: "60ms" }}
              >
                Toolferry
              </h1>
            </div>
            <div className="relative z-10 flex w-full justify-start pl-[12%] sm:pl-[28%]">
              <h1
                className="animate-tf-rise m-0 font-display text-[clamp(2.4rem,8.6vw,124px)] font-extrabold uppercase leading-[0.84] tracking-[-0.05em] text-[var(--ink)] tf-display-shadow"
                style={{ animationDelay: "120ms" }}
              >
                One shell
              </h1>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 -inset-y-5 hidden lg:block">
            <div className="animate-tf-float pointer-events-auto absolute bottom-[-12%] left-0 z-30">
              <div className="w-[206px] -rotate-10 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-[18px] text-left transition-transform duration-500 tf-shadow hover:rotate-0">
                <div className="mb-3.5 flex items-center gap-[11px]">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <ToolCategoryIcon cat="Downloaders" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13.5px] font-semibold">
                      workspace-walkthrough
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--muted)]">
                      MP4 · 1080p
                    </span>
                  </span>
                </div>
                <div className="h-[5px] rounded-full bg-[var(--paper2)]">
                  <div className="h-full w-[72%] rounded-full bg-[var(--accent)]" />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10.5px] text-[var(--muted)]">
                  <span>DOWNLOADING</span>
                  <span className="text-[var(--accent)]">72%</span>
                </div>
              </div>
            </div>

            <div className="animate-tf-float2 pointer-events-auto absolute top-[-10%] right-0 z-30">
              <div className="w-[206px] rotate-10 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-[18px] text-left transition-transform duration-500 tf-shadow hover:rotate-0">
                <div className="mb-3.5 flex items-center gap-[11px]">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <ToolCategoryIcon cat="PDF" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13.5px] font-semibold">
                      proposal-merged.pdf
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--muted)]">
                      3 files · 24 pages
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-[9px]">
                  <span className="grid size-[22px] place-items-center rounded-full bg-[var(--ok)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
                      <polyline points="5 12 10 17 19 7" />
                    </svg>
                  </span>
                  <span className="text-[12.5px] text-[var(--ink2)]">Done in 4.1s</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[-6%] left-[26%] z-20 size-24 text-[var(--accent)]">
              <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
                <path d="M80,55 L95,70 L85,85" />
              </svg>
            </div>
            <div className="absolute top-[-2%] right-[22%] z-20 size-24 text-[var(--accent)]">
              <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
                <path d="M65,75 L50,80 L55,65" />
              </svg>
            </div>

            <div className="pointer-events-auto absolute right-[6%] bottom-[-26%] z-40">
              <Link
                href="/tools"
                className="relative grid size-[136px] place-items-center rounded-full bg-[var(--ink)] rotate-10 transition-transform duration-300 tf-shadow hover:scale-105"
                aria-label="Open the toolbox"
              >
                <span className="animate-tf-spin absolute inset-1.5 block">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <path
                      id="tfCirclePath"
                      d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                      fill="none"
                    />
                    <text
                      className="fill-[var(--paper)] font-mono text-[9px] tracking-[0.22em]"
                    >
                      <textPath href="#tfCirclePath" startOffset="0%">
                        OPEN THE TOOLBOX • NO ACCOUNT •{" "}
                      </textPath>
                    </text>
                  </svg>
                </span>
                <span className="absolute inset-0 grid place-items-center text-[var(--accent)]">
                  <svg viewBox="0 0 100 100" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20,80 Q 40,50 30,30 T 80,20" />
                    <path d="M60,10 L80,20 L70,40" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div
          className="animate-tf-rise relative z-15 mt-[100px] flex flex-col items-center gap-5 sm:mt-[132px]"
          style={{ animationDelay: "200ms" }}
        >
          <p className="m-0 max-w-[44ch] text-pretty text-center text-[19px] leading-[1.45] text-[var(--ink2)]">
            Downloaders, converters, PDF and document utilities — every tool in
            the same calm shell. Nothing to install, nothing kept.
          </p>
          <Link
            href="/tools"
            className="flex h-[50px] items-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-[26px] text-[15px] font-medium text-[var(--paper)] transition-transform active:scale-[0.975]"
          >
            Browse tools
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pt-[72px] md:px-7 md:pt-[88px]">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] md:gap-14">
          <h2 className="m-0 font-display text-[34px] font-extrabold uppercase leading-[1.02] tracking-[-0.035em]">
            What you can do
          </h2>
          <div className="grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-7 sm:grid-cols-4 sm:gap-7">
            {blurbs.map((c) => (
              <div key={c.name} className="flex flex-col gap-2.5">
                <div className="font-mono text-[11px] text-[var(--muted)]">
                  {c.count}
                </div>
                <div className="text-[17px] font-semibold tracking-tight">
                  {c.name}
                </div>
                <div className="text-pretty text-[14px] leading-relaxed text-[var(--ink2)]">
                  {c.blurb}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pt-16 pb-4 md:px-7 md:pt-20">
        <div className="mb-[26px] flex items-baseline justify-between border-b border-[var(--line)] pb-3.5">
          <h2 className="m-0 font-display text-[26px] font-extrabold uppercase tracking-[-0.03em]">
            Featured tools
          </h2>
          <Link href="/tools" className="text-[14px] text-[var(--accent)]">
            All {TOOLS.length} tools →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t, i) => (
            <ToolTile key={t.slug} tool={t} delayMs={i * 40} />
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-20 max-w-[1240px] border-t border-[var(--line)] px-5 py-12 md:px-7">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[var(--ink2)]">
              A calm toolbox for downloads, conversions and documents. Self-hosted.
              Files expire.
            </p>
          </div>
          <p className="font-mono text-[11px] text-[var(--muted)]">
            {TOOLS.length} tools · one shell
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerCols.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <div className="font-mono text-[10.5px] tracking-wider text-[var(--muted)] uppercase">
                {col.title}
              </div>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-[13.5px] text-[var(--ink2)] hover:text-[var(--ink)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}

export function SlashFocus() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        window.location.href = "/tools?focus=1";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

export { ToolTile };
