"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/tf/BrandLogo";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  wordmark = true,
  compact = false,
}: {
  className?: string;
  wordmark?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 transition-opacity hover:opacity-90 sm:gap-2.5",
        className,
      )}
      aria-label="ToolFerry home"
    >
      <BrandLogo
        className={cn(
          "transition-transform duration-200 group-hover:scale-[1.04]",
          compact ? "size-7 sm:size-8" : "size-8",
        )}
      />
      {wordmark ? (
        <span
          className={cn(
            "font-display font-extrabold tracking-[-0.03em] text-[var(--ink)]",
            compact
              ? "hidden text-[15px] min-[360px]:inline sm:text-[17px]"
              : "text-[17px]",
          )}
        >
          Tool
          <span className="text-[var(--accent)]">Ferry</span>
        </span>
      ) : null}
    </Link>
  );
}
