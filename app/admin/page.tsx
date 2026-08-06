import type { Metadata } from "next";
import { OverviewDashboard } from "@/components/tf/OverviewDashboard";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Live ToolFerry instance stats — jobs tracked, queue depth, failure rate, storage, and top tools.",
};

export default function AdminPage() {
  return <OverviewDashboard />;
}
