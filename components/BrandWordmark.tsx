import { BrandLogo } from "@/components/tf/BrandLogo";
import { cn } from "@/lib/utils";

const SIZE_STYLES = {
  sm: "text-base gap-1.5",
  md: "text-lg gap-2",
  lg: "text-2xl gap-2.5",
} as const;

const LOGO_SIZE = {
  sm: "size-6",
  md: "size-7",
  lg: "size-9",
} as const;

interface BrandWordmarkProps {
  className?: string;
  size?: keyof typeof SIZE_STYLES;
}

/** Legacy wordmark — prefers ToolFerry mark used by the hub UI. */
export function BrandWordmark({ className, size = "md" }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-display font-extrabold tracking-tight text-[var(--ink)]",
        SIZE_STYLES[size],
        className,
      )}
      aria-label="ToolFerry"
    >
      <BrandLogo className={LOGO_SIZE[size]} />
      <span>
        Tool<span className="text-[var(--accent)]">Ferry</span>
      </span>
    </span>
  );
}
