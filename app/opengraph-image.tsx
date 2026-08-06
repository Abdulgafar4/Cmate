import { ImageResponse } from "next/og";

export const alt =
  "ToolFerry — downloaders, converters, PDF and document tools in one shell";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#2A2824";
const PAPER = "#F4F1EA";
const SURFACE = "#FFFcf7";
const ACCENT = "#2F7A8C";
const MUTED = "#6B6760";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft grid wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(42,40,36,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,40,36,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -100,
            width: 480,
            height: 480,
            borderRadius: 999,
            background: "rgba(47,122,140,0.14)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -60,
            bottom: -120,
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "rgba(42,40,36,0.06)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "64px 72px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: INK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 22.5c2.2-1.2 4.4-1.2 6.6 0s4.4 1.2 6.6 0 4.4-1.2 6.6 0"
                  stroke={ACCENT}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 18.2h15l-1.6 3.1c-.25.48-.74.78-1.28.78H11.4c-.54 0-1.03-.3-1.28-.78L8.5 18.2Z"
                  fill={PAPER}
                />
                <path
                  d="M12 12.2h8c.55 0 1 .45 1 1v5H11v-5c0-.55.45-1 1-1Z"
                  fill={ACCENT}
                />
                <rect
                  x="13.1"
                  y="13.4"
                  width="2.2"
                  height="2.2"
                  rx="0.4"
                  fill={PAPER}
                />
                <rect
                  x="16.9"
                  y="13.4"
                  width="2.2"
                  height="2.2"
                  rx="0.4"
                  fill={PAPER}
                />
              </svg>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: INK,
                }}
              >
                Tool
              </span>
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: ACCENT,
                }}
              >
                Ferry
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                letterSpacing: "-0.045em",
                lineHeight: 1.05,
                color: INK,
                maxWidth: 900,
              }}
            >
              Every tool in one calm shell
            </div>
            <div
              style={{
                fontSize: 28,
                color: MUTED,
                maxWidth: 760,
                lineHeight: 1.35,
              }}
            >
              Downloaders · converters · PDF · documents · utilities. Nothing to
              install. Files expire.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {[
              "Social download",
              "Media convert",
              "PDF toolkit",
              "Self-hosted",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "10px 18px",
                  borderRadius: 999,
                  background: SURFACE,
                  border: `1.5px solid rgba(42,40,36,0.12)`,
                  fontSize: 18,
                  fontWeight: 600,
                  color: INK,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
