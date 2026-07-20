"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UnlockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Invalid access key");
      }

      const next = searchParams.get("next") || "/download";
      router.replace(next);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to unlock",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Unlock YC Downloader</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the access key configured on this server.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Access key"
          autoFocus
          required
          className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <UnlockForm />
    </Suspense>
  );
}
