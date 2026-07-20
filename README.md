# YC Downloader

Local-first YouTube downloader built with Next.js, yt-dlp, and FFmpeg. Paste a public video link, pick a quality, and save the file to your device.

## Quick start

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:9090/download](http://localhost:9090/download) to start downloading.

## One-click launch (macOS)

After setup, pick one of these:

### Option A — Desktop launcher

Install a one-click launcher on your Desktop:

```bash
npm run desktop
```

Then double-click **`YC Downloader`** on your Desktop. It opens the browser and stops when you close the tab.

You can run `npm run desktop` again anytime to refresh the launcher if you move the project folder.

### Option B — Project folder

Double-click **`YC Downloader.command`** in the project folder. It starts the server, opens your browser, and **stops automatically when you close the browser tab**.

You can drag that file to your Dock for quick access.

### Option C — Mac app icon

Create a clickable app in `dist/`:

```bash
npm run app:mac
```

Then open **`dist/YC Downloader.app`**. Drag it to your Dock or Applications folder.

The app must stay linked to this project folder. If macOS warns about an unidentified developer, right-click the app → **Open**.

### Option D — Terminal

```bash
npm run open
```

To stop the background server:

```bash
npm run stop
```

### First-time tool install (macOS)

If setup reports missing tools:

```bash
brew install yt-dlp ffmpeg
```

Then run `npm run setup` again.

### Requirements

- **Node.js** 18+
- **yt-dlp** on your PATH
- **FFmpeg** on your PATH

Optional: copy `.env.local.example` to `.env.local` manually if you want to customize paths or performance settings. Setup does this for you on first run.

## Deploy on Railway

YC Downloader can run on Railway as a long-lived Docker service (not serverless).

### 1. Push this repo to GitHub

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select this repository
3. Railway will build with the included `Dockerfile`

### 3. Attach a volume

1. Open the service → **Settings** → **Volumes**
2. Add a volume mounted at `/data`
3. Set env `DOWNLOAD_DIR=/data/downloads`

Without a volume, downloaded files are lost on every redeploy.

### 4. Set environment variables

| Variable | Required | Example |
| -------- | -------- | ------- |
| `ACCESS_KEY` | Strongly recommended | a long random secret |
| `DOWNLOAD_DIR` | Yes with volume | `/data/downloads` |
| `NEXT_PUBLIC_APP_URL` | Recommended | `https://your-app.up.railway.app` |
| `MAX_CONCURRENT_JOBS` | Optional | `1` or `2` |
| `FILE_TTL_MS` | Optional | `3600000` (1 hour) |

When `ACCESS_KEY` is set, visitors must unlock at `/unlock` before using the app.

### 5. Generate a public domain

Service → **Settings** → **Networking** → **Generate Domain**

### 6. Deploy

Railway builds and starts automatically. Health check: `/api/health`.

### Notes

- Keep `ACCESS_KEY` set — without it the app is a public download proxy.
- Downloads cost bandwidth and disk; watch Railway usage.
- Prefer local Desktop launch for personal use; Railway is for remote access.

## Requirements & privacy

- **Local or Railway.** Prefer Desktop launch for personal use. Railway works for remote access with Docker + a volume.
- **Dependencies.** Locally you need yt-dlp and FFmpeg on your PATH. On Railway they are included in the Docker image.
- **Public videos only.** Private, members-only, or sign-in-required videos are not supported.
- **Access control.** Set `ACCESS_KEY` on Railway so the app is not an open public proxy.
- **Data.** Recent links are stored in the browser. Temp files live on the server disk (or Railway volume) until TTL cleanup.

## Important notes

- YC Downloader is intended for personal, offline use. Respect copyright and YouTube's Terms of Service.
- Only download content you have the right to save. Do not use this tool to redistribute copyrighted material.
- Download speed depends on your network, the video host, and optional tools like aria2c if configured.
- Temporary files are cleaned up automatically after a set period.

## Scripts

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run setup`  | Create `.env.local`, `downloads/`, check tools   |
| `npm run check`  | Verify Node, yt-dlp, and FFmpeg are available    |
| `npm run open`   | Start server if needed and open the browser      |
| `npm run stop`   | Stop the background local server                 |
| `npm run app:mac`| Build `dist/YC Downloader.app` for one-click use |
| `npm run desktop`| Install `YC Downloader.command` on your Desktop |
| `npm run dev`    | Check deps, then start development server        |
| `npm run build`  | Production build                                 |
| `npm run start`  | Run production server (run `build` first)        |
| `npm run lint`   | Run ESLint                                       |
