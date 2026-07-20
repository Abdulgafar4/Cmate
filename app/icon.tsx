import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FF0000",
          borderRadius: 8,
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
