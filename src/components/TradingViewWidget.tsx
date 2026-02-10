"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(
        () => {
            // Clean up previous script if any (though React usually handles refs well, strict mode can cause dupes)
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
              "symbol": "BIST:XU100",
              "interval": "D",
              "timezone": "Etc/UTC",
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
        []
    );

    return (
        <div className="tradingview-widget-container h-[600px] w-full bg-black/50 rounded-xl overflow-hidden border border-white/10" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
}

export default memo(TradingViewWidget);
