import { parseOptionalNumber } from "./progressFormat";

export interface DownloadProgressUpdate {
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBps?: number;
  etaSeconds?: number;
}

export function parseProgressLine(line: string): DownloadProgressUpdate | null {
  const structured = line.match(
    /^PROGRESS:([^|]+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)$/,
  );

  if (structured) {
    const progress = Number.parseFloat(structured[1].replace("%", "").trim());
    if (!Number.isFinite(progress)) {
      return null;
    }

    return {
      progress: Math.min(100, Math.max(0, progress)),
      downloadedBytes: parseOptionalNumber(structured[2]),
      totalBytes: parseOptionalNumber(structured[3]),
      speedBps: parseOptionalNumber(structured[4]),
      etaSeconds: parseOptionalNumber(structured[5]),
    };
  }

  const legacy = line.match(/PROGRESS:\s*([\d.]+)%?/);
  if (!legacy) {
    return null;
  }

  const progress = Number.parseFloat(legacy[1]);
  if (!Number.isFinite(progress)) {
    return null;
  }

  return {
    progress: Math.min(100, Math.max(0, progress)),
  };
}
