"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
    symbol?: string;
    height?: number | string;
}

// TradingView embedded widget icin dogru sembol haritasi
const SYMBOL_MAP: Record<string, string> = {
    "BIST:XU100": "FOREKS:XU100",
    "XU100": "FOREKS:XU100",
    "XU100.IS": "FOREKS:XU100",
};

function mapSymbol(input: string): string {
    // Check direct mapping first
    if (SYMBOL_MAP[input]) return SYMBOL_MAP[input];

    // If it starts with BIST:, convert to BIST: format for individual stocks
    if (input.startsWith("BIST:")) {
        return input; // Individual stocks like BIST:THYAO work fine
    }

    // If it ends with .IS, convert to BIST: format
    if (input.endsWith(".IS") || input.endsWith(".is")) {
        const clean = input.replace(/\.IS$/i, "");
        return `BIST:${clean}`;
    }

    return input;
}

function TradingViewWidget({ symbol = "FOREKS:XU100", height = 400 }: TradingViewWidgetProps) {
    const container = useRef<HTMLDivElement>(null);
    const resolvedSymbol = mapSymbol(symbol);

    useEffect(() => {
        if (!container.current) return;
        container.current.innerHTML = "";

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget h-full w-full";
        container.current.appendChild(widgetContainer);

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: resolvedSymbol,
            interval: "D",
            timezone: "Europe/Istanbul",
            theme: "dark",
            style: "1",
            locale: "tr",
            enable_publishing: false,
            allow_symbol_change: true,
            calendar: false,
            hide_side_toolbar: false,
            hide_volume: false,
            support_host: "https://www.tradingview.com"
        });
        container.current.appendChild(script);
    }, [resolvedSymbol]);

    return (
        <div
            className="tradingview-widget-container w-full bg-black/50 rounded-xl overflow-hidden border border-white/10"
            ref={container}
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
}

export default memo(TradingViewWidget);
