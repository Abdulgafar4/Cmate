"use client";

import { useRef } from "react";
import { ArrowRight, ClipboardPaste, Link2, Loader2 } from "lucide-react";
import { isValidYouTubeUrl } from "@/lib/validators";

interface UrlFormProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onPasteUrl?: (url: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function UrlForm({
  url,
  loading,
  onUrlChange,
  onSubmit,
  onPasteUrl,
  inputRef,
}: UrlFormProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      onUrlChange(trimmed);
      if (isValidYouTubeUrl(trimmed)) {
        onPasteUrl?.(trimmed);
      }
    } catch {
      ref.current?.focus();
    }
  };

  const handleInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").trim();
    if (pasted && isValidYouTubeUrl(pasted)) {
      window.setTimeout(() => onPasteUrl?.(pasted), 0);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label
        htmlFor="youtube-url"
        className="block text-sm font-medium text-foreground"
      >
        YouTube URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="yt-input flex min-w-0 flex-1 items-center gap-3 px-4">
          <Link2 className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            ref={ref}
            id="youtube-url"
            type="url"
            placeholder="Paste URL here"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            onPaste={handleInputPaste}
            disabled={loading}
            aria-describedby="url-hint"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePaste}
            disabled={loading}
            title="Paste from clipboard"
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ClipboardPaste className="size-4" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[112px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Fetching
              </>
            ) : (
              <>
                Fetch
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
      <p id="url-hint" className="text-xs text-muted-foreground">
        Tip: paste a link to auto-fetch · Press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>{" "}
        to focus
      </p>
    </form>
  );
}
