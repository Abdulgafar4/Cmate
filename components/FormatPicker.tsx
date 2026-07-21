"use client";

import { cn } from "@/lib/utils";
import { estimateFileSize } from "@/lib/formatEstimates";
import type { FormatOption } from "@/lib/formats";
import type { FormatPresetId } from "@/lib/validators";

interface FormatPickerProps {
  formats: FormatOption[];
  value: FormatPresetId;
  duration: number;
  disabled?: boolean;
  onChange: (value: FormatPresetId) => void;
}

export function FormatPicker({
  formats,
  value,
  duration,
  disabled,
  onChange,
}: FormatPickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Quality</p>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Video quality"
      >
        {formats.map((format) => {
          const selected = value === format.id;
          const size = estimateFileSize(format.id, duration);

          return (
            <button
              key={format.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(format.id)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-background hover:bg-muted",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium">{format.label}</span>
                {format.badge && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {format.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {format.description}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                {size}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
