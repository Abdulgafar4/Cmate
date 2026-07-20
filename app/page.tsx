import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Download,
  HardDrive,
  Link2,
  ListMusic,
  MonitorSmartphone,
  Sparkles,
  Subtitles,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "YC Downloader — Save YouTube Videos Locally",
  },
  description:
    "YC Downloader is a local-first YouTube downloader. Paste a link, pick a quality, and save videos to your device with yt-dlp and FFmpeg.",
  openGraph: {
    title: "YC Downloader — Save YouTube Videos Locally",
    description:
      "A simple, local-first app to download public YouTube videos to your device.",
    siteName: "YC Downloader",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Paste a YouTube URL",
    description:
      "Copy any public video link from YouTube and paste it into the downloader.",
  },
  {
    title: "Preview and pick quality",
    description:
      "See the thumbnail, title, and duration. Choose Best, 1080p, 720p, or audio-only.",
  },
  {
    title: "Download on your machine",
    description:
      "YC Downloader runs yt-dlp and FFmpeg on your computer — not in the cloud.",
  },
  {
    title: "Save to your device",
    description:
      "When the download finishes, save the file with the video title as the filename.",
  },
] as const;

const CURRENT_FEATURES = [
  {
    icon: Link2,
    title: "Public YouTube links",
    description: "Supports standard watch, Shorts, and youtu.be URLs.",
  },
  {
    icon: Zap,
    title: "Quality presets",
    description: "Best available, 1080p, 720p, and M4A audio extraction.",
  },
  {
    icon: Clock3,
    title: "Live progress",
    description: "Track percent complete, speed, downloaded size, and ETA.",
  },
  {
    icon: HardDrive,
    title: "Local-first",
    description: "Files are processed on your machine and saved to your device.",
  },
] as const;

const FUTURE_FEATURES = [
  {
    icon: ListMusic,
    title: "Playlists & channels",
    description: "Queue multiple videos from a playlist or channel in one go.",
  },
  {
    icon: Subtitles,
    title: "Subtitles & captions",
    description: "Download SRT or VTT files alongside the video.",
  },
  {
    icon: MonitorSmartphone,
    title: "Better mobile flow",
    description: "Improved save experience on phones and tablets.",
  },
  {
    icon: Sparkles,
    title: "More formats",
    description: "Additional audio codecs, custom naming, and output folders.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-primary">
              Local-first YouTube downloader
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Save YouTube videos to your device, simply.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              YC Downloader helps you download public YouTube videos for personal,
              offline use. Paste a link, choose a quality, and save the file —
              powered by yt-dlp and FFmpeg running on your computer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/download"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download className="size-4" />
                Open Downloader
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">How to use YC Downloader</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Four steps from link to saved file. No account required.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="yt-panel p-5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">
              What you can do today
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              YC Downloader is built for straightforward, one-video downloads with clear
              progress and friendly filenames.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {CURRENT_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="yt-panel flex gap-4 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Planned improvements for future releases. Order may change as we
            ship.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {FUTURE_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="rounded-2xl border border-dashed border-border bg-card/60 p-5"
              >
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Ready to download?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Head to the downloader, paste a YouTube link, and save your first
            video in minutes.
          </p>
          <Link
            href="/download"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="size-4" />
            Go to Downloader
          </Link>
          <p className="mt-8 text-xs text-muted-foreground">
            For personal use only. Respect YouTube&apos;s Terms of Service.
          </p>
        </div>
      </section>
    </main>
  );
}
