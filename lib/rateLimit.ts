interface Bucket {
  count: number;
  resetAt: number;
}

interface GlobalRateLimit {
  buckets: Map<string, Bucket>;
}

const globalForRate = globalThis as typeof globalThis & {
  __cmateRate?: GlobalRateLimit;
};

function getStore(): GlobalRateLimit {
  if (!globalForRate.__cmateRate) {
    globalForRate.__cmateRate = { buckets: new Map() };
  }
  return globalForRate.__cmateRate;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  key: string,
  limit = Number(process.env.RATE_LIMIT_PER_HOUR ?? "30"),
  windowMs = 60 * 60 * 1000,
): { ok: boolean; remaining: number; resetAt: number } {
  const store = getStore();
  const now = Date.now();
  const existing = store.buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    store.buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
