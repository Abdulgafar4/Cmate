import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToolFerry",
    short_name: "ToolFerry",
    description: `${TOOLS.length} tools in one calm self-hosted shell — downloaders, converters, PDF, and utilities.`,
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#2F7A8C",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
