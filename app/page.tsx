import type { Metadata } from "next";
import { HomePage } from "@/components/tf/HomePage";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: {
    absolute: `ToolFerry — ${TOOLS.length} tools, one calm shell`,
  },
  description:
    "Self-hosted toolbox for social downloads, media conversion, PDF work, documents, and utilities. One shell, nothing to install, files that expire.",
  openGraph: {
    title: `ToolFerry — ${TOOLS.length} tools, one calm shell`,
    description:
      "Downloaders, converters, PDF and document utilities in one self-hosted shell.",
  },
};

export default function Page() {
  return <HomePage />;
}
