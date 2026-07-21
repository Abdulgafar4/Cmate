"use client";

import { useCallback, useState } from "react";

interface AdminStats {
  queue: {
    activeCount: number;
    queuedCount: number;
    totalJobs: number;
    downloading: number;
    done: number;
    error: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    error?: string;
    createdAt: number;
    fileName?: string;
  }>;
  history: Array<{
    jobId: string;
    title: string;
    fileName: string;
    createdAt: number;
    shareToken?: string;
  }>;
  disk: {
    fileCount: number;
    bytes: number;
    downloadDir: string;
  };
}

function formatBytes(bytes: number): string {
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

export default function AdminPage() {
  const [key, setKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return sessionStorage.getItem("cmate-admin-key") ?? "";
  });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": adminKey },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load stats");
      }
      sessionStorage.setItem("cmate-admin-key", adminKey);
      setStats(data);
    } catch (loadError) {
      setStats(null);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live queue, disk usage, and recent jobs. Requires <code>ADMIN_KEY</code>.
      </p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load(key);
        }}
      >
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Admin key"
          className="h-11 flex-1 rounded-xl border border-border bg-input px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading || !key}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {stats && (
        <div className="mt-8 space-y-8">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="yt-panel p-4">
              <p className="text-xs uppercase text-muted-foreground">Active</p>
              <p className="mt-1 text-2xl font-semibold">
                {stats.queue.activeCount}
              </p>
            </div>
            <div className="yt-panel p-4">
              <p className="text-xs uppercase text-muted-foreground">Queued</p>
              <p className="mt-1 text-2xl font-semibold">
                {stats.queue.queuedCount}
              </p>
            </div>
            <div className="yt-panel p-4">
              <p className="text-xs uppercase text-muted-foreground">Disk</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatBytes(stats.disk.bytes)}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.disk.fileCount} files
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Recent jobs</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.jobs.map((job) => (
                    <tr key={job.id} className="border-t border-border">
                      <td className="max-w-[240px] truncate px-3 py-2">
                        {job.title}
                      </td>
                      <td className="px-3 py-2">{job.status}</td>
                      <td className="px-3 py-2">{Math.round(job.progress)}%</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-destructive">
                        {job.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">History</h2>
            <ul className="space-y-2">
              {stats.history.map((item) => (
                <li
                  key={`${item.jobId}-${item.createdAt}`}
                  className="yt-panel flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-muted-foreground">
                      {item.fileName}
                    </p>
                  </div>
                  {item.shareToken && (
                    <a
                      href={`/api/share/${item.shareToken}`}
                      className="shrink-0 text-primary hover:underline"
                    >
                      Share
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
