"use client";

import { formatTimestamp, parseTimestamp } from "@/lib/downloadOptions";

export interface DownloadOptionsFormValue {
  start?: string;
  end?: string;
  writeSubtitles: boolean;
  filenameTemplate: string;
}

interface DownloadOptionsPanelProps {
  duration: number;
  disabled?: boolean;
  value: DownloadOptionsFormValue;
  onChange: (next: DownloadOptionsFormValue) => void;
}

function timestampError(value: string | undefined, duration: number): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const seconds = parseTimestamp(value);
  if (seconds == null) {
    return "Use mm:ss or seconds.";
  }
  if (seconds > duration) {
    return `Must be within ${formatTimestamp(duration)}.`;
  }
}

export function DownloadOptionsPanel({
  duration,
  disabled,
  value,
  onChange,
}: DownloadOptionsPanelProps) {
  const startError = timestampError(value.start, duration);
  const endError = timestampError(value.end, duration);
  const startSeconds = parseTimestamp(value.start ?? "");
  const endSeconds = parseTimestamp(value.end ?? "");
  const rangeError =
    !startError &&
    !endError &&
    startSeconds != null &&
    endSeconds != null &&
    endSeconds <= startSeconds
      ? "End time must be after the start time."
      : undefined;

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="text-sm font-medium text-foreground">Download options</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Start time</span>
          <input
            value={value.start ?? ""}
            onChange={(event) => onChange({ ...value, start: event.target.value })}
            placeholder="0:00"
            inputMode="numeric"
            aria-invalid={Boolean(startError || rangeError)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">End time</span>
          <input
            value={value.end ?? ""}
            onChange={(event) => onChange({ ...value, end: event.target.value })}
            placeholder={formatTimestamp(duration)}
            inputMode="numeric"
            aria-invalid={Boolean(endError || rangeError)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
      </div>
      {(startError || endError || rangeError) && (
        <p className="text-sm text-destructive">{startError ?? endError ?? rangeError}</p>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-sm disabled:cursor-not-allowed">
        <input
          type="checkbox"
          checked={value.writeSubtitles}
          onChange={(event) =>
            onChange({ ...value, writeSubtitles: event.target.checked })
          }
          className="size-4 accent-primary"
        />
        Download subtitles (SRT)
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">Filename template</span>
        <input
          value={value.filenameTemplate}
          onChange={(event) =>
            onChange({ ...value, filenameTemplate: event.target.value })
          }
          placeholder="{title} - {channel}"
          maxLength={200}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="block text-xs text-muted-foreground">
          Available placeholders: {"{title}"}, {"{channel}"}, {"{id}"}
        </span>
      </label>
    </fieldset>
  );
}
