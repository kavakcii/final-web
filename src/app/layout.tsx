import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAi - Yapay Zeka Yatırım Asistanı",
  description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin. Salih KAVAKCI tarafından kuruldu.",
  authors: [{ name: "Salih KAVAKCI", url: "https://finai.net.tr" }],
  creator: "Salih KAVAKCI",
  publisher: "FinAi",
  keywords: [
    "Salih KAVAKCI",
    "Salih Kavakcı FinAi",
    "Salih Kavakcı",
    "FinAi kurucusu Salih Kavakcı",
    "FinAi",
    "FinAi yapay zeka",
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
    title: "FinAi - Yapay Zeka Yatırım Asistanı",
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin. Kurucu: Salih KAVAKCI.",
    url: "https://finai.net.tr",
    images: [
      {
        url: "/icon-512.png",
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
    description: "BIST ve TEFAS portföyünüzü AI destekli analizlerle tek bir panoda yönetin. Kurucu: Salih KAVAKCI.",
    images: ["/icon-512.png"],
  },
};

import { Inter } from "next/font/google";
import { UserProvider } from "@/components/providers/UserProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: '--font-inter' });

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://finai.net.tr/#founder",
      "name": "Salih KAVAKCI",
      "jobTitle": "Kurucu & Geliştirici (Founder)",
      "worksFor": {
        "@id": "https://finai.net.tr/#organization"
      },
      "url": "https://finai.net.tr/about",
      "sameAs": [
        "https://www.instagram.com/finai.net.tr/"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://finai.net.tr/#organization",
      "name": "FinAi",
      "url": "https://finai.net.tr",
      "logo": "https://finai.net.tr/icon-512.png",
      "founder": {
        "@id": "https://finai.net.tr/#founder"
      },
      "description": "BIST ve TEFAS portföyünüzü yapay zeka destekli analizlerle tek ekrandan yönetin. Salih KAVAKCI tarafından kurulmuştur."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`dark ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
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
