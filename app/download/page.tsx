import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Download",
};

export default function DownloadRedirect() {
  redirect("/tools/youtube");
}
