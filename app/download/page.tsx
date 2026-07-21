import type { Metadata } from "next";
import { Downloader } from "@/components/Downloader";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Paste a YouTube link, pick a quality, and save videos to your device with Cmate.",
};

export default function DownloadPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
      <Downloader />
    </main>
  );
}
