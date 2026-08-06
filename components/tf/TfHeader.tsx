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
    match: (p: string) => p.startsWith("/admin"),
  },
  {
    href: "/history",
    label: "Job history",
    match: (p: string) => p.startsWith("/history"),
  },
] as const;

export function TfHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [gateRequired, setGateRequired] = useState(false);

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

  const overview = NAV[0];
  const history = NAV[1];
  const overviewActive = overview.match(pathname);
  const historyActive = history.match(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-[14px]">
      <div className="relative mx-auto grid h-[62px] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:px-7">
        <div className="justify-self-start">
          <BrandMark />
        </div>

        <div className="flex items-center justify-center gap-2">
          <nav className="flex items-center gap-1" aria-label="Main">
            <Link
              href={overview.href}
              aria-current={overviewActive ? "page" : undefined}
              className={cn(
                "hidden whitespace-nowrap rounded-full border px-[15px] py-[7px] text-[12.5px] font-semibold transition-all duration-[180ms] sm:inline-flex",
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
              className="flex h-[34px] w-[150px] items-center gap-2 rounded-[9px] border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px] text-[var(--muted)] transition-colors hover:border-[var(--ink2)] hover:text-[var(--ink2)] sm:w-[180px]"
            >
              <span className="block size-3 rounded-full border-[1.4px] border-current" />
              <span>Search tools</span>
              <span className="flex-1" />
              <kbd className="hidden rounded border border-[var(--line)] px-[5px] py-px font-mono text-[11px] sm:inline">
                /
              </kbd>
            </button>
            <Link
              href={history.href}
              aria-current={historyActive ? "page" : undefined}
              className={cn(
                "hidden whitespace-nowrap rounded-full border px-[15px] py-[7px] text-[12.5px] font-semibold transition-all duration-[180ms] sm:inline-flex",
                historyActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line2)] bg-transparent text-[var(--ink2)] hover:border-[var(--ink2)]",
              )}
            >
              {history.label}
            </Link>
          </nav>
        </div>

        <div className="flex items-center justify-self-end gap-2">
          <ThemeToggle />
          {gateRequired ? (
            <Link
              href="/unlock"
              className="flex h-[34px] items-center rounded-[9px] border border-[var(--ink)] bg-[var(--ink)] px-[15px] text-[13px] font-medium text-[var(--paper)]"
            >
              Unlock
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
