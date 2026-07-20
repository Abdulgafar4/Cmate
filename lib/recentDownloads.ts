export interface RecentDownload {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  downloadedAt: number;
}

const STORAGE_KEY = "yc-downloader-recent-downloads";
const MAX_ITEMS = 5;

export function getRecentDownloads(): RecentDownload[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RecentDownload[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addRecentDownload(entry: RecentDownload): RecentDownload[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = getRecentDownloads().filter((item) => item.id !== entry.id);
  const next = [entry, ...existing].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentDownloads(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
