export interface HistoryEntry {
  jobId: string;
  title: string;
  url: string;
  formatId: string;
  fileName: string;
  shareToken?: string;
  ownerKey?: string;
  createdAt: number;
}

interface GlobalHistory {
  entries: HistoryEntry[];
}

const globalForHistory = globalThis as typeof globalThis & {
  __cmateHistory?: GlobalHistory;
};

const MAX_ENTRIES = 100;

function getStore(): GlobalHistory {
  if (!globalForHistory.__cmateHistory) {
    globalForHistory.__cmateHistory = { entries: [] };
  }
  return globalForHistory.__cmateHistory;
}

export function addServerHistory(entry: HistoryEntry): void {
  const store = getStore();
  store.entries.unshift(entry);
  if (store.entries.length > MAX_ENTRIES) {
    store.entries.length = MAX_ENTRIES;
  }
}

export function listServerHistory(ownerKey?: string): HistoryEntry[] {
  const store = getStore();
  if (!ownerKey) {
    return store.entries.slice(0, 20);
  }
  return store.entries.filter((entry) => entry.ownerKey === ownerKey).slice(0, 20);
}
