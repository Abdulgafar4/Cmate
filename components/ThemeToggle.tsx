"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cmate-theme";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function getPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(pref: ThemePreference = getPreference()): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

function applyResolved(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-theme", theme);
}

function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    /* ignore */
  }
  applyResolved(resolveTheme(pref));
  window.dispatchEvent(new Event("cmate-theme-change"));
}

function subscribe(onStoreChange: () => void) {
  const syncFromSystem = () => {
    if (getPreference() === "system") {
      applyResolved(systemTheme());
    }
    onStoreChange();
  };

  window.addEventListener("storage", syncFromSystem);
  window.addEventListener("cmate-theme-change", onStoreChange);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", syncFromSystem);

  return () => {
    window.removeEventListener("storage", syncFromSystem);
    window.removeEventListener("cmate-theme-change", onStoreChange);
    mq.removeEventListener("change", syncFromSystem);
  };
}

function getThemeSnapshot(): ResolvedTheme {
  return resolveTheme();
}

function getServerSnapshot(): ResolvedTheme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot,
  );

  const toggle = () => {
    // Explicit override opposite of what the user currently sees
    setPreference(theme === "dark" ? "light" : "dark");
  };

  const resetToSystem = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreference("system");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onContextMenu={resetToSystem}
      title="Toggle theme (right-click: use system)"
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className="grid size-11 place-items-center rounded-[9px] border border-[var(--line2)] bg-[var(--surface)]"
    >
      <span
        className="block size-[13px] rounded-full border-[1.5px] border-[var(--ink)]"
        style={{
          background: "linear-gradient(90deg, var(--ink) 50%, transparent 50%)",
        }}
      />
    </button>
  );
}
