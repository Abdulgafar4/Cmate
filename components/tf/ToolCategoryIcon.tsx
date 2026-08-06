import type { ToolCategory } from "@/lib/tools";

export function ToolCategoryIcon({
  cat,
  size = 17,
}: {
  cat: ToolCategory;
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
  };

  if (cat === "Downloaders") {
    return (
      <svg {...props}>
        <line x1="12" y1="3" x2="12" y2="15" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="5" y1="20" x2="19" y2="20" />
      </svg>
    );
  }
  if (cat === "Media") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <polyline points="10 9 15 12 10 15 10 9" />
      </svg>
    );
  }
  if (cat === "PDF") {
    return (
      <svg {...props}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </svg>
    );
  }
  if (cat === "Documents") {
    return (
      <svg {...props}>
        <polyline points="14 3 6 3 6 21 18 21 18 7 14 3 14 7 18 7" />
        <line x1="9" y1="16" x2="15" y2="16" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3.4" />
      <line x1="12" y1="2.5" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21.5" y2="12" />
    </svg>
  );
}
