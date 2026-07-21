export async function notifyDiscord(payload: {
  title: string;
  fileName: string;
  jobId: string;
  shareToken?: string;
}): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl =
    payload.shareToken && appUrl
      ? `${appUrl.replace(/\/$/, "")}/api/share/${payload.shareToken}`
      : undefined;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: [
          `✅ **Download ready:** ${payload.title}`,
          `File: \`${payload.fileName}\``,
          shareUrl ? `Link: ${shareUrl}` : `Job: ${payload.jobId}`,
        ].join("\n"),
      }),
    });
  } catch {
    // Notifications should never break downloads.
  }
}
