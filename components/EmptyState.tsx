"use client";

const DEMO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

interface EmptyStateProps {
  onTryDemo: (url: string) => void;
}

export function EmptyState({ onTryDemo }: EmptyStateProps) {
  return (
    <div className="animate-fade-in-up mt-8 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg viewBox="0 0 24 24" className="size-7 fill-current">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold">Paste any YouTube link to get started</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Copy a video URL from YouTube, paste it above, and we&apos;ll fetch the
        preview automatically.
      </p>
      <button
        type="button"
        onClick={() => onTryDemo(DEMO_URL)}
        className="mt-5 cursor-pointer rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        Try example video
      </button>
    </div>
  );
}
