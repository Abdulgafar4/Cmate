"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/tf/BrandLogo";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
      aria-label="ToolFerry home"
    >
      <BrandLogo className="size-8 transition-transform duration-200 group-hover:scale-[1.04]" />
      {wordmark ? (
        <span className="font-display text-[17px] font-extrabold tracking-[-0.03em] text-[var(--ink)]">
          Tool
          <span className="text-[var(--accent)]">Ferry</span>
        </span>
      ) : null}
    </Link>
  );
}
