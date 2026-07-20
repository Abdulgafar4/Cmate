"use client";

import { useEffect } from "react";

function isLocalHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export function LauncherHeartbeat() {
  useEffect(() => {
    if (!isLocalHost()) {
      return;
    }

    const ping = () => {
      void fetch("/api/launcher/heartbeat", {
        method: "POST",
        keepalive: true,
      });
    };

    ping();
    const interval = window.setInterval(ping, 3000);

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        navigator.sendBeacon("/api/launcher/heartbeat");
      }
    };

    window.addEventListener("pagehide", ping);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", ping);
      document.removeEventListener("visibilitychange", onHide);
      ping();
    };
  }, []);

  return null;
}
