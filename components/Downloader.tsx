"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { DownloadProgress } from "@/components/DownloadProgress";
import { EmptyState } from "@/components/EmptyState";
import { FormatPicker } from "@/components/FormatPicker";
import { RecentDownloads } from "@/components/RecentDownloads";
import { StepIndicator } from "@/components/StepIndicator";
import { UrlForm } from "@/components/UrlForm";
import { VideoPreview } from "@/components/VideoPreview";
import { VideoPreviewSkeleton } from "@/components/VideoPreviewSkeleton";
import { friendlyErrorMessage } from "@/lib/errorMessages";
import type { FormatOption } from "@/lib/formats";
import {
  addRecentDownload,
  clearRecentDownloads,
  getRecentDownloads,
  type RecentDownload,
} from "@/lib/recentDownloads";
import { getActiveStep } from "@/lib/steps";
import { isValidYouTubeUrl } from "@/lib/validators";
import type { FormatPresetId } from "@/lib/validators";

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  url: string;
  formats: FormatOption[];
}

type JobStatus = "queued" | "downloading" | "done" | "error";

const RECENT_CHANGE_EVENT = "yc-downloader-recent-change";

function subscribeRecentDownloads(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RECENT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RECENT_CHANGE_EVENT, onStoreChange);
  };
}

function notifyRecentChange() {
  window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
}

function getRecentSnapshotString(): string {
  return JSON.stringify(getRecentDownloads());
}

export function Downloader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [formatId, setFormatId] = useState<FormatPresetId>("720p");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number | undefined>();
  const [totalBytes, setTotalBytes] = useState<number | undefined>();
  const [speedBps, setSpeedBps] = useState<number | undefined>();
  const [etaSeconds, setEtaSeconds] = useState<number | undefined>();
  const [jobError, setJobError] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const recentRaw = useSyncExternalStore(
    subscribeRecentDownloads,
    getRecentSnapshotString,
    () => "[]",
  );
  const recentItems = useMemo(
    () => JSON.parse(recentRaw) as RecentDownload[],
    [recentRaw],
  );
  const savedToRecentRef = useRef<string | null>(null);

  const resetDownloadState = useCallback(() => {
    setJobId(null);
    setJobStatus(null);
    setProgress(0);
    setDownloadedBytes(undefined);
    setTotalBytes(undefined);
    setSpeedBps(undefined);
    setEtaSeconds(undefined);
    setJobError(undefined);
    setFileName(undefined);
    setDownloadLoading(false);
    savedToRecentRef.current = null;
  }, []);

  const fetchInfo = useCallback(
    async (targetUrl?: string) => {
      const nextUrl = (targetUrl ?? url).trim();
      if (!nextUrl) {
        return;
      }

      if (!isValidYouTubeUrl(nextUrl)) {
        setError(friendlyErrorMessage("Only YouTube URLs are allowed"));
        return;
      }

      setUrl(nextUrl);
      setFetchLoading(true);
      setError(null);
      resetDownloadState();
      setInfo(null);

      try {
        const response = await fetch("/api/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: nextUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch video info");
        }

        setInfo(data);
        setFormatId("720p");
      } catch (fetchError) {
        const raw =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch video info";
        setError(friendlyErrorMessage(raw));
      } finally {
        setFetchLoading(false);
      }
    },
    [url, resetDownloadState],
  );

  const handlePasteUrl = useCallback(
    (pastedUrl: string) => {
      void fetchInfo(pastedUrl);
    },
    [fetchInfo],
  );

  const handleTryDemo = useCallback(
    (demoUrl: string) => {
      setUrl(demoUrl);
      void fetchInfo(demoUrl);
    },
    [fetchInfo],
  );

  const handleRecentSelect = useCallback(
    (recentUrl: string) => {
      setUrl(recentUrl);
      void fetchInfo(recentUrl);
    },
    [fetchInfo],
  );

  const startDownload = useCallback(async () => {
    if (!info) {
      return;
    }

    setDownloadLoading(true);
    setError(null);
    resetDownloadState();

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: info.url,
          formatId,
          title: info.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start download");
      }

      setJobId(data.jobId);
      setJobStatus("queued");
      setProgress(0);
    } catch (downloadError) {
      const raw =
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to start download";
      setError(friendlyErrorMessage(raw));
      setDownloadLoading(false);
    }
  }, [info, formatId, resetDownloadState]);

  useEffect(() => {
    if (!jobId || jobStatus === "done" || jobStatus === "error") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch job status");
        }

        setJobStatus(data.status);
        setProgress(data.progress ?? 0);
        setDownloadedBytes(data.downloadedBytes);
        setTotalBytes(data.totalBytes);
        setSpeedBps(data.speedBps);
        setEtaSeconds(data.etaSeconds);
        setJobError(
          data.error ? friendlyErrorMessage(data.error) : undefined,
        );
        setFileName(data.fileName);

        if (data.status === "done" || data.status === "error") {
          setDownloadLoading(false);
        }
      } catch (pollError) {
        if (cancelled) {
          return;
        }
        setJobStatus("error");
        setJobError(
          friendlyErrorMessage(
            pollError instanceof Error
              ? pollError.message
              : "Failed to poll job status",
          ),
        );
        setDownloadLoading(false);
      }
    };

    void poll();
    const interval = setInterval(poll, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, jobStatus]);

  useEffect(() => {
    if (jobStatus !== "done" || !info || !jobId) {
      return;
    }
    if (savedToRecentRef.current === jobId) {
      return;
    }

    savedToRecentRef.current = jobId;
    addRecentDownload({
      id: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      url: info.url,
      downloadedAt: Date.now(),
    });
    notifyRecentChange();
  }, [jobStatus, info, jobId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaK =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k";
      if (isMetaK) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      if (event.key === "Escape" && error) {
        setError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [error]);

  const activeStep = getActiveStep({
    hasInfo: Boolean(info),
    hasJob: Boolean(jobId),
    jobDone: jobStatus === "done",
  });

  const showEmptyState = !info && !fetchLoading && !url.trim();

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Save videos locally
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a link, pick a quality, and download to your device.
        </p>
      </div>

      <StepIndicator activeStep={activeStep} />

      <section className="yt-panel p-6 sm:p-8">
        <UrlForm
          url={url}
          loading={fetchLoading}
          onUrlChange={setUrl}
          onSubmit={() => void fetchInfo()}
          onPasteUrl={handlePasteUrl}
          inputRef={inputRef}
        />

        {error && (
          <div
            className="animate-fade-in-up mt-5 rounded-xl border border-destructive/20 bg-accent px-4 py-3 text-sm text-destructive"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {fetchLoading && (
          <div className="mt-8">
            <VideoPreviewSkeleton />
          </div>
        )}

        {info && !fetchLoading && (
          <div className="animate-fade-in-up mt-8 space-y-6">
            <VideoPreview
              title={info.title}
              thumbnail={info.thumbnail}
              duration={info.duration}
            />

            <FormatPicker
              formats={info.formats}
              value={formatId}
              duration={info.duration}
              disabled={downloadLoading}
              onChange={setFormatId}
            />

            {!jobId && (
              <button
                type="button"
                onClick={startDownload}
                disabled={downloadLoading}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Download className="size-4" />
                {downloadLoading ? "Starting..." : "Download"}
              </button>
            )}
          </div>
        )}

        {jobId && jobStatus && (
          <div className="mt-8">
            <DownloadProgress
              status={jobStatus}
              progress={progress}
              downloadedBytes={downloadedBytes}
              totalBytes={totalBytes}
              speedBps={speedBps}
              etaSeconds={etaSeconds}
              error={jobError}
              fileName={fileName}
              jobId={jobId}
              onReset={resetDownloadState}
            />
          </div>
        )}

        {showEmptyState && <EmptyState onTryDemo={handleTryDemo} />}
      </section>

      <RecentDownloads
        items={recentItems}
        onSelect={handleRecentSelect}
        onClear={() => {
          clearRecentDownloads();
          notifyRecentChange();
        }}
      />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        For personal use only. Respect YouTube&apos;s Terms of Service.
      </p>
    </div>
  );
}
