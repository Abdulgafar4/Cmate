import { cn } from "@/lib/utils";

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("fill-current", className)}
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

const SIZE_STYLES = {
  sm: {
    text: "text-sm",
    play: "size-2.5",
    gap: "gap-px",
    nudge: "-mx-px",
  },
  md: {
    text: "text-sm sm:text-base",
    play: "size-3",
    gap: "gap-0.5",
    nudge: "-mx-0.5",
  },
  lg: {
    text: "text-3xl sm:text-4xl",
    play: "size-5 sm:size-6",
    gap: "gap-1",
    nudge: "-mx-0.5",
  },
} as const;

interface BrandWordmarkProps {
  className?: string;
  size?: keyof typeof SIZE_STYLES;
}

export function BrandWordmark({ className, size = "md" }: BrandWordmarkProps) {
  const styles = SIZE_STYLES[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-tight",
        styles.text,
        styles.gap,
        className,
      )}
      aria-label="YC Downloader"
    >
      <span className="text-primary">YC</span>
      <span
        className={cn(
          "inline-flex items-center justify-center text-primary",
          styles.nudge,
        )}
        aria-hidden="true"
      >
        <PlayGlyph className={styles.play} />
      </span>
      <span>Downloader</span>
    </span>
  );
}
