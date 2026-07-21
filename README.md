# Cmate

YouTube downloader built with Next.js, yt-dlp, and FFmpeg. Paste a public video link, pick a quality, and save the file to your device.

## Features

- Quality presets: Best, 1080p, 720p, M4A, MP3, Opus
- Playlists & batch queue
- Trim / clip (start–end)
- Subtitles (SRT)
- Cancel in-progress downloads
- Custom filename templates (`{title}`, `{channel}`, `{id}`)
- Shareable download links
- Rate limiting
- Dark mode
- Admin dashboard (`/admin`)
- Optional Discord webhook on complete
- Optional cookies file for age-restricted videos

## Quick start (local)

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:9090/download](http://localhost:9090/download).

## Deploy on Railway

1. Push to GitHub → Railway **Deploy from GitHub** (uses `Dockerfile`)
2. Volume at `/data`, set `DOWNLOAD_DIR=/data/downloads`
3. Set env vars:

| Variable | Notes |
| -------- | ----- |
| `ACCESS_KEY` | Unlock gate for visitors |
| `ADMIN_KEY` | `/admin` dashboard |
| `DISCORD_WEBHOOK_URL` | Optional completion pings |
| `RATE_LIMIT_PER_HOUR` | Default `30` |
| `NEXT_PUBLIC_APP_URL` | Public Railway URL |
| `YT_DLP_COOKIES_FILE` | Optional age-restricted support |

## Notes

- Personal use only. Respect YouTube's Terms of Service.
- Public videos only unless cookies are configured.
