"use client";

import React, { useEffect, useRef, memo } from "react";

export interface TradingViewMarketOverviewProps {
    className?: string;
}

export function TradingViewMarketOverview({ className = "" }: TradingViewMarketOverviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Önceki widget içeriğini temizle
        container.innerHTML = "";

        const widgetWrapper = document.createElement("div");
        widgetWrapper.className = "tradingview-widget-container";
        widgetWrapper.style.width = "133.33%";
        widgetWrapper.style.height = "133.33%";
        (widgetWrapper.style as any).zoom = "0.75";

        const widgetElement = document.createElement("div");
        widgetElement.className = "tradingview-widget-container__widget";
        widgetElement.style.width = "100%";
        widgetElement.style.height = "100%";

        // TradingView telif alanı DOM'da var ancak görünmez (kullanıcı talebi: 'tradingview yazan yerleri kaldır')
        const copyrightContainer = document.createElement("div");
        copyrightContainer.className = "tradingview-widget-copyright";
        copyrightContainer.style.opacity = "0";
        copyrightContainer.style.height = "1px";
        copyrightContainer.style.overflow = "hidden";
        copyrightContainer.style.pointerEvents = "none";
        copyrightContainer.innerHTML = `
            <a href="https://tr.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span class="blue-text">Track all markets on TradingView</span>
            </a>
        `;

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            lineWidth: 2,
            lineType: 0,
            chartType: "area",
            fontColor: "#64748B",
            widgetFontColor: "#0B1F3A",
            gridLineColor: "rgba(226, 232, 240, 0.45)",
            volumeUpColor: "rgba(16, 185, 129, 0.18)",
            volumeDownColor: "rgba(239, 68, 68, 0.16)",
            backgroundColor: "#FFFFFF",
            upColor: "#10B981",
            downColor: "#EF4444",
            borderUpColor: "#10B981",
            borderDownColor: "#EF4444",
            wickUpColor: "#10B981",
            wickDownColor: "#EF4444",
            colorTheme: "light",
            isTransparent: true,
            locale: "tr",
            chartOnly: false,
            scalePosition: "right",
            scaleMode: "Normal",
            fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Ubuntu, sans-serif",
            valuesTracking: "1",
            changeMode: "price-and-percent",
            symbols: [
                ["FX_IDC:XAUTRYG|12M"],
                ["BINANCE:BTCTRY|12M"],
                ["FX:EURTRY|12M"],
                ["FX:USDTRY|12M"]
            ],
            dateRanges: [
                "1w|15",
                "3m|60",
                "12m|1D",
                "60m|1W",
                "all|1M"
            ],
            fontSize: "10",
            headerFontSize: "small",
            autosize: true,
            width: "100%",
            height: "100%",
            noTimeScale: false,
            hideDateRanges: false,
            hideMarketStatus: false,
            hideSymbolLogo: false
        });

        widgetWrapper.appendChild(widgetElement);
        widgetWrapper.appendChild(copyrightContainer);
        widgetWrapper.appendChild(script);
        container.appendChild(widgetWrapper);

        return () => {
            if (container) {
                container.innerHTML = "";
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className={`w-full h-full relative overflow-hidden ${className}`}
        />
    );
}

export default memo(TradingViewMarketOverview);
