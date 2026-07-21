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
