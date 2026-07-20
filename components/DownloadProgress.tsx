"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  formatDownloaded,
  formatEta,
  formatSpeed,
} from "@/lib/progressFormat";
import { saveFileFromUrl } from "@/lib/saveFile";

interface DownloadProgressProps {
  status: "queued" | "downloading" | "done" | "error";
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBps?: number;
  etaSeconds?: number;
  error?: string;
  fileName?: string;
  jobId?: string;
  onReset?: () => void;
}

function statusMeta(status: DownloadProgressProps["status"]) {
  switch (status) {
    case "queued":
      return {
        label: "Preparing download",
        icon: Loader2,
        spin: true,
        tone: "text-muted-foreground",
      };
    case "downloading":
      return {
        label: "Downloading",
        icon: Download,
        spin: false,
        tone: "text-primary",
      };
    case "done":
      return {
        label: "Ready to save",
        icon: CheckCircle2,
        spin: false,
        tone: "text-primary",
      };
    case "error":
      return {
        label: "Download failed",
        icon: XCircle,
        spin: false,
        tone: "text-destructive",
      };
  }
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

export function DownloadProgress({
  status,
  progress,
  downloadedBytes,
  totalBytes,
  speedBps,
  etaSeconds,
  error,
  fileName,
  jobId,
  onReset,
}: DownloadProgressProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const meta = statusMeta(status);
  const Icon = meta.icon;
  const showStats = status === "queued" || status === "downloading";

  const handleSave = async () => {
    if (!jobId || saving) {
      return;
    }

    setSaving(true);
    setSaveError(undefined);

    try {
      await saveFileFromUrl(
        `/api/files/${jobId}`,
        fileName ?? "download.mp4",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setSaveError(
        error instanceof Error ? error.message : "Failed to save file",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-background p-5"
      role="status"
      aria-live="polite"
      aria-busy={status === "queued" || status === "downloading"}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`mt-0.5 flex size-10 items-center justify-center rounded-full bg-muted ${meta.tone}`}
        >
          <Icon className={meta.spin ? "size-5 animate-spin" : "size-5"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium">{meta.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {status === "error"
              ? error
              : status === "done"
                ? "Your file is ready. Tap below to save it to your device."
                : "Download is running in the background."}
          </p>
        </div>
        {status !== "error" && status !== "done" && (
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {status !== "error" && status !== "done" && (
        <Progress
          value={progress}
          className="mb-3 [&_[data-slot=progress-indicator]]:bg-primary"
          aria-label="Download progress"
        />
      )}

      {showStats && (
        <div className="grid grid-cols-3 gap-2">
          <StatCell
            label="Downloaded"
            value={formatDownloaded(downloadedBytes, totalBytes)}
          />
          <StatCell label="Speed" value={formatSpeed(speedBps)} />
          <StatCell label="ETA" value={formatEta(etaSeconds)} />
        </div>
      )}

      {status === "done" && jobId && (
        <div className="mt-5 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {saving ? "Saving…" : "Save to Device"}
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <RotateCcw className="size-4" />
                Download Another
              </button>
            )}
          </div>
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
        </div>
      )}

      {status === "error" && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RotateCcw className="size-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
