"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import { Downloader } from "@/components/Downloader";
import { ToolCategoryIcon } from "@/components/tf/ToolCategoryIcon";
import { rememberTool } from "@/components/tf/ToolsHub";
import { FORMAT_OPTIONS } from "@/lib/formats";
import { detectPlatform, SOCIAL_PLATFORMS } from "@/lib/platforms";
import type { Tool } from "@/lib/tools";
import type { FormatPresetId } from "@/lib/validators";
import { cn } from "@/lib/utils";

type UiJob = "idle" | "running" | "done" | "error";

type VideoInfoLite = {
  title?: string;
  url?: string;
  type?: string;
  duration?: number;
  thumbnail?: string;
  channel?: string;
  entries?: Array<{
    title?: string;
    thumbnail?: string;
    duration?: number;
  }>;
};

function formatDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

type ToolJobPoll = {
  status: string;
  progress?: number;
  fileName?: string | null;
  shareToken?: string | null;
  resultText?: string | null;
  error?: string | null;
};

type DlJobPoll = {
  status: string;
  progress?: number;
  fileName?: string | null;
  videoTitle?: string | null;
  error?: string | null;
};

const URL_SLUGS = new Set([
  "social",
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "reddit",
  "vimeo",
  "twitch",
  "soundcloud",
]);

const POLL_MS = 500;

function pill(on: boolean) {
  return on
    ? {
        bd: "var(--accent)",
        bg: "var(--accent-soft)",
        fg: "var(--accent)",
      }
    : {
        bd: "var(--line2)",
        bg: "var(--surface)",
        fg: "var(--ink2)",
      };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function mapToFormatId(value: string): FormatPresetId {
  const v = value.toLowerCase();
  if (/\b1080p?\b/.test(v)) return "1080p";
  if (/\b720p?\b/.test(v) || /\b360p?\b/.test(v)) return "720p";
  if (/\bopus\b/.test(v)) return "opus";
  if (/\bmp3\b/.test(v)) return "mp3";
  if (/\bm4a\b/.test(v) || /\baudio\b/.test(v)) return "audio";
  if (/\bbest\b/.test(v) || /\boriginal\b/.test(v)) return "best";
  return "best";
}

function acceptFromTool(tool: Tool): string | undefined {
  const raw = tool.accepts?.trim();
  if (!raw || raw === "URL" || raw === "TEXT · ANY FILE" || raw === "TEXT") {
    return undefined;
  }
  if (raw === "ANY FILE") return undefined;
  return raw
    .split(/[·,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`))
    .join(",");
}

function defaultOpts(
  rows: Array<{ label: string; choices: string[] }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.choices[0]) out[row.label] = row.choices[0];
  }
  return out;
}

function formatIdFromOpts(
  opt: Record<string, string>,
  fallback: FormatPresetId,
): FormatPresetId {
  for (const key of ["Quality", "Output", "Format", "Source"]) {
    if (opt[key]) return mapToFormatId(opt[key]);
  }
  const first = Object.values(opt)[0];
  return first ? mapToFormatId(first) : fallback;
}

function ChoiceRow({
  label,
  hint,
  choices,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  choices: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-semibold">{label}</span>
        {hint ? (
          <span className="text-[12px] text-[var(--muted)]">{hint}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const on = value === c;
          const p = pill(on);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="rounded-full border px-3.5 py-2.5 text-[13px] font-medium transition-colors sm:py-1.5 sm:text-[12.5px]"
              style={{ borderColor: p.bd, background: p.bg, color: p.fg }}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ToolWorkspace({ tool }: { tool: Tool }) {
  const isYT = tool.slug === "youtube";
  const isUrlTool = !isYT && (tool.input === "url" || URL_SLUGS.has(tool.slug));
  const isSocial = tool.slug === "social";
  const isQR = tool.slug === "qr";
  const isUpload = tool.input === "upload";
  const isText = tool.input === "text" || isQR;

  const [url, setUrl] = useState("");
  const [formatId, setFormatId] = useState<FormatPresetId>(
    isSocial ? "1080p" : "best",
  );
  const [videoInfo, setVideoInfo] = useState<VideoInfoLite | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [textInput, setTextInput] = useState(
    isQR ? "https://toolferry.app/s/9xQ2" : "",
  );
  const [qrTab, setQrTab] = useState<"Generate" | "Decode">("Generate");
  const [opt, setOpt] = useState<Record<string, string>>({});
  const [job, setJob] = useState<UiJob>("idle");
  const [pct, setPct] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const optionRows = useMemo(() => {
    const extra: Array<{ label: string; hint: string; choices: string[] }> = [];
    if (tool.slug === "video-convert") {
      extra.push(
        {
          label: "Target format",
          hint: "MOV, MKV, WebM and AVI all land as MP4",
          choices: ["MP4 (H.264)", "MP4 (H.265)", "WebM (VP9)", "MKV (copy)"],
        },
        {
          label: "Quality preset",
          hint: "Two-pass where it helps",
          choices: ["Visually lossless", "High", "Balanced", "Small file"],
        },
        {
          label: "Audio",
          hint: "",
          choices: ["Copy", "AAC 192", "Remove"],
        },
      );
    }
    if (tool.slug === "image-convert") {
      extra.push(
        {
          label: "Target format",
          hint: "Transparency preserved for PNG, WebP, AVIF",
          choices: ["WebP", "AVIF", "PNG", "JPG"],
        },
        {
          label: "Quality",
          hint: "AVIF at 60 ≈ JPG at 85",
          choices: ["Lossless", "90", "75", "60"],
        },
        {
          label: "Metadata",
          hint: "",
          choices: ["Strip all", "Keep EXIF", "Keep copyright"],
        },
      );
    }
    if (tool.slug === "pdf-merge") {
      extra.push(
        {
          label: "Bookmarks",
          hint: "One top-level entry per source file",
          choices: ["From filenames", "From first heading", "None"],
        },
        {
          label: "Page size",
          hint: "",
          choices: ["Keep original", "Normalise to A4", "Normalise to Letter"],
        },
      );
    }
    const fromTool = (isYT || isUrlTool ? [] : tool.opts).map((o) => ({
      label: o[0],
      hint: "",
      choices: o.slice(1),
    }));
    // URL tools still surface their opts (quality etc.) except social which has its own format list
    const urlOpts =
      isUrlTool && !isSocial
        ? tool.opts.map((o) => ({
            label: o[0],
            hint: "",
            choices: o.slice(1),
          }))
        : [];
    return [...extra, ...fromTool, ...urlOpts];
  }, [tool, isYT, isUrlTool, isSocial]);

  useEffect(() => {
    rememberTool(tool.slug);
  }, [tool.slug]);

  useEffect(() => {
    const base = defaultOpts(optionRows);
    if (isQR && !base["Error correction"]) {
      base["Error correction"] = "M";
    }
    setOpt(base);
  }, [optionRows, isQR]);

  useEffect(() => {
    if (!files[0]) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  useEffect(() => {
    if (!isQR || qrTab !== "Generate") {
      setQrPreview(null);
      return;
    }
    const text = textInput.trim();
    if (!text) {
      setQrPreview(null);
      return;
    }
    let cancelled = false;
    void import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(text, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: (
            (opt["Error correction"] || "M").charAt(0) || "M"
          ).toUpperCase() as "L" | "M" | "Q" | "H",
        }),
      )
      .then((dataUrl) => {
        if (!cancelled) setQrPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isQR, qrTab, textInput, opt]);

  const clearPoll = useCallback(() => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const resetJobUi = useCallback(() => {
    clearPoll();
    setJob("idle");
    setPct(0);
    setJobId(null);
    setResultText(null);
    setResultName(null);
  }, [clearPoll]);

  const applyTerminal = useCallback(
    (status: string, data: { error?: string | null; resultText?: string | null; fileName?: string | null; progress?: number }) => {
      if (status === "done") {
        clearPoll();
        setPct(100);
        setJob("done");
        setResultText(data.resultText ?? null);
        setResultName(data.fileName ?? null);
        return;
      }
      if (status === "error" || status === "cancelled") {
        clearPoll();
        setJob(status === "cancelled" ? "idle" : "error");
        setPct(0);
        if (status === "error") {
          setError(data.error || "Job failed");
        }
        setJobId(null);
      }
    },
    [clearPoll],
  );

  const startPolling = useCallback(
    (id: string, kind: "download" | "tool") => {
      clearPoll();
      setJob("running");
      setPct(0);
      setJobId(id);
      setError(null);
      setResultText(null);

      const tick = async () => {
        try {
          const endpoint =
            kind === "download" ? `/api/jobs/${id}` : `/api/tools/jobs/${id}`;
          const res = await fetch(endpoint);
          const data = (await res.json()) as (DlJobPoll | ToolJobPoll) & {
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error || "Failed to poll job");
          }
          const progress =
            typeof data.progress === "number" ? data.progress : 0;
          setPct(Math.max(0, Math.min(100, progress)));
          applyTerminal(data.status, data);
        } catch (e) {
          clearPoll();
          setJob("error");
          setError(e instanceof Error ? e.message : "Polling failed");
        }
      };

      void tick();
      pollRef.current = window.setInterval(() => {
        void tick();
      }, POLL_MS);
    },
    [applyTerminal, clearPoll],
  );

  const fetchInfo = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setVideoInfo(null);
        return null;
      }
      setInfoLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed, toolSlug: tool.slug }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch info");
        }
        const info = data as VideoInfoLite;
        setVideoInfo(info);
        return info;
      } catch (e) {
        setVideoInfo(null);
        setError(e instanceof Error ? e.message : "Failed to fetch info");
        return null;
      } finally {
        setInfoLoading(false);
      }
    },
    [tool.slug],
  );

  const detected = useMemo(
    () => (url.trim() ? detectPlatform(url) : null),
    [url],
  );

  const uploadFiles = useCallback(async (list: File[]) => {
    const fd = new FormData();
    for (const f of list) fd.append("files", f);
    const res = await fetch("/api/tools/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }
    return (data.files as Array<{ path: string; name: string; size: number }>).map(
      (f) => f.path,
    );
  }, []);

  const startUrlDownload = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a link first");
      return;
    }
    setError(null);
    let info = videoInfo;
    if (!info?.title) {
      info = await fetchInfo(trimmed);
      if (!info) return;
    }
    const resolvedFormat =
      isSocial || optionRows.length === 0
        ? formatId
        : formatIdFromOpts(opt, formatId);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          formatId: resolvedFormat,
          title: info.title || "Download",
          toolSlug: tool.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start download");
      }
      startPolling(data.jobId as string, "download");
    } catch (e) {
      setJob("error");
      setError(e instanceof Error ? e.message : "Failed to start download");
    }
  }, [
    url,
    videoInfo,
    fetchInfo,
    isSocial,
    optionRows.length,
    formatId,
    opt,
    tool.slug,
    startPolling,
  ]);

  const startToolRun = useCallback(async () => {
    setError(null);
    try {
      const options: Record<string, string> = { ...opt };
      if (isQR) {
        options["Error correction"] = options["Error correction"] || "M";
      }

      let inputPaths: string[] | undefined;
      let text: string | undefined;

      if (isQR && qrTab === "Generate") {
        text = textInput;
        if (!text.trim()) {
          setError("Enter text or a URL for the QR code");
          return;
        }
      } else if (isText && !isQR) {
        text = textInput;
        if (files.length > 0) {
          inputPaths = await uploadFiles(files);
        } else if (!text?.trim()) {
          setError("Paste input or add a file");
          return;
        }
      } else if (isUpload || (isQR && qrTab === "Decode")) {
        if (files.length === 0) {
          setError("Add at least one file");
          return;
        }
        inputPaths = await uploadFiles(files);
      }

      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug: tool.slug,
          title: files[0]?.name || tool.name,
          options,
          ...(inputPaths ? { inputPaths } : {}),
          ...(text != null ? { textInput: text } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start job");
      }
      startPolling(data.jobId as string, "tool");
    } catch (e) {
      setJob("error");
      setError(e instanceof Error ? e.message : "Failed to start job");
    }
  }, [
    opt,
    isQR,
    qrTab,
    textInput,
    isText,
    files,
    isUpload,
    uploadFiles,
    tool.slug,
    tool.name,
    startPolling,
  ]);

  const cancelJob = useCallback(async () => {
    if (!jobId) {
      resetJobUi();
      return;
    }
    try {
      if (isUrlTool) {
        await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
      } else {
        await fetch(`/api/tools/jobs/${jobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
      }
    } catch {
      // ignore cancel network errors
    }
    resetJobUi();
  }, [jobId, isUrlTool, resetJobUi]);

  const downloadResult = useCallback(() => {
    if (!jobId) return;
    window.location.href = `/api/files/${jobId}`;
  }, [jobId]);

  const primaryAction = () => {
    if (job === "done") {
      if (resultText && !resultName) {
        resetJobUi();
        return;
      }
      downloadResult();
      return;
    }
    if (job === "running") return;
    if (isUrlTool) void startUrlDownload();
    else void startToolRun();
  };

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list);
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next].slice(0, 20));
    setError(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const stepNames =
    isUrlTool
      ? ["Paste", "Configure", "Process", "Save"]
      : isQR
        ? ["Compose", "Configure", "Export"]
        : ["Upload", "Configure", "Process", "Save"];

  const hasInput = isUrlTool
    ? !!url.trim()
    : isQR
      ? qrTab === "Generate"
        ? !!textInput.trim()
        : files.length > 0
      : isText
        ? !!textInput.trim() || files.length > 0
        : files.length > 0;

  let cur = 0;
  if (job === "done") cur = stepNames.length - 1;
  else if (job === "running") cur = Math.min(2, stepNames.length - 1);
  else if (hasInput) cur = 1;

  const aside = useMemo(() => {
    const fileCount = files.length;
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    const first = files[0];
    const isImageFile = !!first && /^image\//.test(first.type);
    const isVideoFile = !!first && /^video\//.test(first.type);
    const isAudioFile = !!first && /^audio\//.test(first.type);
    const isPdfFile =
      !!first &&
      (first.type === "application/pdf" || /\.pdf$/i.test(first.name));

    type Aside = {
      title: string;
      ratio: string;
      note: string;
      stats: Array<{ k: string; v: string }>;
      kind: "empty" | "image" | "video" | "thumb" | "qr" | "label";
      src?: string | null;
      label?: string;
    };

    if (isUrlTool) {
      return {
        title: "Preview",
        ratio: "16 / 9",
        note: videoInfo?.channel
          ? `${videoInfo.channel}${videoInfo.duration ? ` · ${formatDuration(videoInfo.duration)}` : ""}`
          : "Paste a link and fetch to load the preview.",
        stats: [
          { k: "Title", v: videoInfo?.title?.slice(0, 28) || "—" },
          {
            k: "Duration",
            v: formatDuration(videoInfo?.duration) || "—",
          },
          { k: "Platform", v: detected?.platform || "—" },
        ],
        kind: videoInfo?.thumbnail
          ? ("thumb" as const)
          : infoLoading
            ? ("label" as const)
            : ("empty" as const),
        src: videoInfo?.thumbnail,
        label: infoLoading
          ? "Fetching…"
          : videoInfo?.title
            ? videoInfo.title
            : "No preview yet",
      } satisfies Aside;
    }

    if (isQR) {
      return {
        title: "Preview",
        ratio: "1 / 1",
        note: "Level M survives about 15% damage — right for print.",
        stats: [
          { k: "ECC", v: opt["Error correction"] || "M" },
          { k: "Chars", v: String(textInput.length) },
          { k: "Export", v: "PNG" },
        ],
        kind: qrPreview ? ("qr" as const) : ("empty" as const),
        src: qrPreview,
        label: textInput.trim() ? "Generating…" : "Enter text for a live QR",
      } satisfies Aside;
    }

    const mediaLike =
      tool.cat === "Media" ||
      tool.slug.startsWith("image-") ||
      tool.slug.startsWith("video-") ||
      tool.slug.startsWith("audio-") ||
      ["gif", "trim", "mute", "resfps", "extract-audio", "compress-video"].includes(
        tool.slug,
      );

    if (mediaLike || tool.cat === "PDF" || isUpload) {
      let kind: Aside["kind"] = "empty";
      let src: string | null = null;
      let label = "Drop a file to preview";
      if (filePreviewUrl && isImageFile) {
        kind = "image";
        src = filePreviewUrl;
        label = first!.name;
      } else if (filePreviewUrl && isVideoFile) {
        kind = "video";
        src = filePreviewUrl;
        label = first!.name;
      } else if (fileCount) {
        kind = "label";
        label = isPdfFile
          ? first!.name
          : isAudioFile
            ? first!.name
            : first!.name;
      }

      const isMeta = tool.slug === "metadata";

      return {
        title: isMeta
          ? "Image"
          : tool.cat === "PDF"
            ? "First file"
            : "Preview",
        ratio: tool.cat === "PDF" ? "3 / 4" : isImageFile ? "4 / 3" : "16 / 9",
        note: isMeta
          ? "Tags appear beside the file after you start. Download gets a cleaned copy."
          : tool.cat === "PDF"
            ? "Merged files keep their own page sizes unless you normalise."
            : "Estimates update with your current options.",
        stats: [
          { k: "Files", v: String(fileCount || "—") },
          { k: "Total in", v: fileCount ? formatBytes(totalBytes) : "—" },
          ...(opt.Remove ? [{ k: "Remove", v: opt.Remove }] : []),
          ...(opt["Target format"]
            ? [{ k: "Target", v: opt["Target format"] }]
            : []),
          ...(opt["Quality preset"]
            ? [{ k: "Preset", v: opt["Quality preset"] }]
            : []),
          ...(opt.Quality ? [{ k: "Quality", v: opt.Quality }] : []),
        ],
        kind,
        src,
        label,
      } satisfies Aside;
    }

    return null;
  }, [
    tool.slug,
    tool.cat,
    files,
    opt,
    textInput.length,
    textInput,
    isUrlTool,
    isQR,
    isUpload,
    videoInfo,
    infoLoading,
    detected,
    qrPreview,
    filePreviewUrl,
  ]);

  const ctaLabel =
    job === "done"
      ? resultText && !resultName
        ? "Done"
        : "Download result"
      : job === "running"
        ? "Running…"
        : isUrlTool
          ? "Start download"
          : "Start";

  // YouTube keeps the real downloader wired to APIs
  if (isYT) {
    return (
      <main className="animate-tf-fade relative z-1 pb-8">
        <ToolChrome tool={tool} depsReady preparing={false} prep={100} />
        <div className="mx-auto max-w-[1240px] px-5 md:px-7">
          <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 tf-shadow sm:p-6">
            <Downloader />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-tf-fade relative z-1 tf-safe-pb">
      <ToolChrome
        tool={tool}
        depsReady={tool.binary}
        preparing={false}
        prep={100}
      />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-5 md:px-7">
        <div className="mb-5 flex gap-4 overflow-x-auto border-b border-[var(--line)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stepNames.map((label, i) => (
            <div
              key={label}
              className="relative flex shrink-0 items-center gap-2 pb-3 text-[13px]"
              style={{ color: i <= cur ? "var(--ink)" : "var(--muted)" }}
            >
              <span
                className="grid size-[22px] place-items-center rounded-full border text-[11px] font-medium"
                style={{
                  borderColor: i <= cur ? "var(--accent)" : "var(--line2)",
                  background: i < cur ? "var(--accent)" : "transparent",
                  color:
                    i < cur
                      ? "var(--accent-ink)"
                      : i === cur
                        ? "var(--accent)"
                        : "var(--muted)",
                }}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "font-medium",
                  i === cur && "text-[var(--ink)]",
                )}
              >
                {label}
              </span>
              {i === cur ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-12 bg-[var(--accent)]" />
              ) : null}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "grid gap-4",
            aside && tool.slug !== "metadata"
              ? "lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]"
              : "grid-cols-1",
          )}
        >
          <div className="flex flex-col gap-3.5">
            {isUrlTool ? (
              <UrlPanel
                tool={tool}
                isSocial={isSocial}
                showFormats={
                  isSocial ||
                  !tool.opts.some((o) =>
                    ["Quality", "Output", "Format"].includes(o[0]),
                  )
                }
                url={url}
                setUrl={setUrl}
                formatId={formatId}
                setFormatId={setFormatId}
                detected={detected?.platform ?? null}
                infoLoading={infoLoading}
                videoInfo={videoInfo}
                setVideoInfo={setVideoInfo}
                onFetch={() => void fetchInfo(url)}
                onBlurFetch={() => {
                  if (url.trim() && !videoInfo) void fetchInfo(url);
                }}
                onPasteFetch={(pasted) => {
                  setUrl(pasted);
                  void fetchInfo(pasted);
                }}
              />
            ) : null}

            {isUpload && !isQR ? (
              <UploadPanel
                tool={tool}
                files={files}
                setFiles={setFiles}
                drag={drag}
                setDrag={setDrag}
                fileInputRef={fileInputRef}
                onDrop={onDrop}
                onPick={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            ) : null}

            {isQR ? (
              <QrPanel
                qrTab={qrTab}
                setQrTab={setQrTab}
                qrText={textInput}
                setQrText={setTextInput}
                qrEcc={opt["Error correction"] || "M"}
                setQrEcc={(v) =>
                  setOpt((s) => ({ ...s, "Error correction": v }))
                }
                files={files}
                setFiles={setFiles}
                drag={drag}
                setDrag={setDrag}
                fileInputRef={fileInputRef}
                onDrop={onDrop}
                onPick={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            ) : null}

            {isText && !isQR ? (
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-6 tf-shadow">
                <div className="font-display text-[22px] font-extrabold tracking-tight">
                  {tool.emptyTitle || tool.name}
                </div>
                <p className="mt-2 text-[14px] text-[var(--ink2)]">
                  {tool.empty || tool.desc}
                </p>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="mt-4 min-h-[140px] w-full rounded-[12px] border border-[var(--line2)] bg-[var(--paper)] p-3.5 text-[14px] outline-none"
                  placeholder="Paste input here…"
                />
                {tool.accepts.includes("FILE") || tool.accepts.includes("ANY") ? (
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 rounded-full border border-[var(--line2)] px-4 text-[13.5px]"
                    >
                      Or choose files
                    </button>
                    {files.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-[13px] text-[var(--ink2)]">
                        {files.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="truncate">
                            {f.name} · {formatBytes(f.size)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {optionRows.length > 0 ? (
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
                <div className="mb-4 text-[13px] font-semibold">Options</div>
                <div className="flex flex-col gap-5">
                  {optionRows
                    .filter((row) => {
                      if (
                        tool.slug === "pdf-split" &&
                        row.label === "Chunk size" &&
                        (opt.Mode || "Every page") !== "Every N pages"
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((row) => (
                    <ChoiceRow
                      key={row.label}
                      label={row.label}
                      hint={row.hint}
                      choices={row.choices}
                      value={opt[row.label] || row.choices[0]}
                      onChange={(v) => {
                        setOpt((s) => ({ ...s, [row.label]: v }));
                        if (
                          isUrlTool &&
                          ["Quality", "Output", "Format"].includes(row.label)
                        ) {
                          setFormatId(mapToFormatId(v));
                        }
                      }}
                    />
                  ))}
                  {tool.slug === "pdf-split" &&
                  (opt.Mode || "Every page") === "Ranges" ? (
                    <div className="flex flex-col gap-2">
                      <div className="text-[12px] font-medium text-[var(--muted)]">
                        Page ranges
                      </div>
                      <input
                        value={opt.Ranges || ""}
                        onChange={(e) =>
                          setOpt((s) => ({ ...s, Ranges: e.target.value }))
                        }
                        placeholder="e.g. 1-3, 7, 12-end"
                        className="h-11 rounded-[12px] border border-[var(--line2)] bg-[var(--paper)] px-3.5 text-[14px] outline-none"
                      />
                      <p className="text-[12.5px] text-[var(--ink2)]">
                        1-based pages. Comma-separate ranges; use{" "}
                        <span className="font-mono">end</span> for the last page.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {(tool.slug === "trim" || tool.slug === "gif") &&
            files.length > 0 ? (
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
                <div className="mb-3 text-[13px] font-semibold">Timeline</div>
                <div className="relative h-10 rounded-[10px] bg-[var(--paper2)]">
                  <div className="absolute inset-y-1 left-[18%] right-[34%] rounded-md border border-[var(--accent)] bg-[var(--accent-soft)]" />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--muted)]">
                  <span>00:00:00</span>
                  <span>IN / OUT via options</span>
                  <span>—</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[14px] border border-[color-mix(in_oklab,var(--danger,#c44)_40%,var(--line))] bg-[color-mix(in_oklab,var(--danger,#c44)_8%,var(--surface))] px-4 py-3 text-[13.5px] text-[var(--danger,#c44)]">
                {error}
              </div>
            ) : null}

            {tool.slug === "metadata" &&
            (files.length > 0 || (resultText && job === "done")) ? (
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
                <div className="mb-3 text-[13px] font-semibold">
                  {job === "done" ? "Image + metadata" : "Ready to inspect"}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className="relative overflow-hidden rounded-[12px] border border-[var(--line2)] bg-[var(--paper)]"
                    style={{ aspectRatio: "4 / 3", minHeight: 180 }}
                  >
                    {filePreviewUrl &&
                    files[0] &&
                    /^image\//.test(files[0].type) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={filePreviewUrl}
                        alt={files[0]?.name || "Uploaded file"}
                        className="absolute inset-0 size-full object-contain"
                      />
                    ) : files[0] ? (
                      <div className="absolute inset-0 grid place-items-center px-4 text-center">
                        <div>
                          <div className="font-mono text-[12px] text-[var(--ink)]">
                            {files[0].name}
                          </div>
                          <div className="mt-1 text-[11.5px] text-[var(--muted)]">
                            {formatBytes(files[0].size)} · preview for images
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center font-mono text-[11px] text-[var(--muted)]">
                        Drop a file
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-[180px] flex-col">
                    <div className="mb-2 text-[12px] font-medium text-[var(--muted)]">
                      {job === "done"
                        ? "Detected tags (before strip)"
                        : job === "running"
                          ? "Reading tags…"
                          : "Metadata report"}
                    </div>
                    {resultText && job === "done" ? (
                      <pre className="max-h-72 flex-1 overflow-auto whitespace-pre-wrap break-all rounded-[12px] bg-[var(--paper)] p-3 font-mono text-[12.5px]">
                        {resultText}
                      </pre>
                    ) : (
                      <div className="flex flex-1 items-center rounded-[12px] border border-dashed border-[var(--line2)] bg-[var(--paper)] px-4 py-6 text-[13px] leading-relaxed text-[var(--ink2)]">
                        {job === "running"
                          ? "Probing file metadata…"
                          : "Start to list EXIF / GPS / media tags beside the preview, then download a cleaned copy."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {resultText && job === "done" && tool.slug !== "metadata" ? (
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
                <div className="mb-2 text-[13px] font-semibold">Result</div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-[12px] bg-[var(--paper)] p-3 font-mono text-[12.5px]">
                  {resultText}
                </pre>
              </div>
            ) : null}
          </div>

          {aside && tool.slug !== "metadata" ? (
            <aside
              className={cn(
                "h-fit rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 tf-shadow",
                isUrlTool
                  ? "hidden lg:block"
                  : "order-first lg:order-none",
              )}
            >
              <div className="mb-3 text-[13px] font-semibold">{aside.title}</div>
              <div
                className="relative mb-3 overflow-hidden rounded-[12px] border border-[var(--line2)] bg-[var(--paper)]"
                style={{ aspectRatio: aside.ratio }}
              >
                {aside.kind === "thumb" && aside.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aside.src}
                    alt={aside.label || "Preview"}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : null}
                {aside.kind === "image" && aside.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aside.src}
                    alt={aside.label || "Preview"}
                    className="absolute inset-0 size-full object-contain"
                  />
                ) : null}
                {aside.kind === "video" && aside.src ? (
                  <video
                    src={aside.src}
                    className="absolute inset-0 size-full object-contain"
                    muted
                    playsInline
                    controls
                    preload="metadata"
                  />
                ) : null}
                {aside.kind === "qr" && aside.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aside.src}
                    alt="QR preview"
                    className="absolute inset-0 size-full object-contain p-4"
                  />
                ) : null}
                {aside.kind === "empty" || aside.kind === "label" ? (
                  <div className="absolute inset-0 grid place-items-center px-3 text-center font-mono text-[11px] text-[var(--muted)]">
                    {aside.label || "No preview yet"}
                  </div>
                ) : null}
                {aside.kind === "thumb" && videoInfo?.title ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
                    <div className="line-clamp-2 text-[12.5px] font-medium text-white">
                      {videoInfo.title}
                    </div>
                    {formatDuration(videoInfo.duration) ? (
                      <div className="mt-1 font-mono text-[10.5px] text-white/80">
                        {formatDuration(videoInfo.duration)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {aside.stats.map((s) => (
                  <div key={s.k} className="flex justify-between gap-3 text-[12.5px]">
                    <span className="shrink-0 text-[var(--muted)]">{s.k}</span>
                    <span className="truncate text-right font-mono">{s.v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--ink2)]">
                {aside.note}
              </p>
            </aside>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_92%,transparent)] backdrop-blur-md tf-bottom-bar">
        {job === "running" || job === "done" ? (
          <div className="h-[3px] bg-[var(--line)]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
        <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5 md:px-7">
          <div className="min-w-0 flex-1 overflow-hidden">
            {job === "idle" || job === "error" ? (
              <span className="block truncate text-[13px] text-[var(--muted)] sm:text-[13.5px]">
                {infoLoading ? "Fetching info…" : "Ready when you are"}
              </span>
            ) : null}
            {job === "running" ? (
              <span className="text-[13.5px] font-medium">
                Working…{" "}
                <span className="font-mono text-[var(--accent)]">
                  {Math.round(pct)}%
                </span>
              </span>
            ) : null}
            {job === "done" ? (
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium sm:text-[13.5px]">
                <span className="animate-tf-pop grid size-5 shrink-0 place-items-center rounded-full bg-[var(--ok)]">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.8"
                  >
                    <polyline points="5 12 10 17 19 7" />
                  </svg>
                </span>
                <span className="truncate">
                  {resultName
                    ? `${resultName} ready`
                    : resultText
                      ? "Result ready"
                      : "Result ready · shareable for 1 hour"}
                </span>
              </span>
            ) : null}
          </div>
          {job === "running" ? (
            <button
              type="button"
              onClick={() => void cancelJob()}
              className="h-11 shrink-0 rounded-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[13.5px] sm:px-[18px]"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={primaryAction}
            disabled={job === "running" || infoLoading}
            className="h-11 shrink-0 rounded-full border border-[var(--ink)] px-4 text-[14px] font-medium transition-transform active:scale-[0.97] disabled:opacity-60 sm:px-[22px]"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </main>
  );
}

function ToolChrome({
  tool,
  depsReady,
  preparing,
  prep,
}: {
  tool: Tool;
  depsReady: boolean;
  preparing: boolean;
  prep: number;
}) {
  return (
    <div className="mx-auto mb-5 flex max-w-[1240px] flex-wrap items-center gap-3 px-4 pt-6 sm:px-5 sm:pt-8 md:px-7">
      <Link
        href="/tools"
        className="grid size-11 place-items-center rounded-[9px] border border-[var(--line2)] bg-[var(--surface)] text-[var(--ink2)] hover:text-[var(--ink)]"
        aria-label="Back to tools"
      >
        ←
      </Link>
      <span className="grid size-10 place-items-center rounded-[12px] border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <ToolCategoryIcon cat={tool.cat} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate font-display text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          {tool.name}
        </h1>
        <p className="m-0 truncate text-[13.5px] text-[var(--ink2)]">
          {tool.desc}
        </p>
      </div>
      {depsReady ? (
        <span className="rounded-full border border-[var(--ok)] bg-[color-mix(in_oklab,var(--ok)_12%,transparent)] px-3 py-1 font-mono text-[11px] text-[var(--ok)]">
          {tool.deps} ready
        </span>
      ) : preparing ? (
        <span className="rounded-full border border-[var(--line2)] px-3 py-1 font-mono text-[11px] text-[var(--muted)]">
          prep {Math.round(prep)}%
        </span>
      ) : null}
    </div>
  );
}

function UrlPanel({
  tool,
  isSocial,
  showFormats,
  url,
  setUrl,
  formatId,
  setFormatId,
  detected,
  infoLoading,
  videoInfo,
  setVideoInfo,
  onFetch,
  onBlurFetch,
  onPasteFetch,
}: {
  tool: Tool;
  isSocial: boolean;
  showFormats: boolean;
  url: string;
  setUrl: (v: string) => void;
  formatId: FormatPresetId;
  setFormatId: (v: FormatPresetId) => void;
  detected: string | null;
  infoLoading: boolean;
  videoInfo: VideoInfoLite | null;
  setVideoInfo: (v: VideoInfoLite | null) => void;
  onFetch: () => void;
  onBlurFetch: () => void;
  onPasteFetch: (pasted: string) => void;
}) {
  const formats = isSocial
    ? [
        { id: "1080p" as const, label: "Video · 1080p", desc: "MP4, no watermark where possible" },
        { id: "best" as const, label: "Video · original", desc: "Exactly as the platform serves it" },
        { id: "mp3" as const, label: "Audio only", desc: "MP3 audio" },
        { id: "audio" as const, label: "Audio · M4A", desc: "M4A audio track" },
      ]
    : FORMAT_OPTIONS.map((f) => ({
        id: f.id,
        label: f.label,
        desc: f.description,
      }));

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
      {isSocial ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SOCIAL_PLATFORMS.map((p) => {
            const on = detected === p;
            return (
              <span
                key={p}
                className="rounded-full border px-2.5 py-1 text-[11.5px]"
                style={{
                  borderColor: on ? "var(--accent)" : "var(--line)",
                  background: on ? "var(--accent-soft)" : "transparent",
                  color: on ? "var(--accent)" : "var(--muted)",
                }}
              >
                {p}
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={url}
          onChange={(e) => {
            const next = e.target.value;
            setUrl(next);
            if (!next.trim()) setVideoInfo(null);
          }}
          onBlur={onBlurFetch}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted.trim()) {
              e.preventDefault();
              onPasteFetch(pasted.trim());
            }
          }}
          placeholder={tool.emptyTitle || "Paste a link…"}
          className="h-12 flex-1 rounded-[12px] border bg-[var(--paper)] px-3.5 text-[14px] outline-none"
          style={{
            borderColor: url ? "var(--accent)" : "var(--line2)",
          }}
        />
        <button
          type="button"
          onClick={() => {
            setUrl("");
            setVideoInfo(null);
          }}
          disabled={!url}
          className="h-12 rounded-[12px] border border-[var(--line2)] px-4 text-[13px] disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onFetch}
          disabled={!url.trim() || infoLoading}
          className="h-12 rounded-[12px] border border-[var(--line2)] px-4 text-[13px] disabled:opacity-40"
        >
          {infoLoading ? "…" : "Fetch"}
        </button>
      </div>

      {detected ? (
        <div className="mt-3 inline-flex h-7 animate-tf-pop items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 text-[12px] font-medium text-[var(--accent)]">
          Detected · {detected}
        </div>
      ) : (
        <p className="mt-3 text-[13.5px] text-[var(--ink2)]">
          {tool.empty || tool.desc}
        </p>
      )}

      {infoLoading ? (
        <div
          className="mt-4 overflow-hidden rounded-[14px] border border-[var(--line)] lg:hidden"
          aria-busy="true"
          aria-label="Loading preview"
        >
          <div className="aspect-video w-full animate-pulse bg-[var(--paper2)]" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-[var(--paper2)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--paper2)]" />
          </div>
        </div>
      ) : null}

      {!infoLoading && videoInfo?.title ? (
        <div className="mt-4 overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--paper)] lg:hidden">
          {videoInfo.thumbnail ? (
            <div className="relative aspect-video w-full bg-[var(--paper2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-3 pt-10">
                {formatDuration(videoInfo.duration) ? (
                  <span className="mb-1.5 inline-block rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">
                    {formatDuration(videoInfo.duration)}
                  </span>
                ) : null}
                <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
                  {videoInfo.title}
                </div>
                {videoInfo.channel ? (
                  <div className="mt-1 truncate text-[12px] text-white/75">
                    {videoInfo.channel}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-3.5">
              <div className="text-[14px] font-semibold">{videoInfo.title}</div>
              <div className="text-[12.5px] text-[var(--ink2)]">
                {[videoInfo.channel, formatDuration(videoInfo.duration)]
                  .filter(Boolean)
                  .join(" · ") || "Ready to download"}
              </div>
            </div>
          )}
          {videoInfo.type === "playlist" && videoInfo.entries?.length ? (
            <div className="border-t border-[var(--line)] px-3.5 py-2 text-[12.5px] text-[var(--ink2)]">
              Playlist · {videoInfo.entries.length} items
            </div>
          ) : null}
        </div>
      ) : null}

      {url && showFormats ? (
        <div className="mt-5 flex flex-col gap-2">
          {formats.map((f) => {
            const on = formatId === f.id;
            const p = pill(on);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatId(f.id)}
                className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left"
                style={{
                  borderColor: p.bd,
                  background: on ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <span
                  className="grid size-4 place-items-center rounded-full border-[1.5px]"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--line2)",
                  }}
                >
                  {on ? (
                    <span className="block size-2 rounded-full bg-[var(--accent)]" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">
                    {f.label}
                  </span>
                  <span className="block text-[12.5px] text-[var(--ink2)]">
                    {f.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UploadPanel({
  tool,
  files,
  setFiles,
  drag,
  setDrag,
  fileInputRef,
  onDrop,
  onPick,
}: {
  tool: Tool;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  drag: boolean;
  setDrag: (v: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: DragEvent) => void;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const accept = acceptFromTool(tool);
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onPick}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-[16px] border-[1.5px] border-dashed text-center transition-colors"
        style={{
          borderColor: drag ? "var(--accent)" : "var(--line2)",
          background: drag ? "var(--accent-soft)" : "var(--paper)",
          padding: files.length ? "26px 32px" : "64px 32px",
        }}
      >
        <div className="font-display text-[20px] font-extrabold tracking-tight">
          {tool.emptyTitle}
        </div>
        <p className="mx-auto mt-2 max-w-[40ch] text-[13.5px] text-[var(--ink2)]">
          {tool.empty}
        </p>
        <div className="mt-3 font-mono text-[11px] text-[var(--muted)]">
          {tool.accepts}
        </div>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-col gap-1 text-[12.5px] text-[var(--muted)] sm:flex-row sm:justify-between sm:gap-3">
            <span>
              {files.length} {files.length === 1 ? "file" : "files"} · ready to
              process
            </span>
            <span>
              {tool.slug === "pdf-merge"
                ? "Order is top to bottom"
                : "Processed top to bottom"}
            </span>
          </div>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${f.size}-${i}`}
              className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] px-3 py-3"
            >
              <span className="font-mono text-[11px] text-[var(--muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">
                  {f.name}
                </span>
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  {formatBytes(f.size)}
                </span>
              </span>
              <button
                type="button"
                className="min-h-10 shrink-0 px-2 text-[13px] text-[var(--muted)] hover:text-[var(--ink)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles((prev) => prev.filter((_, j) => j !== i));
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QrPanel({
  qrTab,
  setQrTab,
  qrText,
  setQrText,
  qrEcc,
  setQrEcc,
  files,
  setFiles,
  drag,
  setDrag,
  fileInputRef,
  onDrop,
  onPick,
}: {
  qrTab: "Generate" | "Decode";
  setQrTab: (v: "Generate" | "Decode") => void;
  qrText: string;
  setQrText: (v: string) => void;
  qrEcc: string;
  setQrEcc: (v: string) => void;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  drag: boolean;
  setDrag: (v: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: DragEvent) => void;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 tf-shadow">
      <div className="mb-4 inline-flex rounded-[11px] border border-[var(--line)] bg-[var(--paper2)] p-1">
        {(["Generate", "Decode"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setQrTab(t)}
            className="rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium"
            style={{
              background: qrTab === t ? "var(--surface)" : "transparent",
              color: qrTab === t ? "var(--ink)" : "var(--muted)",
              boxShadow: qrTab === t ? "var(--shadow)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {qrTab === "Generate" ? (
        <>
          <textarea
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            className="min-h-[100px] w-full rounded-[12px] border border-[var(--line2)] bg-[var(--paper)] p-3.5 text-[14px] outline-none"
          />
          <div className="mt-4">
            <ChoiceRow
              label="Error correction"
              choices={["L", "M", "Q", "H"]}
              value={qrEcc}
              onChange={setQrEcc}
            />
          </div>
        </>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={onPick}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-[16px] border border-dashed border-[var(--line2)] bg-[var(--paper)] px-6 py-14 text-center text-[13.5px] text-[var(--ink2)]"
            style={{
              borderColor: drag ? "var(--accent)" : "var(--line2)",
              background: drag ? "var(--accent-soft)" : "var(--paper)",
            }}
          >
            Drop a QR image to decode
          </div>
          {files.length > 0 ? (
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="truncate">{files[0].name}</span>
              <button
                type="button"
                className="text-[var(--muted)]"
                onClick={() => setFiles([])}
              >
                Remove
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
