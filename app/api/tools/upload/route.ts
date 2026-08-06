import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getUploadDir } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES ?? String(512 * 1024 * 1024),
);

type UploadBlob = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function asUploadBlob(value: FormDataEntryValue): UploadBlob | null {
  if (typeof value === "string" || value == null) return null;
  const v = value as {
    name?: unknown;
    arrayBuffer?: unknown;
    size?: unknown;
  };
  if (
    typeof v.arrayBuffer !== "function" ||
    typeof v.name !== "string" ||
    typeof v.size !== "number"
  ) {
    return null;
  }
  return value as unknown as UploadBlob;
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`upload:${getClientIp(request)}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart form upload" },
        { status: 415 },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid form body";
      return NextResponse.json(
        {
          error:
            msg.includes("FormData") || msg.includes("form data")
              ? "Upload failed — file may be too large for this connection. Try a smaller file, or restart the server after the latest config update."
              : msg,
        },
        { status: 400 },
      );
    }

    const files = form
      .getAll("files")
      .map(asUploadBlob)
      .filter((f): f is UploadBlob => f != null);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }
    if (files.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 files per upload" },
        { status: 400 },
      );
    }

    const uploadDir = await getUploadDir();
    const saved: Array<{ path: string; name: string; size: number }> = [];

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          {
            error: `${file.name} is over the ${Math.round(MAX_BYTES / (1024 * 1024))} MB limit`,
          },
          { status: 413 },
        );
      }
      if (file.size === 0) {
        return NextResponse.json(
          { error: `${file.name || "File"} is empty` },
          { status: 400 },
        );
      }
      const safe = file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
      const dest = path.join(uploadDir, `${randomUUID()}-${safe || "upload.bin"}`);
      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.byteLength === 0) {
        return NextResponse.json(
          {
            error:
              "Upload arrived empty. Large files need the latest server config — restart `bun dev` and retry.",
          },
          { status: 400 },
        );
      }
      await writeFile(dest, buf);
      saved.push({ path: dest, name: file.name || path.basename(dest), size: buf.byteLength });
    }

    return NextResponse.json({ files: saved });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
