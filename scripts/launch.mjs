#!/usr/bin/env node

import { execFile, spawn } from "child_process";
import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { appUrl, DEFAULT_PORT } from "./constants.mjs";

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateDir = path.join(root, ".yc-downloader");
const pidFile = path.join(stateDir, "server.pid");
const logFile = path.join(stateDir, "dev.log");
const port = Number(process.env.PORT ?? DEFAULT_PORT);
const downloadUrl = appUrl(port);

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

async function startServer() {
  await mkdir(stateDir, { recursive: true });
  const logStream = createWriteStream(logFile, { flags: "a" });
  logStream.write(`\n--- started ${new Date().toISOString()} ---\n`);

  const proc = spawn("npm", ["run", "dev"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(port) },
  });

  proc.stdout?.pipe(logStream);
  proc.stderr?.pipe(logStream);
  proc.unref();

  await writeFile(pidFile, String(proc.pid));
  return proc.pid;
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

  await execFileAsync("xdg-open", [appUrl]).catch(() => {
    log(`Open this URL in your browser:\n  ${downloadUrl}`);
  });
}

async function notifyStarted() {
  if (process.platform !== "darwin") {
    return;
  }

  const script = `display notification "YC Downloader is ready in your browser." with title "YC Downloader"`;
  await execFileAsync("osascript", ["-e", script]).catch(() => {});
}

async function main() {
  if (!existsSync(path.join(root, "node_modules"))) {
    log("Installing dependencies first...");
    await new Promise((resolve, reject) => {
      const proc = spawn("npm", ["install"], { cwd: root, stdio: "inherit" });
      proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("npm install failed"))));
    });
  }

  await runDepCheck();

  if (await isServerUp()) {
    log("YC Downloader is already running.");
    await openBrowser();
    await notifyStarted();
    return;
  }

  if (existsSync(pidFile)) {
    try {
      const oldPid = Number(await readFile(pidFile, "utf8"));
      if (oldPid) {
        process.kill(oldPid, 0);
      }
    } catch {
      // Stale pid file — continue starting a fresh server.
    }
  }

  log("Starting YC Downloader...");
  await startServer();

  const ready = await waitForServer();
  if (!ready) {
    throw new Error(
      `Server did not start in time. Check ${path.relative(root, logFile)} for logs.`,
    );
  }

  await openBrowser();
  await notifyStarted();

  log("");
  log("YC Downloader is running.");
  log(`  ${downloadUrl}`);
  log("");
  log("To stop it later, run:");
  log("  npm run stop");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to launch");
  process.exit(1);
});
