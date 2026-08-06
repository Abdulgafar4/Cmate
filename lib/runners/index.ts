import { spawn } from "child_process";
import { copyFile, readFile, writeFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";
import { createHash } from "crypto";
import { getConfig } from "../config";

export type RunResult = {
  outputPath?: string;
  fileName?: string;
  resultText?: string;
};

export type RunContext = {
  toolSlug: string;
  jobId: string;
  options: Record<string, string>;
  inputPaths: string[];
  textInput?: string;
  outputDir: string;
  onProgress: (pct: number) => void;
};

function opt(ctx: RunContext, key: string, fallback: string): string {
  return ctx.options[key] || fallback;
}

async function loadPdf(bytes: Buffer | Uint8Array) {
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

/** Parse "1-3, 7, 12-end" into 0-based page index groups. */
function parsePageRanges(spec: string, pageCount: number): number[][] {
  const cleaned = spec.trim();
  if (!cleaned) return [];
  const groups: number[][] = [];
  for (const part of cleaned.split(",")) {
    const token = part.trim().toLowerCase();
    if (!token) continue;
    if (token.includes("-")) {
      const [aRaw, bRaw] = token.split("-").map((s) => s.trim());
      const start = Math.max(1, Number(aRaw) || 1);
      const end =
        bRaw === "end" || bRaw === ""
          ? pageCount
          : Math.min(pageCount, Number(bRaw) || pageCount);
      if (start > end || start > pageCount) continue;
      const indices: number[] = [];
      for (let p = start; p <= end; p++) indices.push(p - 1);
      if (indices.length) groups.push(indices);
    } else {
      const n = Number(token);
      if (!Number.isFinite(n) || n < 1 || n > pageCount) continue;
      groups.push([n - 1]);
    }
  }
  return groups;
}

async function pdfBytesFromPages(
  source: PDFDocument,
  indices: number[],
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(source, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

async function writePdfZip(
  entries: Array<{ name: string; bytes: Uint8Array }>,
  output: string,
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, entry.bytes);
  }
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(output, buf);
}

async function runFfmpeg(
  args: string[],
  onProgress?: (pct: number) => void,
): Promise<void> {
  const config = await getConfig();
  onProgress?.(10);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(config.ffmpegPath, ["-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let err = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      err += chunk.toString();
      onProgress?.(Math.min(90, 10 + err.length / 2000));
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-400) || `ffmpeg exited ${code}`));
    });
  });
  onProgress?.(95);
}

function outPath(ctx: RunContext, ext: string): string {
  return path.join(ctx.outputDir, `${ctx.jobId}.${ext}`);
}

function requireInputs(ctx: RunContext, min = 1): string[] {
  if (ctx.inputPaths.length < min) {
    throw new Error(`This tool needs at least ${min} file(s)`);
  }
  return ctx.inputPaths;
}

async function runMedia(ctx: RunContext): Promise<RunResult> {
  const inputs = requireInputs(ctx);
  const input = inputs[0];

  switch (ctx.toolSlug) {
    case "video-convert": {
      const target = opt(ctx, "Target format", "MP4 (H.264)");
      let ext = "mp4";
      const args = ["-i", input];
      if (target.includes("H.265")) {
        args.push("-c:v", "libx265", "-crf", "28", "-c:a", "aac");
      } else if (target.includes("VP9")) {
        ext = "webm";
        args.push("-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-c:a", "libopus");
      } else if (target.includes("copy")) {
        ext = "mkv";
        args.push("-c", "copy");
      } else {
        const quality = opt(ctx, "Quality preset", "Balanced");
        const crf =
          quality === "Visually lossless"
            ? "18"
            : quality === "High"
              ? "20"
              : quality === "Small file"
                ? "28"
                : "23";
        args.push("-c:v", "libx264", "-crf", crf, "-preset", "medium");
        const audio = opt(ctx, "Audio", "Copy");
        if (audio === "Remove") args.push("-an");
        else if (audio === "AAC 192") args.push("-c:a", "aac", "-b:a", "192k");
        else args.push("-c:a", "aac", "-b:a", "160k");
      }
      const output = outPath(ctx, ext);
      args.push(output);
      await runFfmpeg(args, ctx.onProgress);
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "audio-convert": {
      const target = opt(ctx, "Target", "MP3 320");
      let ext = "mp3";
      const args = ["-i", input];
      if (target.startsWith("Opus")) {
        ext = "opus";
        args.push("-c:a", "libopus", "-b:a", "128k");
      } else if (target.startsWith("AAC")) {
        ext = "m4a";
        args.push("-c:a", "aac", "-b:a", "256k");
      } else if (target === "FLAC") {
        ext = "flac";
        args.push("-c:a", "flac");
      } else {
        args.push("-c:a", "libmp3lame", "-b:a", "320k");
      }
      const output = outPath(ctx, ext);
      args.push(output);
      await runFfmpeg(args, ctx.onProgress);
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "compress-video": {
      const target = opt(ctx, "Target", "100 MB");
      const crf =
        target === "25 MB" ? "32" : target === "500 MB" ? "20" : "28";
      const output = outPath(ctx, "mp4");
      await runFfmpeg(
        [
          "-i",
          input,
          "-c:v",
          "libx264",
          "-crf",
          crf,
          "-preset",
          "medium",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          output,
        ],
        ctx.onProgress,
      );
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "extract-audio": {
      const format = opt(ctx, "Format", "MP3").toLowerCase();
      const ext = format === "m4a" ? "m4a" : format === "wav" ? "wav" : "mp3";
      const output = outPath(ctx, ext);
      const args = ["-i", input, "-vn", "-map", "0:a:0?"];
      if (ext === "mp3") args.push("-c:a", "libmp3lame", "-b:a", "192k");
      else if (ext === "m4a") args.push("-c:a", "aac", "-b:a", "192k");
      else args.push("-c:a", "pcm_s16le");
      if (opt(ctx, "Channels", "Stereo") === "Mono") args.push("-ac", "1");
      args.push(output);
      try {
        await runFfmpeg(args, ctx.onProgress);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/does not contain any stream|Stream map|Output file does not contain/i.test(msg)) {
          throw new Error("This file has no audio track to extract");
        }
        throw err;
      }
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "mute": {
      const output = outPath(ctx, "mp4");
      await runFfmpeg(
        ["-i", input, "-c", "copy", "-an", output],
        ctx.onProgress,
      );
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "resfps": {
      const res = opt(ctx, "Resolution", "1080p");
      const height =
        res === "2160p"
          ? 2160
          : res === "720p"
            ? 720
            : res === "480p"
              ? 480
              : 1080;
      const fps = opt(ctx, "Frame rate", "Keep");
      const output = outPath(ctx, "mp4");
      const args = [
        "-i",
        input,
        "-vf",
        `scale=-2:${height}`,
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-c:a",
        "aac",
      ];
      if (fps !== "Keep") args.push("-r", fps);
      args.push(output);
      await runFfmpeg(args, ctx.onProgress);
      return { outputPath: output, fileName: path.basename(output) };
    }
    case "trim":
    case "gif": {
      // Without real timeline UI values, process whole file / short gif
      if (ctx.toolSlug === "gif") {
        const fps = opt(ctx, "Frame rate", "12 fps").replace(/[^\d]/g, "") || "12";
        const width = opt(ctx, "Width", "480");
        const output = outPath(ctx, "gif");
        await runFfmpeg(
          [
            "-i",
            input,
            "-t",
            "8",
            "-vf",
            `fps=${fps},scale=${width}:-1:flags=lanczos`,
            output,
          ],
          ctx.onProgress,
        );
        return { outputPath: output, fileName: path.basename(output) };
      }
      const output = outPath(ctx, "mp4");
      const mode = opt(ctx, "Cut mode", "Fast (keyframe)");
      if (mode.startsWith("Fast")) {
        await runFfmpeg(
          ["-i", input, "-c", "copy", "-t", "30", output],
          ctx.onProgress,
        );
      } else {
        await runFfmpeg(
          [
            "-i",
            input,
            "-t",
            "30",
            "-c:v",
            "libx264",
            "-crf",
            "20",
            "-c:a",
            "aac",
            output,
          ],
          ctx.onProgress,
        );
      }
      return { outputPath: output, fileName: path.basename(output) };
    }
    default:
      throw new Error(`Unsupported media tool: ${ctx.toolSlug}`);
  }
}

function imageTargetExt(label: string): string {
  const t = label.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("avif")) return "avif";
  if (t.includes("jpg") || t.includes("jpeg")) return "jpg";
  return "webp";
}

async function convertWithImageScript(
  input: string,
  output: string,
  quality: number,
): Promise<void> {
  const { Image } = await import("imagescript");
  const img = await Image.decode(await readFile(input));
  const ext = path.extname(output).toLowerCase();
  let encoded: Uint8Array;
  if (ext === ".jpg" || ext === ".jpeg") {
    encoded = await img.encodeJPEG(quality as 1);
  } else if (ext === ".webp") {
    encoded = await img.encodeWEBP(quality as 1);
  } else if (ext === ".png") {
    encoded = await img.encode();
  } else if (ext === ".avif") {
    // imagescript has no AVIF encoder — fall back to high-quality WebP sibling name? No: use ffmpeg or PNG.
    throw new Error(
      "AVIF encoding needs ffmpeg with libaom. Choose PNG, JPG, or WebP.",
    );
  } else {
    encoded = await img.encodeWEBP(quality as 1);
  }
  await writeFile(output, Buffer.from(encoded));
}

async function runImage(ctx: RunContext): Promise<RunResult> {
  const inputs = requireInputs(ctx);
  ctx.onProgress(20);

  if (ctx.toolSlug === "image-convert") {
    const target = imageTargetExt(opt(ctx, "Target format", "WebP"));
    const qualityRaw = opt(ctx, "Quality", "75");
    const quality =
      qualityRaw === "Lossless" ? 100 : Number(qualityRaw) || 75;

    if (inputs.length === 1) {
      const output = outPath(ctx, target);
      await convertWithImageScript(inputs[0], output, quality);
      ctx.onProgress(100);
      return { outputPath: output, fileName: path.basename(output) };
    }

    const outputs: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const output = path.join(ctx.outputDir, `${ctx.jobId}-${i}.${target}`);
      await convertWithImageScript(inputs[i], output, quality);
      outputs.push(output);
      ctx.onProgress(20 + (70 * (i + 1)) / inputs.length);
    }
    return {
      outputPath: outputs[0],
      fileName: path.basename(outputs[0]),
      resultText: `Converted ${outputs.length} images`,
    };
  }

  if (ctx.toolSlug === "image-resize") {
    const longEdge = Number(opt(ctx, "Long edge", "1200")) || 1200;
    const qLabel = opt(ctx, "Quality", "Balanced");
    const quality =
      qLabel === "Lossless"
        ? 100
        : qLabel === "High"
          ? 90
          : qLabel === "Small"
            ? 60
            : 75;
    const { Image } = await import("imagescript");
    const img = await Image.decode(await readFile(inputs[0]));
    const scale = Math.min(1, longEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    img.resize(w, h);
    const output = outPath(ctx, "jpg");
    await writeFile(output, Buffer.from(await img.encodeJPEG(quality as 1)));
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  throw new Error(`Unsupported image tool: ${ctx.toolSlug}`);
}

async function runPdf(ctx: RunContext): Promise<RunResult> {
  const inputs = requireInputs(ctx);
  ctx.onProgress(15);

  if (ctx.toolSlug === "pdf-merge") {
    const merged = await PDFDocument.create();
    for (const file of inputs) {
      const bytes = await readFile(file);
      const doc = await loadPdf(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
      ctx.onProgress(15 + (70 * inputs.indexOf(file)) / inputs.length);
    }
    const output = outPath(ctx, "pdf");
    await writeFile(output, await merged.save());
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  if (ctx.toolSlug === "pdf-images" || ctx.toolSlug === "images-pdf") {
    const direction = opt(ctx, "Direction", "Images → PDF");
    if (
      ctx.toolSlug === "images-pdf" ||
      direction === "Images → PDF" ||
      inputs.every((f) => /\.(png|jpe?g|webp|heic)$/i.test(f))
    ) {
      const pdf = await PDFDocument.create();
      for (const file of inputs) {
        const imgBytes = await readFile(file);
        const isPng = /\.png$/i.test(file);
        let image;
        try {
          image = isPng
            ? await pdf.embedPng(imgBytes)
            : await pdf.embedJpg(imgBytes);
        } catch {
          // Fallback: re-encode via imagescript to PNG that pdf-lib accepts
          const { Image } = await import("imagescript");
          const decoded = await Image.decode(imgBytes);
          const pngBytes = await decoded.encode();
          image = await pdf.embedPng(pngBytes);
        }
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      const output = outPath(ctx, "pdf");
      await writeFile(output, await pdf.save());
      ctx.onProgress(100);
      return { outputPath: output, fileName: path.basename(output) };
    }
    throw new Error(
      "PDF → images needs pdftoppm on the host. Drop images to build a PDF instead.",
    );
  }

  const bytes = await readFile(inputs[0]);
  const doc = await loadPdf(bytes);

  if (ctx.toolSlug === "pdf-split") {
    const pageCount = doc.getPageCount();
    if (pageCount < 1) throw new Error("PDF has no pages");

    const mode = opt(ctx, "Mode", "Every page");
    const asZip =
      opt(ctx, "Output", "One ZIP") === "One ZIP" ||
      opt(ctx, "Output", "One ZIP").toLowerCase().includes("zip");

    let groups: number[][] = [];

    if (mode === "Every page") {
      groups = Array.from({ length: pageCount }, (_, i) => [i]);
    } else if (mode === "Every N pages") {
      const n = Math.max(1, Number(opt(ctx, "Chunk size", "2")) || 2);
      for (let i = 0; i < pageCount; i += n) {
        const chunk: number[] = [];
        for (let j = i; j < Math.min(pageCount, i + n); j++) chunk.push(j);
        groups.push(chunk);
      }
    } else {
      // Ranges — from options.Ranges / Pages / textInput
      const spec =
        ctx.options.Ranges ||
        ctx.options.Pages ||
        ctx.options.ranges ||
        ctx.textInput ||
        "";
      groups = parsePageRanges(spec, pageCount);
      if (groups.length === 0) {
        throw new Error(
          'Enter page ranges like "1-3, 7, 12-end" (pages are 1-based).',
        );
      }
    }

    const parts: Array<{ name: string; bytes: Uint8Array }> = [];
    for (let i = 0; i < groups.length; i++) {
      const indices = groups[i];
      const partBytes = await pdfBytesFromPages(doc, indices);
      const start = indices[0] + 1;
      const end = indices[indices.length - 1] + 1;
      const name =
        start === end
          ? `page-${start}.pdf`
          : `pages-${start}-${end}.pdf`;
      parts.push({ name, bytes: partBytes });
      ctx.onProgress(15 + (80 * (i + 1)) / groups.length);
    }

    if (parts.length === 1 && !asZip) {
      const output = outPath(ctx, "pdf");
      await writeFile(output, parts[0].bytes);
      ctx.onProgress(100);
      return {
        outputPath: output,
        fileName: parts[0].name,
        resultText: `Exported ${parts[0].name}`,
      };
    }

    // Multiple parts — always ZIP so the download API can return one file
    const output = outPath(ctx, "zip");
    await writePdfZip(parts, output);
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: `${path.parse(inputs[0]).name || "split"}.zip`,
      resultText: `Split into ${parts.length} PDF${parts.length === 1 ? "" : "s"}`,
    };
  }

  if (ctx.toolSlug === "pdf-rotate") {
    const rot = opt(ctx, "Rotate", "90° CW");
    const angle =
      rot === "180°" ? 180 : rot === "90° CCW" ? 270 : 90;
    doc.getPages().forEach((p) => p.setRotation(degrees(angle)));
    const output = outPath(ctx, "pdf");
    await writeFile(output, await doc.save());
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  if (ctx.toolSlug === "pdf-watermark") {
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const opacity =
      opt(ctx, "Opacity", "25%") === "10%"
        ? 0.1
        : opt(ctx, "Opacity", "25%") === "50%"
          ? 0.5
          : 0.25;
    const text = opt(ctx, "Text", "ToolFerry") || "ToolFerry";
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      page.drawText(text.slice(0, 40), {
        x: width * 0.2,
        y: height * 0.45,
        size: 48,
        font,
        color: rgb(0.4, 0.4, 0.4),
        opacity,
        rotate: degrees(-30),
      });
    }
    const output = outPath(ctx, "pdf");
    await writeFile(output, await doc.save());
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  if (ctx.toolSlug === "pdf-protect" || ctx.toolSlug === "pdf-compress") {
    const output = outPath(ctx, "pdf");
    await writeFile(output, await doc.save({ useObjectStreams: true }));
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText:
        ctx.toolSlug === "pdf-protect"
          ? "Saved a remuxed PDF. Full password protect needs qpdf on the host."
          : "Remuxed PDF (light compress). Deeper compression needs ghostscript.",
    };
  }

  throw new Error(`Unsupported PDF tool: ${ctx.toolSlug}`);
}

async function runUtil(ctx: RunContext): Promise<RunResult> {
  ctx.onProgress(20);

  if (ctx.toolSlug === "qr") {
    const text = (ctx.textInput || "").trim();
    if (!text) throw new Error("Enter text or a URL for the QR code");
    const size = Number(ctx.options["Size"] || ctx.options.size || 1024) || 1024;
    const output = outPath(ctx, "png");
    await QRCode.toFile(output, text, {
      width: size,
      errorCorrectionLevel: (opt(ctx, "Error correction", "M").charAt(0) ||
        "M") as "L" | "M" | "Q" | "H",
      margin: 2,
    });
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  if (ctx.toolSlug === "hash") {
    const algoName = opt(ctx, "Algorithm", "SHA-256")
      .toLowerCase()
      .replace("-", "");
    const algo =
      algoName === "md5"
        ? "md5"
        : algoName === "sha1"
          ? "sha1"
          : algoName === "sha512"
            ? "sha512"
            : "sha256";
    const hash = createHash(algo);
    if (ctx.inputPaths[0]) {
      hash.update(await readFile(ctx.inputPaths[0]));
    } else {
      hash.update(ctx.textInput || "");
    }
    let digest = hash.digest("hex");
    if (opt(ctx, "Case", "lower") === "UPPER") digest = digest.toUpperCase();
    ctx.onProgress(100);
    const output = outPath(ctx, "txt");
    await writeFile(output, digest + "\n");
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText: digest,
    };
  }

  if (ctx.toolSlug === "base64") {
    const direction = opt(ctx, "Direction", "Encode");
    let result: string;
    if (direction === "Decode") {
      const raw = ctx.textInput || "";
      result = Buffer.from(raw, "base64").toString("utf8");
    } else {
      const buf = ctx.inputPaths[0]
        ? await readFile(ctx.inputPaths[0])
        : Buffer.from(ctx.textInput || "", "utf8");
      result = buf.toString("base64");
      const wrap = opt(ctx, "Wrap", "None");
      if (wrap === "Data URI") {
        result = `data:application/octet-stream;base64,${result}`;
      } else if (wrap === "76 cols") {
        result = result.replace(/.{76}/g, (m) => m + "\n");
      }
    }
    const output = outPath(ctx, "txt");
    await writeFile(output, result);
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText: result.slice(0, 2000),
    };
  }

  if (ctx.toolSlug === "jsonyaml") {
    const action = opt(ctx, "Action", "Format");
    const raw = (ctx.textInput || "").trim();
    if (!raw) throw new Error("Paste JSON or YAML text");
    let result = raw;
    if (action === "Format" || action === "Minify") {
      const parsed = JSON.parse(raw);
      result =
        action === "Minify"
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, Number(opt(ctx, "Indent", "2")) || 2);
    } else {
      result =
        "YAML conversion needs a YAML parser on the host. Formatted JSON:\n" +
        JSON.stringify(JSON.parse(raw), null, 2);
    }
    const output = outPath(ctx, "txt");
    await writeFile(output, result);
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText: result.slice(0, 4000),
    };
  }

  if (ctx.toolSlug === "regex") {
    const pattern = ctx.options.pattern || ctx.options.Pattern || "";
    const flags = [
      ctx.options.g === "1" || opt(ctx, "Flags", "g").includes("g") ? "g" : "",
      opt(ctx, "Flags", "").includes("i") ? "i" : "",
      opt(ctx, "Flags", "").includes("m") ? "m" : "",
      opt(ctx, "Flags", "").includes("s") ? "s" : "",
    ].join("");
    const text = ctx.textInput || "";
    if (!pattern) throw new Error("Provide a regex pattern in options.pattern");
    const re = new RegExp(pattern, flags || "g");
    const matches = [...text.matchAll(re)].map((m) => m[0]);
    const result = matches.length
      ? matches.join("\n")
      : "(no matches)";
    const output = outPath(ctx, "txt");
    await writeFile(output, result);
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText: result.slice(0, 4000),
    };
  }

  if (ctx.toolSlug === "metadata") {
    const inputs = requireInputs(ctx);
    const ext = path.extname(inputs[0]).slice(1) || "bin";
    const output = outPath(ctx, ext);
    if (/\.(jpe?g|png|webp|avif|gif|mp4|mov|mkv|webm|mp3|m4a)$/i.test(inputs[0])) {
      await runFfmpeg(
        ["-i", inputs[0], "-map_metadata", "-1", "-c", "copy", output],
        ctx.onProgress,
      );
    } else {
      await copyFile(inputs[0], output);
    }
    ctx.onProgress(100);
    return {
      outputPath: output,
      fileName: path.basename(output),
      resultText: "Metadata stripped where ffmpeg supports the format.",
    };
  }

  throw new Error(`Unsupported utility: ${ctx.toolSlug}`);
}

async function runDocs(ctx: RunContext): Promise<RunResult> {
  // LibreOffice not assumed — provide honest fallback for text→pdf via pdf-lib
  if (ctx.toolSlug === "txt-pdf" || ctx.toolSlug === "markdown") {
    const text =
      ctx.textInput ||
      (ctx.inputPaths[0]
        ? (await readFile(ctx.inputPaths[0])).toString("utf8")
        : "");
    if (!text.trim()) throw new Error("Provide text or a .txt/.md file");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Courier);
    const pageSize = opt(ctx, "Page size", "A4") === "Letter" ? [612, 792] : [595, 842];
    let page = pdf.addPage([pageSize[0], pageSize[1]]);
    const fontSize = Number(opt(ctx, "Size", "12pt").replace(/\D/g, "")) || 12;
    const margin = 48;
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    let y = pageSize[1] - margin;
    for (const line of lines) {
      if (y < margin) {
        page = pdf.addPage([pageSize[0], pageSize[1]]);
        y = pageSize[1] - margin;
      }
      page.drawText(line.slice(0, 110), {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= fontSize * 1.4;
    }
    const output = outPath(ctx, "pdf");
    await writeFile(output, await pdf.save());
    ctx.onProgress(100);
    return { outputPath: output, fileName: path.basename(output) };
  }

  throw new Error(
    "DOCX ↔ PDF needs LibreOffice (`soffice`) on the host. Use TXT/Markdown → PDF for now.",
  );
}

export async function runTool(ctx: RunContext): Promise<RunResult> {
  const slug = ctx.toolSlug;
  ctx.onProgress(5);

  const media = new Set([
    "video-convert",
    "audio-convert",
    "compress-video",
    "extract-audio",
    "trim",
    "gif",
    "mute",
    "resfps",
  ]);
  const images = new Set(["image-convert", "image-resize"]);
  const pdfs = new Set([
    "pdf-merge",
    "pdf-split",
    "pdf-compress",
    "pdf-images",
    "pdf-rotate",
    "pdf-watermark",
    "pdf-protect",
    "images-pdf",
  ]);
  const utils = new Set([
    "qr",
    "hash",
    "base64",
    "jsonyaml",
    "regex",
    "metadata",
  ]);
  const docs = new Set([
    "docx-pdf",
    "pdf-docx",
    "markdown",
    "txt-pdf",
  ]);

  if (media.has(slug)) return runMedia(ctx);
  if (images.has(slug)) return runImage(ctx);
  if (pdfs.has(slug)) return runPdf(ctx);
  if (utils.has(slug)) return runUtil(ctx);
  if (docs.has(slug)) return runDocs(ctx);

  throw new Error(`No runner for tool: ${slug}`);
}
