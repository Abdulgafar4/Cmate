import type { Metadata } from "next";
import { JobHistory } from "@/components/tf/JobHistory";

export const metadata: Metadata = {
  title: "Job history",
  description:
    "Pinned and recent ToolFerry jobs — downloads, conversions, and document runs with share links.",
};

export default function HistoryPage() {
  return <JobHistory />;
}
