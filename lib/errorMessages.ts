export function friendlyErrorMessage(raw: string): string {
  const message = raw.toLowerCase();

  if (
    message.includes("only youtube urls") ||
    message.includes("invalid request") ||
    message.includes("invalid url")
  ) {
    return "That doesn't look like a valid YouTube link. Check the URL and try again.";
  }

  if (
    message.includes("private") ||
    message.includes("members-only") ||
    message.includes("login") ||
    message.includes("sign in")
  ) {
    return "This video is private or requires sign-in. Only public videos are supported.";
  }

  if (
    message.includes("unavailable") ||
    message.includes("removed") ||
    message.includes("no video formats") ||
    message.includes("not available")
  ) {
    return "This video is unavailable. It may have been removed or restricted in your region.";
  }

  if (message.includes("age") || message.includes("confirm your age")) {
    return "This video is age-restricted. Cookie-based auth is not configured yet.";
  }

  if (
    message.includes("yt-dlp") &&
    (message.includes("not found") || message.includes("could not resolve"))
  ) {
    return "yt-dlp is not installed or not on your PATH. Install it and restart the server.";
  }

  if (message.includes("ffmpeg") && message.includes("not found")) {
    return "FFmpeg is not installed or not on your PATH. Install it and restart the server.";
  }

  if (message.includes("429") || message.includes("too many requests")) {
    return "YouTube rate-limited this request. Wait a moment and try again.";
  }

  if (message.includes("network") || message.includes("timed out")) {
    return "Network error while reaching YouTube. Check your connection and try again.";
  }

  if (message.includes("playlist")) {
    return "Playlist URLs aren't supported yet. Paste a link to a single video.";
  }

  return "Something went wrong. Double-check the link or try a different quality.";
}
