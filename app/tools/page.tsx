import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolsHub } from "@/components/tf/ToolsHub";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Tools",
  description: `Browse all ${TOOLS.length} ToolFerry tools — downloaders, media, PDF, documents, and utilities.`,
};

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-[var(--muted)]">Loading tools…</div>}>
      <ToolsHub />
    </Suspense>
  );
}
