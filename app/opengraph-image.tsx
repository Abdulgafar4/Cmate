import { ImageResponse } from "next/og";
import { TOOLS } from "@/lib/tools";

export const alt =
  "ToolFerry — 38 tools, one calm shell. Downloaders, converters, PDF and utilities.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F7F5F0";
const PAPER2 = "#EDEAE3";
const SURFACE = "#FFFFFF";
const INK = "#2A2824";
const INK2 = "#6B6760";
const MUTED = "#8A857C";
const LINE = "#E4E0D8";
const ACCENT = "#2F7A8C";
const ACCENT_SOFT = "#D9EBEE";
const OK = "#3D8B6E";

async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&display=swap",
      {
        headers: {
          // Request a TTF/OTF URL — Satori cannot decode woff2.
          "User-Agent":
            "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
        },
      },
    ).then((r) => r.text());
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match?.[1]) return null;
    return await fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
        stroke={ACCENT}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polyline
        points="7 10 12 15 17 10"
        stroke={ACCENT}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="5"
        y1="20"
        x2="19"
        y2="20"
        stroke={ACCENT}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke={ACCENT}
        strokeWidth="1.8"
      />
      <line
        x1="9"
        y1="9"
        x2="15"
        y2="9"
        stroke={ACCENT}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="13"
        x2="15"
        y2="13"
        stroke={ACCENT}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function OpenGraphImage() {
  const fontData = await loadDisplayFont();
  const fonts = fontData
    ? [
        {
          name: "Bricolage Grotesque",
          data: fontData,
          style: "normal" as const,
          weight: 800 as const,
        },
      ]
    : [];

  const display = fontData ? "Bricolage Grotesque" : "system-ui";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft grid — same atmosphere as the site */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(42,40,36,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,40,36,0.045) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.7,
          }}
        />

        {/* Left floating download card */}
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 78,
            display: "flex",
            width: 228,
            flexDirection: "column",
            gap: 14,
            borderRadius: 26,
            border: `1.5px solid ${LINE}`,
            background: SURFACE,
            padding: 18,
            transform: "rotate(-10deg)",
            boxShadow: "0 18px 40px rgba(42,40,36,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                border: `1px solid ${LINE}`,
                background: ACCENT_SOFT,
              }}
            >
              <DownloadIcon />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: "-0.02em",
                }}
              >
                workspace-walkthrough
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  color: MUTED,
                }}
              >
                MP4 · 1080p
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              height: 5,
              borderRadius: 999,
              background: PAPER2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "72%",
                height: "100%",
                background: ACCENT,
                borderRadius: 999,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: MUTED,
            }}
          >
            <span>DOWNLOADING</span>
            <span style={{ color: ACCENT }}>72%</span>
          </div>
        </div>

        {/* Right floating PDF card */}
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 52,
            display: "flex",
            width: 228,
            flexDirection: "column",
            gap: 14,
            borderRadius: 26,
            border: `1.5px solid ${LINE}`,
            background: SURFACE,
            padding: 18,
            transform: "rotate(10deg)",
            boxShadow: "0 18px 40px rgba(42,40,36,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                border: `1px solid ${LINE}`,
                background: ACCENT_SOFT,
              }}
            >
              <PdfIcon />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: "-0.02em",
                }}
              >
                proposal-merged.pdf
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  color: MUTED,
                }}
              >
                3 files · 24 pages
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: OK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="5 12 10 17 19 7"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: 13, color: INK2 }}>Done in 4.1s</div>
          </div>
        </div>

        {/* Circular CTA — bottom right */}
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 48,
            width: 118,
            height: 118,
            borderRadius: 999,
            background: INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(10deg)",
            boxShadow: "0 16px 36px rgba(42,40,36,0.18)",
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 100 100"
            fill="none"
            stroke={ACCENT}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20,80 Q 40,50 30,30 T 80,20" />
            <path d="M60,10 L80,20 L70,40" />
          </svg>
        </div>

        {/* Hero type stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            position: "relative",
            marginTop: -24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: display,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: ACCENT,
              marginLeft: -120,
            }}
          >
            {TOOLS.length} tools
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: display,
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: INK,
            }}
          >
            Toolferry
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: display,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: INK,
              marginLeft: 80,
            }}
          >
            One shell
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 22,
            color: INK2,
            maxWidth: 640,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Downloaders, converters, PDF and document utilities — every tool in
          the same calm shell.
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
