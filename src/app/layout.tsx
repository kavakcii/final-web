import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://finai.net.tr"),
  title: {
    default: "FinAI - Yapay Zeka Yatırım ve Borsa Asistanı",
    template: "%s | FinAI"
  },
  description: "BIST hisse senetleri, canlı borsa fiyatları, temettü takvimi, TEFAS fonları ve AI destekli analizler tek bir platformda. Salih KAVAKCI tarafından kuruldu.",
  authors: [{ name: "Salih KAVAKCI", url: "https://finai.net.tr" }],
  creator: "Salih KAVAKCI",
  publisher: "FinAI",
  keywords: [
    "Salih KAVAKCI",
    "Salih Kavakcı FinAi",
    "Salih Kavakcı",
    "FinAi kurucusu Salih Kavakcı",
    "FinAi",
    "FinAi yapay zeka",
    "BIST hisse analizi",
    "THYAO hisse",
    "ASELS hisse",
    "temettü veren hisseler",
    "BIST portföy takibi",
    "TEFAS fon analizi",
    "Finansal okuryazarlık",
    "Yatırım asistanı"
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/icon-512.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "FinAI - Yapay Zeka Yatırım Asistanı",
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin. Kurucu: Salih KAVAKCI.",
    url: "https://finai.net.tr",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "FinAI Logo",
      },
    ],
    siteName: "FinAI",
  },
  twitter: {
    card: "summary",
    title: "FinAI - Yapay Zeka Yatırım Asistanı",
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin. Kurucu: Salih KAVAKCI.",
    images: ["/icon-512.png"],
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
    <html lang="tr" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#030712" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased font-sans text-slate-900 bg-background selection:bg-brand-primary/20 selection:text-brand-primary min-h-screen">
        <UserProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
