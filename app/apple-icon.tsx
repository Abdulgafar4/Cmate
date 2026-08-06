import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#2A2824";
const PAPER = "#F7F5F0";
const ACCENT = "#2F7A8C";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M6 22.5c2.2-1.2 4.4-1.2 6.6 0s4.4 1.2 6.6 0 4.4-1.2 6.6 0"
            stroke={ACCENT}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 25.2c1.8-.9 3.6-.9 5.4 0s3.6.9 5.4 0 3.6-.9 5.4 0"
            stroke={ACCENT}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M8.5 18.2h15l-1.6 3.1c-.25.48-.74.78-1.28.78H11.4c-.54 0-1.03-.3-1.28-.78L8.5 18.2Z"
            fill={PAPER}
          />
          <path
            d="M12 12.2h8c.55 0 1 .45 1 1v5H11v-5c0-.55.45-1 1-1Z"
            fill={ACCENT}
          />
          <rect x="13.1" y="13.4" width="2.2" height="2.2" rx="0.4" fill={PAPER} />
          <rect x="16.9" y="13.4" width="2.2" height="2.2" rx="0.4" fill={PAPER} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
