"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewTechnicalAnalysis() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(
        () => {
            if (container.current) {
                container.current.innerHTML = "";

                const widgetContainer = document.createElement("div");
                widgetContainer.className = "tradingview-widget-container__widget";
                container.current.appendChild(widgetContainer);

                const script = document.createElement("script");
                script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
                script.type = "text/javascript";
                script.async = true;
                script.innerHTML = `
            {
              "interval": "1m",
              "width": "100%",
              "isTransparent": true,
              "height": "100%",
              "symbol": "BIST:XU100",
              "showIntervalTabs": true,
              "displayMode": "single",
              "locale": "tr",
              "colorTheme": "dark"
            }`;
                container.current.appendChild(script);
            }
        },
        []
    );

    return (
        <div className="tradingview-widget-container h-full w-full bg-black/50 rounded-xl overflow-hidden border border-white/10 p-4" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}

export default memo(TradingViewTechnicalAnalysis);
