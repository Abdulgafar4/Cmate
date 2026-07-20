export function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value || value === "NA" || value === "N/A") {
    return undefined;
  }
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatSpeed(bytesPerSecond: number | undefined): string {
  if (bytesPerSecond === undefined || bytesPerSecond <= 0) {
    return "—";
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatEta(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 0 || !Number.isFinite(seconds)) {
    return "—";
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatDownloaded(
  downloadedBytes: number | undefined,
  totalBytes: number | undefined,
): string {
  if (downloadedBytes === undefined) {
    return "—";
  }
  if (totalBytes && totalBytes > 0) {
    return `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`;
  }
  return formatBytes(downloadedBytes);
}
