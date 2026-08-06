import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import { TfHeader } from "@/components/tf/TfHeader";
import { SlashFocus } from "@/components/tf/HomePage";
import { LauncherHeartbeat } from "@/components/LauncherHeartbeat";
import { getSiteUrl, OG_IMAGE } from "@/lib/siteUrl";
import { TOOLS } from "@/lib/tools";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const siteUrl = getSiteUrl();
const siteName = "ToolFerry";
const tagline = `${TOOLS.length} tools, one calm shell`;
const description =
  "ToolFerry is a self-hosted toolbox for social downloads, media conversion, PDF work, documents, and everyday utilities — one shell, nothing to install, files that expire.";
const shortDescription =
  "Downloaders, converters, PDF and document utilities in one self-hosted shell.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} — ${tagline}`,
    template: `%s — ${siteName}`,
  },
  description,
  keywords: [
    "ToolFerry",
    "YouTube downloader",
    "TikTok downloader",
    "video converter",
    "PDF merge",
    "PDF tools",
    "media converter",
    "self-hosted tools",
    "ffmpeg",
    "yt-dlp",
    "QR generator",
    "file converter",
  ],
  authors: [{ name: "ToolFerry" }],
  creator: "ToolFerry",
  publisher: "ToolFerry",
  category: "productivity",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: `${siteName} — ${tagline}`,
    description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${tagline}`,
    description: shortDescription,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  other: {
    "theme-color": "#F7F5F0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cmate-theme');var dark=t==='dark'||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.setAttribute('data-theme',dark?'dark':'light');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#1a1917':'#F7F5F0')}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative flex min-h-full flex-col">
        <div className="pointer-events-none absolute inset-0 z-0 tf-grid-fade" />
        <LauncherHeartbeat />
        <SlashFocus />
        <TfHeader />
        <div className="relative z-1 flex-1">{children}</div>
      </body>
    </html>
  );
}
