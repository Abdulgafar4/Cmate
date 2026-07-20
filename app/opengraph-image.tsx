import { ImageResponse } from "next/og";

export const alt = "YC Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "#F9F9F9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
            fontSize: 56,
            fontWeight: 700,
            color: "#0F0F0F",
          }}
        >
          <span style={{ color: "#FF0000" }}>YC</span>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="#FF0000">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Downloader</span>
        </div>
        <p style={{ fontSize: 28, color: "#606060" }}>
          Save YouTube videos locally
        </p>
      </div>
    ),
    { ...size },
  );
}
