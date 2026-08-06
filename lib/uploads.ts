import { mkdir } from "fs/promises";
import path from "path";
import { getConfig } from "./config";

export async function getUploadDir(): Promise<string> {
  const config = await getConfig();
  const dir = path.join(config.downloadDir, "uploads");
  await mkdir(dir, { recursive: true });
  return dir;
}
