#!/usr/bin/env node

import { chmod, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktopDir = path.join(os.homedir(), "Desktop");
const launcherName = "YC Downloader.command";
const launcherPath = path.join(desktopDir, launcherName);

const nodePath = process.execPath;

const contents = `#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd ${JSON.stringify(root)}
exec ${JSON.stringify(nodePath)} scripts/launch-foreground.mjs
`;

async function main() {
  await writeFile(launcherPath, contents, { mode: 0o755 });
  await chmod(launcherPath, 0o755);

  console.log("Desktop launcher created:");
  console.log(`  ${launcherPath}`);
  console.log("");
  console.log("Double-click it to open YC Downloader in your browser.");
  console.log("The server stops when you close the browser tab.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to install launcher");
  process.exit(1);
});
