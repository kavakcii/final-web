"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
    symbol?: string;
    height?: number | string;
}

function TradingViewWidget({ symbol = "BIST:XU100", height = 400 }: TradingViewWidgetProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(
        () => {
            if (container.current) {
                container.current.innerHTML = "";

                const widgetContainer = document.createElement("div");
                widgetContainer.className = "tradingview-widget-container__widget h-full w-full";
                container.current.appendChild(widgetContainer);

                const script = document.createElement("script");
                script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
                script.type = "text/javascript";
                script.async = true;
                script.innerHTML = `
            {
              "autosize": true,
              "symbol": "${symbol}",
              "interval": "D",
              "timezone": "Europe/Istanbul",
              "theme": "dark",
              "style": "1",
              "locale": "tr",
              "enable_publishing": false,
              "allow_symbol_change": true,
              "calendar": false,
              "support_host": "https://www.tradingview.com"
            }`;
                container.current.appendChild(script);
            }
        },
        [symbol]
    );

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
