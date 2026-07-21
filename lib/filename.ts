import path from "path";
import { sanitizeFilename as sanitize } from "./filenameSanitize";

export { sanitize as sanitizeFilename };

export function applyFilenameTemplate(
  template: string | undefined,
  parts: { title: string; channel?: string; id?: string },
): string {
  const title = parts.title || "download";
  if (!template?.trim()) {
    return sanitize(title);
  }

  const rendered = template
    .replaceAll("{title}", parts.title || "download")
    .replaceAll("{channel}", parts.channel || "unknown")
    .replaceAll("{id}", parts.id || "")
    .trim();

  return sanitize(rendered || title);
}

export function buildDownloadFilename(
  title: string,
  filePath: string,
  options?: {
    template?: string;
    channel?: string;
    id?: string;
  },
): string {
  const ext = path.extname(filePath).replace(/^\./, "") || "mp4";
  const base = applyFilenameTemplate(options?.template, {
    title,
    channel: options?.channel,
    id: options?.id,
  });
  return `${base}.${ext}`;
}

export function contentDispositionHeader(filename: string): string {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);

  return `attachment; filename="${asciiFallback || "download.mp4"}"; filename*=UTF-8''${encoded}`;
}
