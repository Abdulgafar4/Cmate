"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TOOLS } from "@/lib/tools";

function UnlockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "loading" | "open" | "locked" | "unlocked"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { required?: boolean; unlocked?: boolean }) => {
        if (cancelled) return;
        if (!data.required) setStatus("open");
        else if (data.unlocked) setStatus("unlocked");
        else setStatus("locked");
      })
      .catch(() => {
        if (!cancelled) setStatus("open");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Invalid access key");
        return;
      }
      const next = searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/tools";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Could not unlock. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="p-16 text-center text-[var(--muted)]">Checking…</main>
    );
  }

  // No ACCESS_KEY configured — tools are already free
  if (status === "open" || status === "unlocked") {
    return (
      <main className="animate-tf-fade relative z-1 mx-auto max-w-[640px] px-5 py-20 text-center md:px-7">
        <p className="m-0 font-mono text-[11px] tracking-wider text-[var(--muted)] uppercase">
          No gate
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4vw,40px)] font-extrabold uppercase tracking-[-0.04em] tf-display-shadow">
          Nothing to unlock
        </h1>
        <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--ink2)]">
          {status === "unlocked"
            ? "You’re already unlocked on this browser. All tools are available."
            : `This ToolFerry instance is open — no access key is set. All ${TOOLS.length} tools are free to use.`}
        </p>
        <p className="mx-auto mt-3 max-w-[48ch] text-[14px] leading-relaxed text-[var(--muted)]">
          An unlock page only appears when the host sets{" "}
          <span className="font-mono text-[12.5px]">ACCESS_KEY</span> to keep a
          private deploy off the public internet. That’s optional admin
          config, not a paid plan.
        </p>
        <Link
          href="/tools"
          className="mt-8 inline-flex h-[46px] items-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-6 text-[14.5px] font-medium text-[var(--paper)]"
        >
          Open tools
        </Link>
      </main>
    );
  }

  return (
    <main className="animate-tf-fade relative z-1 mx-auto max-w-[1240px] px-5 py-16 md:px-7 md:py-[72px]">
      <div className="mx-auto grid max-w-[920px] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <div>
          <p className="m-0 font-mono text-[11px] tracking-wider text-[var(--muted)] uppercase">
            Private instance
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw,40px)] font-extrabold uppercase tracking-[-0.04em] tf-display-shadow">
            This copy is locked
          </h1>
          <p className="mt-3 max-w-[42ch] text-[16px] leading-relaxed text-[var(--ink2)]">
            The person who hosts this ToolFerry set an access key so strangers
            can’t burn bandwidth or disk. Tools are still free — you just need
            their shared key to use{" "}
            <span className="font-medium text-[var(--ink)]">this</span>{" "}
            machine.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-[14px] leading-relaxed text-[var(--ink2)]">
            <li className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              Not a subscription. Not a paid upgrade.
            </li>
            <li className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              Ask the host for the key (same value as{" "}
              <span className="font-mono text-[12.5px]">ACCESS_KEY</span>).
            </li>
            <li className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              After unlock, all {TOOLS.length} tools work in this browser.
            </li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-7 tf-shadow sm:p-8"
        >
          <div className="grid size-[34px] place-items-center rounded-[9px] border-[1.5px] border-[var(--ink)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0" />
            </svg>
          </div>
          <div>
            <h2 className="m-0 font-display text-[24px] font-extrabold uppercase tracking-[-0.035em]">
              Enter host key
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink2)]">
              Stored in this browser only. It never leaves your instance.
            </p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-wider text-[var(--muted)] uppercase">
              Access key
            </span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste the key from your host"
              className="h-[46px] rounded-[11px] border border-[var(--line2)] bg-[var(--paper)] px-3.5 font-mono text-[14px] tracking-wide text-[var(--ink)] outline-none"
              autoComplete="off"
              autoFocus
            />
          </label>
          {error ? (
            <p className="text-[13px] text-[var(--warn)]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="h-[46px] rounded-full border border-[var(--ink)] bg-[var(--ink)] text-[14.5px] font-medium text-[var(--paper)] disabled:opacity-50"
          >
            {loading ? "Unlocking…" : "Unlock this instance"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense
      fallback={
        <main className="p-16 text-center text-[var(--muted)]">Loading…</main>
      }
    >
      <UnlockForm />
    </Suspense>
  );
}
