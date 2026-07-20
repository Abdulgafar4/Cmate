import path from "path";

export function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\.+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150) || "download"
  );
}

export function buildDownloadFilename(title: string, filePath: string): string {
  const ext = path.extname(filePath).replace(/^\./, "") || "mp4";
  return `${sanitizeFilename(title)}.${ext}`;
}

export function contentDispositionHeader(filename: string): string {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);

  return `attachment; filename="${asciiFallback || "download.mp4"}"; filename*=UTF-8''${encoded}`;
}
