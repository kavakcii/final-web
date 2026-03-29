import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAi - Yapay Zeka Yatırım Asistanı",
  description: "Yapay zeka asistanınızla yatırımlarınızı kolayca takip edin.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "FinAi - Yapay Zeka Yatırım Asistanı",
    description: "Yapay zeka asistanınızla yatırımlarınızı kolayca takip edin.",
    images: ["/logo.png"],
    siteName: "FinAi",
  },
};

import { Inter, Libre_Baskerville } from "next/font/google";
import { UserProvider } from "@/components/providers/UserProvider";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: '--font-inter' });
const libre = Libre_Baskerville({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "700"], variable: '--font-libre' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`dark ${inter.variable} ${libre.variable}`}>
      <body className="antialiased font-sans bg-[#020617] text-slate-200 min-h-screen">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
