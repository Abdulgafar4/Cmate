export interface HistoryEntry {
  jobId: string;
  title: string;
  url: string;
  formatId: string;
  fileName: string;
  shareToken?: string;
  ownerKey?: string;
  createdAt: number;
  pinned?: boolean;
  /** Epoch ms — files + history row kept until then when pinned */
  pinnedUntil?: number;
  toolSlug?: string;
}

interface GlobalHistory {
  entries: HistoryEntry[];
}

const globalForHistory = globalThis as typeof globalThis & {
  __cmateHistory?: GlobalHistory;
};

const MAX_ENTRIES = 100;
export const PIN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getStore(): GlobalHistory {
  if (!globalForHistory.__cmateHistory) {
    globalForHistory.__cmateHistory = { entries: [] };
  }
  return globalForHistory.__cmateHistory;
}

function isActivelyPinned(entry: HistoryEntry, now = Date.now()): boolean {
  return Boolean(
    entry.pinned && entry.pinnedUntil && entry.pinnedUntil > now,
  );
}

/** Drop expired pin flags so cleanup can reclaim files. */
function normalizePins(store: GlobalHistory): void {
  const now = Date.now();
  for (const entry of store.entries) {
    if (entry.pinned && entry.pinnedUntil && entry.pinnedUntil <= now) {
      entry.pinned = false;
      entry.pinnedUntil = undefined;
    }
  }
}

export function addServerHistory(entry: HistoryEntry): void {
  const store = getStore();
  store.entries.unshift(entry);
  // Prefer dropping unpinned overflow first
  while (store.entries.length > MAX_ENTRIES) {
    const idx = [...store.entries]
      .map((e, i) => ({ e, i }))
      .reverse()
      .find(({ e }) => !isActivelyPinned(e))?.i;
    if (idx === undefined) {
      store.entries.pop();
    } else {
      store.entries.splice(idx, 1);
    }
  }
}

export function listServerHistory(ownerKey?: string): HistoryEntry[] {
  const store = getStore();
  normalizePins(store);
  const filtered = ownerKey
    ? store.entries.filter((entry) => entry.ownerKey === ownerKey)
    : store.entries.slice();

  filtered.sort((a, b) => {
    const ap = isActivelyPinned(a) ? 1 : 0;
    const bp = isActivelyPinned(b) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.createdAt - a.createdAt;
  });

  return filtered.slice(0, 40);
}

/** Clear unpinned history. Pinned jobs are kept. */
export function clearServerHistory(ownerKey?: string): number {
  const store = getStore();
  normalizePins(store);
  const before = store.entries.length;
  store.entries = store.entries.filter((entry) => {
    if (ownerKey && entry.ownerKey !== ownerKey) return true;
    return isActivelyPinned(entry);
  });
  return before - store.entries.length;
}

export function setHistoryPinned(
  jobId: string,
  pinned: boolean,
  ownerKey?: string,
): HistoryEntry | null {
  const store = getStore();
  normalizePins(store);
  const entry = store.entries.find((e) => e.jobId === jobId);
  if (!entry) return null;
  if (ownerKey && entry.ownerKey && entry.ownerKey !== ownerKey) {
    return null;
  }
  if (pinned) {
    entry.pinned = true;
    entry.pinnedUntil = Date.now() + PIN_TTL_MS;
  } else {
    entry.pinned = false;
    entry.pinnedUntil = undefined;
  }
  return entry;
}

/** Job IDs whose output files must survive normal TTL cleanup. */
export function getPinnedJobIds(now = Date.now()): Set<string> {
  const store = getStore();
  normalizePins(store);
  return new Set(
    store.entries
      .filter((e) => isActivelyPinned(e, now))
      .map((e) => e.jobId),
  );
}
