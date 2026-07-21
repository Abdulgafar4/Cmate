function filenameFromDisposition(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }

  const basic = header.match(/filename="([^"]+)"/i);
  return basic?.[1];
}

async function saveWithAnchor(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function openFileUrl(url: string): void {
  if (!window.open(url, "_blank", "noopener")) {
    window.location.assign(url);
  }
}

export async function saveFileFromUrl(
  url: string,
  fallbackName: string,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `Save failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Response was not JSON.
    }
    throw new Error(message);
  }

  const fileName =
    filenameFromDisposition(response.headers.get("Content-Disposition")) ??
    fallbackName;
  const blob = await response.blob();

  if ("showSaveFilePicker" in window) {
    try {
      const extension = fileName.includes(".")
        ? `.${fileName.split(".").pop()}`
        : ".mp4";
      const handle = await (
        window as Window & {
          showSaveFilePicker: (options: {
            suggestedName: string;
            types: Array<{
              description: string;
              accept: Record<string, string[]>;
            }>;
          }) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Media file",
            accept: {
              [blob.type || "application/octet-stream"]: [extension],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return handle.name;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  try {
    await saveWithAnchor(blob, fileName);
  } catch (error) {
    if (isMobileDevice()) {
      openFileUrl(url);
      return fileName;
    }
    throw error;
  }

  return fileName;
}
