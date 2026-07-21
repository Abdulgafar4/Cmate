#!/usr/bin/env node

import { execFile, spawn } from "child_process";
import { existsSync } from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { appUrl, DEFAULT_PORT } from "./constants.mjs";

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? DEFAULT_PORT);
const downloadUrl = appUrl(port);
const statusUrl = `http://127.0.0.1:${port}/api/launcher/status`;
const IDLE_AFTER_CLOSE_MS = 12_000;
const POLL_MS = 2_000;

function log(message) {
  console.log(message);
}

async function runDepCheck() {
  await new Promise((resolve, reject) => {
    const proc = spawn("node", ["scripts/check-deps.mjs"], {
      cwd: root,
      stdio: "inherit",
    });
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("Dependency check failed"));
      }
    });
  });
}

function isServerUp() {
  return new Promise((resolve) => {
    const request = http.get(downloadUrl, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isServerUp()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function fetchLauncherStatus() {
  return new Promise((resolve) => {
    const request = http.get(statusUrl, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ lastHeartbeat: 0, alive: false });
        }
      });
    });
    request.on("error", () => resolve({ lastHeartbeat: 0, alive: false }));
    request.setTimeout(1500, () => {
      request.destroy();
      resolve({ lastHeartbeat: 0, alive: false });
    });
  });
}

async function openBrowser() {
  if (process.platform === "darwin") {
    await execFileAsync("open", [downloadUrl]);
    return;
  }

  if (process.platform === "win32") {
    await execFileAsync("cmd", ["/c", "start", "", downloadUrl]);
    return;
  }

  await execFileAsync("xdg-open", [downloadUrl]).catch(() => {
    log(`Open this URL in your browser:\n  ${downloadUrl}`);
  });
}

function isPortInUse() {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function main() {
  if (!existsSync(path.join(root, "node_modules"))) {
    log("Installing dependencies first...");
    await new Promise((resolve, reject) => {
      const proc = spawn("npm", ["install"], { cwd: root, stdio: "inherit" });
      proc.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error("npm install failed")),
      );
    });
  }

  await runDepCheck();

  if (await isPortInUse()) {
    throw new Error(
      `Port ${port} is already in use. Run "npm run stop" and try again.`,
    );
  }

  log("Starting Cmate...");
  const child = spawn("npm", ["run", "dev"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PORT: String(port) },
  });

  const stopChild = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  };

  process.on("SIGINT", () => {
    stopChild();
    process.exit(0);
  });
  process.on("SIGTERM", stopChild);

  const ready = await waitForServer();
  if (!ready) {
    stopChild();
    throw new Error("Server did not start in time.");
  }

  await openBrowser();
  log("");
  log(`Cmate is open at ${downloadUrl}`);
  log("Close the browser tab or window to stop the app.");
  log("");

  let sawHeartbeat = false;

  await new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (child.exitCode !== null) {
        clearInterval(interval);
        resolve();
        return;
      }

      const status = await fetchLauncherStatus();
      if (status.lastHeartbeat > 0) {
        sawHeartbeat = true;
      }

      if (
        sawHeartbeat &&
        Date.now() - status.lastHeartbeat >= IDLE_AFTER_CLOSE_MS
      ) {
        clearInterval(interval);
        log("Browser closed. Stopping Cmate...");
        stopChild();
        resolve();
      }
    }, POLL_MS);

    child.on("exit", () => {
      clearInterval(interval);
      resolve();
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to launch");
  process.exit(1);
});
