"use client";

import React, { useEffect, memo } from "react";
import { Activity } from "lucide-react";

// Doğrulanmış 5 Temel Makro / Piyasa Sembolü
export const MARKET_TICKERS = [
  { symbol: "FX_IDC:XAUTRYG", label: "Gram Altın", code: "XAU/TRY" },
  { symbol: "BIST:XU100", label: "BIST 100", code: "XU100" },
  { symbol: "FX_IDC:USDTRY", label: "Dolar / TL", code: "USD/TRY" },
  { symbol: "FX_IDC:EURTRY", label: "Euro / TL", code: "EUR/TRY" },
  { symbol: "BINANCE:BTCUSDT", label: "Bitcoin", code: "BTC/USD" },
];

const SCRIPT_ID = "tv-single-ticker-script";

function TradingViewMarketPulseComponent() {
  // Singleton Script Yükleme Stratejisi
  // Tek bir script tag'i document.head'e eklenir, asla çoğaltılmaz veya yeniden yüklenmez.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "module";
      script.src = "https://widgets.tradingview-widget.com/w/tr/tv-single-ticker.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full px-2 py-2">
      {/* Piyasa Başlığı - Kompakt ve İkincil */}
      <div className="flex items-center gap-1.5 mb-1.5 px-2">
        <Activity className="w-3.5 h-3.5 text-[#00008B]/60 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00008B]/60 whitespace-nowrap">
          Piyasa
        </span>
        <div className="h-px flex-1 bg-[#00008B]/10 ml-1" />
      </div>

      {/* 5 Kompakt Ticker Kartı */}
      <div className="space-y-1 bg-white/50 backdrop-blur-md rounded-xl p-1 border border-white/60 shadow-[0_2px_8px_rgba(0,0,139,0.04)]">
        {MARKET_TICKERS.map((item) => (
          <div
            key={item.symbol}
            className="w-full rounded-lg overflow-hidden bg-white/40 hover:bg-white/80 transition-colors"
          >
            {React.createElement("tv-single-ticker", {
              symbol: item.symbol,
              "hide-market-status": "true",
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export const TradingViewMarketPulse = memo(TradingViewMarketPulseComponent);
