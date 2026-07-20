import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAi - Yapay Zeka Yatırım Asistanı",
  description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/logo.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "FinAi - Yapay Zeka Yatırım Asistanı",
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "FinAi Logo",
      },
    ],
    siteName: "FinAi",
  },
  twitter: {
    card: "summary",
    title: "FinAi - Yapay Zeka Yatırım Asistanı",
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin.",
    images: ["/logo.png"],
  },
};

import { Inter } from "next/font/google";
import { UserProvider } from "@/components/providers/UserProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`dark ${inter.variable}`}>
      <body className={`antialiased ${inter.className} bg-[#020617] text-slate-200 min-h-screen`}>
        <UserProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
