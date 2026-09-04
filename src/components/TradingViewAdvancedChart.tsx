"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewAdvancedChartProps {
  symbol: string;
  height?: number | string;
}

// BIST & TradingView Symbol Normalization Helper
function normalizeTradingViewSymbol(inputSymbol: string): string {
  if (!inputSymbol) return "BIST:THYAO";
  
  const clean = inputSymbol.toUpperCase().trim();
  
  if (clean === "XU100" || clean === "BIST:XU100" || clean === "XU100.IS") {
    return "FOREKS:XU100";
  }
  
  if (clean.startsWith("BIST:")) {
    return clean;
  }
  
  if (clean.endsWith(".IS")) {
    const raw = clean.replace(/\.IS$/i, "");
    return `BIST:${raw}`;
  }
  
  return `BIST:${clean}`;
}

function TradingViewAdvancedChart({ symbol, height = 500 }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedSymbol = normalizeTradingViewSymbol(symbol);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget elements to prevent duplicate bindings on symbol change
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget h-full w-full";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: resolvedSymbol,
      interval: "60",
      timezone: "Europe/Istanbul",
      theme: "light",
      style: "1",
      locale: "tr",
      withdateranges: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [resolvedSymbol]);

  return (
    <div className="w-full relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
      <div 
        ref={containerRef}
        className="tradingview-widget-container w-full relative min-h-[380px] md:min-h-[480px]"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="tradingview-widget-container__widget h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold">
          TradingView Canlı Grafik Yükleniyor ({resolvedSymbol})...
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewAdvancedChart);
