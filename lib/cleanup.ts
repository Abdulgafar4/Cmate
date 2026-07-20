import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { getConfig } from "./config";

export async function ensureDownloadDir(): Promise<void> {
  const config = await getConfig();
  const { mkdir } = await import("fs/promises");
  await mkdir(config.downloadDir, { recursive: true });
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // File may already be removed.
  }
}

export async function cleanupExpiredFiles(): Promise<void> {
  const config = await getConfig();

  try {
    const entries = await readdir(config.downloadDir);
    const now = Date.now();

    await Promise.all(
      entries.map(async (entry) => {
        const filePath = path.join(config.downloadDir, entry);
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
          return;
        }
        if (now - fileStat.mtimeMs > config.fileTtlMs) {
          await deleteFile(filePath);
        }
      }),
    );
  } catch {
    // Directory may not exist yet.
  }
}

export async function findJobOutputFile(
  outputDir: string,
  jobId: string,
): Promise<string> {
  const entries = await readdir(outputDir);
  const candidates = entries.filter(
    (entry) => entry.startsWith(jobId) && !/\.f\d+\./.test(entry),
  );

  if (candidates.length === 0) {
    throw new Error("Merged output file was not found after download");
  }

  const files = await Promise.all(
    candidates.map(async (entry) => {
      const filePath = path.join(outputDir, entry);
      const fileStat = await stat(filePath);
      return { filePath, size: fileStat.size };
    }),
  );

  files.sort((a, b) => b.size - a.size);
  return files[0].filePath;
}

export async function deleteJobArtifacts(
  outputDir: string,
  jobId: string,
  keepFilePath?: string,
): Promise<void> {
  const entries = await readdir(outputDir);

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(jobId))
      .map(async (entry) => {
        const filePath = path.join(outputDir, entry);
        if (keepFilePath && filePath === keepFilePath) {
          return;
        }
        await deleteFile(filePath);
      }),
  );
}
