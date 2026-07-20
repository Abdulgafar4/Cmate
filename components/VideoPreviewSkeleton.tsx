export function VideoPreviewSkeleton() {
  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card"
      aria-busy="true"
      aria-label="Loading video preview"
    >
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
