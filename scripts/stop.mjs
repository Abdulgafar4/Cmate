#!/usr/bin/env node

import { execFile } from "child_process";
import { existsSync } from "fs";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { DEFAULT_PORT } from "./constants.mjs";

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pidFile = path.join(root, ".yc-downloader", "server.pid");
const nextDevLock = path.join(root, ".next", "dev", "lock");
const port = Number(process.env.PORT ?? DEFAULT_PORT);

const ports = [port, 3000];

async function killPort(targetPort) {
  if (process.platform === "win32") {
    return;
  }

  try {
    const { stdout } = await execFileAsync("lsof", [
      `-ti:${targetPort}`,
      "-sTCP:LISTEN",
    ]);
    const pids = stdout
      .trim()
      .split("\n")
      .map((value) => Number(value))
      .filter(Boolean);

    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // Nothing listening on the port.
  }
}

async function killAllPorts() {
  for (const targetPort of ports) {
    await killPort(targetPort);
  }
}

async function main() {
  if (existsSync(pidFile)) {
    const pid = Number(await readFile(pidFile, "utf8"));
    if (pid) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // Process may already be gone.
      }
    }
    await unlink(pidFile).catch(() => {});
  }

  await killAllPorts();

  if (existsSync(nextDevLock)) {
    await unlink(nextDevLock).catch(() => {});
  }

  console.log("YC Downloader stopped.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to stop");
  process.exit(1);
});
