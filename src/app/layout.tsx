import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAl - Yapay Zeka Finans Asistanı",
  description: "Yapay zeka asistanınızla yatırımlarınızı kolayca takip edin.",
};

import { UserProvider } from "@/components/providers/UserProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#020617] text-slate-200 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
