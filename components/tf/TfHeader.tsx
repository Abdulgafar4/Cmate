"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/tf/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/admin",
    label: "Overview",
    short: "Overview",
    match: (p: string) => p.startsWith("/admin"),
  },
  {
    href: "/history",
    label: "Job history",
    short: "History",
    match: (p: string) => p.startsWith("/history"),
  },
] as const;

export function TfHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [gateRequired, setGateRequired] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { required?: boolean; unlocked?: boolean }) => {
        if (!cancelled) {
          setGateRequired(Boolean(data.required && !data.unlocked));
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const overview = NAV[0];
  const history = NAV[1];
  const overviewActive = overview.match(pathname);
  const historyActive = history.match(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-[14px]">
      <div className="relative mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-4 sm:h-[62px] sm:gap-3 sm:px-5 md:px-7">
        <div className="min-w-0 shrink-0">
          <BrandMark compact />
        </div>

        <div className="mx-auto flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2">
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <Link
              href={overview.href}
              aria-current={overviewActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-[12.5px] font-semibold transition-all duration-[180ms]",
                overviewActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line2)] bg-transparent text-[var(--ink2)] hover:border-[var(--ink2)]",
              )}
            >
              {overview.label}
            </Link>
            <button
              type="button"
              onClick={() => router.push("/tools?focus=1")}
              className="flex h-11 w-[min(180px,40vw)] items-center gap-2 rounded-[9px] border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px] text-[var(--muted)] transition-colors hover:border-[var(--ink2)] hover:text-[var(--ink2)]"
            >
              <span className="block size-3 rounded-full border-[1.4px] border-current" />
              <span className="truncate">Search tools</span>
              <span className="flex-1" />
              <kbd className="hidden rounded border border-[var(--line)] px-[5px] py-px font-mono text-[11px] md:inline">
                /
              </kbd>
            </button>
            <Link
              href={history.href}
              aria-current={historyActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-[12.5px] font-semibold transition-all duration-[180ms]",
                historyActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line2)] bg-transparent text-[var(--ink2)] hover:border-[var(--ink2)]",
              )}
            >
              {history.label}
            </Link>
          </nav>

          {/* Compact mobile search */}
          <button
            type="button"
            onClick={() => router.push("/tools?focus=1")}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[9px] border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px] text-[var(--muted)] sm:hidden"
            aria-label="Search tools"
          >
            <span className="block size-3 shrink-0 rounded-full border-[1.4px] border-current" />
            <span className="truncate">Search tools</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {gateRequired ? (
            <Link
              href="/unlock"
              className="flex h-11 items-center rounded-[9px] border border-[var(--ink)] bg-[var(--ink)] px-3.5 text-[13px] font-medium text-[var(--paper)] sm:px-[15px]"
            >
              Unlock
            </Link>
          ) : null}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-[9px] border border-[var(--line2)] bg-[var(--surface)] text-[var(--ink)] sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="tf-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M4 12h16" strokeLinecap="round" />
                  <path d="M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="tf-mobile-nav"
          className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:hidden"
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center rounded-[12px] border px-4 text-[14px] font-semibold",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--line2)] text-[var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/tools"
              className="flex min-h-12 items-center rounded-[12px] border border-[var(--line2)] px-4 text-[14px] font-semibold text-[var(--ink)]"
            >
              All tools
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
