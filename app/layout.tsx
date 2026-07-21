import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { LauncherHeartbeat } from "@/components/LauncherHeartbeat";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:9090",
  ),
  title: {
    default: "Cmate",
    template: "%s — Cmate",
  },
  description:
    "Download public YouTube videos easily. Paste a link, pick a quality, and save to your device.",
  openGraph: {
    title: "Cmate",
    description:
      "Paste a YouTube link, pick a quality, and save videos to your device.",
    siteName: "Cmate",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cmate",
    description:
      "Paste a YouTube link, pick a quality, and save videos to your device.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cmate-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <LauncherHeartbeat />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
