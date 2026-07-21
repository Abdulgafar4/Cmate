import { randomBytes } from "crypto";

interface ShareRecord {
  jobId: string;
  createdAt: number;
}

interface GlobalShare {
  tokens: Map<string, ShareRecord>;
}

const globalForShare = globalThis as typeof globalThis & {
  __cmateShare?: GlobalShare;
};

function getStore(): GlobalShare {
  if (!globalForShare.__cmateShare) {
    globalForShare.__cmateShare = { tokens: new Map() };
  }
  return globalForShare.__cmateShare;
}

const SHARE_TTL_MS = Number(process.env.SHARE_TTL_MS ?? String(60 * 60 * 1000));

export function createShareToken(jobId: string): string {
  const token = randomBytes(16).toString("hex");
  getStore().tokens.set(token, { jobId, createdAt: Date.now() });
  return token;
}

export function resolveShareToken(token: string): string | undefined {
  const record = getStore().tokens.get(token);
  if (!record) {
    return undefined;
  }
  if (Date.now() - record.createdAt > SHARE_TTL_MS) {
    getStore().tokens.delete(token);
    return undefined;
  }
  return record.jobId;
}
