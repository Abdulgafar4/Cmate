const globalForLauncher = globalThis as typeof globalThis & {
  __ycLauncherHeartbeat?: number;
};

const HEARTBEAT_TTL_MS = 10_000;

export function touchLauncherHeartbeat(): void {
  globalForLauncher.__ycLauncherHeartbeat = Date.now();
}

export function getLauncherStatus() {
  const lastHeartbeat = globalForLauncher.__ycLauncherHeartbeat ?? 0;
  const now = Date.now();

  return {
    lastHeartbeat,
    alive:
      lastHeartbeat > 0 && now - lastHeartbeat < HEARTBEAT_TTL_MS,
  };
}
