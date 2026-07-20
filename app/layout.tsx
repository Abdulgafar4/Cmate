import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { LauncherHeartbeat } from "@/components/LauncherHeartbeat";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:9090",
  ),
  title: {
    default: "YC Downloader",
    template: "%s — YC Downloader",
  },
  description:
    "Download YouTube videos locally with yt-dlp and FFmpeg. Local-first, simple, and fast.",
  openGraph: {
    title: "YC Downloader",
    description:
      "Paste a YouTube link, pick a quality, and save videos locally.",
    siteName: "YC Downloader",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "YC Downloader",
    description:
      "Paste a YouTube link, pick a quality, and save videos locally.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <LauncherHeartbeat />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
