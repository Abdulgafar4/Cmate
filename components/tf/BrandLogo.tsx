import { cn } from "@/lib/utils";

/** ToolFerry mark — ferry hull crossing a calm current. */
export function BrandLogo({
  className,
  title = "ToolFerry",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      {/* Water lines */}
      <path
        d="M6 22.5c2.2-1.2 4.4-1.2 6.6 0s4.4 1.2 6.6 0 4.4-1.2 6.6 0"
        stroke="var(--accent)"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M7 25.2c1.8-.9 3.6-.9 5.4 0s3.6.9 5.4 0 3.6-.9 5.4 0"
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Ferry hull */}
      <path
        d="M8.5 18.2h15l-1.6 3.1c-.25.48-.74.78-1.28.78H11.4c-.54 0-1.03-.3-1.28-.78L8.5 18.2Z"
        fill="var(--paper)"
      />
      {/* Cabin */}
      <path
        d="M12 12.2h8c.55 0 1 .45 1 1v5H11v-5c0-.55.45-1 1-1Z"
        fill="var(--accent)"
      />
      {/* Deck stripe */}
      <rect x="11" y="16.6" width="10" height="1.35" fill="var(--paper)" opacity="0.35" />
      {/* Windows */}
      <rect x="13.1" y="13.4" width="2.2" height="2.2" rx="0.4" fill="var(--paper)" />
      <rect x="16.9" y="13.4" width="2.2" height="2.2" rx="0.4" fill="var(--paper)" />
    </svg>
  );
}

/** Flat mark for OG / favicon where CSS vars are unavailable. */
export function BrandLogoStatic({
  size = 32,
  ink = "#2A2824",
  paper = "#F7F5F0",
  accent = "#2F7A8C",
}: {
  size?: number;
  ink?: string;
  paper?: string;
  accent?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" fill={ink} />
      <path
        d="M6 22.5c2.2-1.2 4.4-1.2 6.6 0s4.4 1.2 6.6 0 4.4-1.2 6.6 0"
        stroke={accent}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M7 25.2c1.8-.9 3.6-.9 5.4 0s3.6.9 5.4 0 3.6-.9 5.4 0"
        stroke={accent}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M8.5 18.2h15l-1.6 3.1c-.25.48-.74.78-1.28.78H11.4c-.54 0-1.03-.3-1.28-.78L8.5 18.2Z"
        fill={paper}
      />
      <path
        d="M12 12.2h8c.55 0 1 .45 1 1v5H11v-5c0-.55.45-1 1-1Z"
        fill={accent}
      />
      <rect x="11" y="16.6" width="10" height="1.35" fill={paper} opacity="0.35" />
      <rect x="13.1" y="13.4" width="2.2" height="2.2" rx="0.4" fill={paper} />
      <rect x="16.9" y="13.4" width="2.2" height="2.2" rx="0.4" fill={paper} />
    </svg>
  );
}
