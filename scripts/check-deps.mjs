#!/usr/bin/env node

import { execFile } from "child_process";
import { constants } from "fs";
import { access, copyFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { appUrl, DEFAULT_PORT } from "./constants.mjs";

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const init = process.argv.includes("--init");

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const dim = (text) => `\x1b[2m${text}\x1b[0m`;

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function commandExists(command) {
  try {
    await execFileAsync("which", [command]);
    return true;
  } catch {
    return false;
  }
}

async function commandVersion(command, args = ["--version"]) {
  try {
    const { stdout } = await execFileAsync(command, args);
    return stdout.split("\n")[0].trim();
  } catch {
    return null;
  }
}

async function ensureEnvFile() {
  const examplePath = path.join(root, ".env.local.example");
  const envPath = path.join(root, ".env.local");

  if (await exists(envPath)) {
    console.log(dim("  .env.local already exists"));
    return;
  }

  if (!(await exists(examplePath))) {
    console.log(yellow("  Skipped .env.local — .env.local.example not found"));
    return;
  }

  await copyFile(examplePath, envPath);
  console.log(green("  Created .env.local from .env.local.example"));
}

async function ensureDownloadDir() {
  const envPath = path.join(root, ".env.local");
  let downloadDir = path.join(root, "downloads");

  if (await exists(envPath)) {
    const envText = await readFile(envPath, "utf8");
    const match = envText.match(/^DOWNLOAD_DIR=(.+)$/m);
    if (match?.[1]) {
      downloadDir = path.isAbsolute(match[1])
        ? match[1]
        : path.join(root, match[1]);
    }
  }

  await mkdir(downloadDir, { recursive: true });
  console.log(green(`  Ready download folder at ${path.relative(root, downloadDir) || "."}`));
}

function printInstallHelp(missing) {
  console.log("");
  console.log(red("Missing required tools:"));
  for (const tool of missing) {
    console.log(`  - ${tool}`);
  }
  console.log("");
  console.log("Install on macOS with Homebrew:");
  console.log(yellow("  brew install yt-dlp ffmpeg"));
  console.log("");
  console.log("Then run setup again:");
  console.log(yellow("  npm run setup"));
  console.log("");
}

async function main() {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const missing = [];

  if (init) {
    console.log("Setting up YC Downloader...\n");
    await ensureEnvFile();
    await ensureDownloadDir();
    console.log("");
  }

  console.log("Checking dependencies...");

  if (nodeMajor < 18) {
    console.log(red(`  Node.js ${process.versions.node} found — need 18+`));
    missing.push("Node.js 18+");
  } else {
    console.log(green(`  Node.js ${process.versions.node}`));
  }

  if (await commandExists("yt-dlp")) {
    const version = await commandVersion("yt-dlp");
    console.log(green(`  yt-dlp ${version ?? "found"}`));
  } else {
    console.log(red("  yt-dlp not found on PATH"));
    missing.push("yt-dlp");
  }

  if (await commandExists("ffmpeg")) {
    const version = await commandVersion("ffmpeg");
    console.log(green(`  ffmpeg ${version ?? "found"}`));
  } else {
    console.log(red("  ffmpeg not found on PATH"));
    missing.push("ffmpeg");
  }

  if (missing.length > 0) {
    printInstallHelp(missing);
    process.exit(1);
  }

  console.log("");
  console.log(green("All set. Start the app with:"));
  console.log(yellow("  npm run dev"));
  console.log("");
  console.log("Then open:");
  console.log(dim(`  ${appUrl(DEFAULT_PORT)}`));
  console.log("");
}

main().catch((error) => {
  console.error(red(error instanceof Error ? error.message : "Setup failed"));
  process.exit(1);
});
