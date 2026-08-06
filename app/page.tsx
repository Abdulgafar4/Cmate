import type { Metadata } from "next";
import { HomePage } from "@/components/tf/HomePage";
import { OG_IMAGE } from "@/lib/siteUrl";
import { TOOLS } from "@/lib/tools";

const title = `ToolFerry — ${TOOLS.length} tools, one calm shell`;
const description =
  "Self-hosted toolbox for social downloads, media conversion, PDF work, documents, and utilities. One shell, nothing to install, files that expire.";
const ogDescription =
  "Downloaders, converters, PDF and document utilities in one self-hosted shell.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  openGraph: {
    title,
    description: ogDescription,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: ogDescription,
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <HomePage />;
}
