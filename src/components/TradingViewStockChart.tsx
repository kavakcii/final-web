"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  IChartApi, 
  UTCTimestamp,
  LineStyle,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries
} from "lightweight-charts";
import { RefreshCw, BarChart2, Layers, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  timestamp: number; // Unix seconds
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  price: number;
  volume: number;
}

interface TradingViewStockChartProps {
  symbol: string;
  chartPoints: ChartPoint[];
  activeTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  loading: boolean;
  error: string | null;
  currency?: string;
  isMarketOpen?: boolean;
  marketStatusText?: string;
  lastUpdated?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  onRetry?: () => void;
}

const TIMEFRAMES = [
  { id: "1G", label: "1G", title: "Bugün (Seans)" },
  { id: "1H", label: "1H", title: "1 Hafta" },
  { id: "1A", label: "1A", title: "1 Ay" },
  { id: "3A", label: "3A", title: "3 Ay" },
  { id: "6A", label: "6A", title: "6 Ay" },
  { id: "1Y", label: "1Y", title: "1 Yıl" },
  { id: "5Y", label: "5Y", title: "5 Yıl" }
];

export function TradingViewStockChart({
  symbol,
  chartPoints,
  activeTimeframe,
  onTimeframeChange,
  loading,
  error,
  currency = "₺",
  isMarketOpen = false,
  marketStatusText = "Piyasa Kapalı",
  lastUpdated,
  currentPrice,
  priceChange,
  priceChangePercent,
  onRetry
}: TradingViewStockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<"area" | "candle">("area");
  const [hoveredData, setHoveredData] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  // Clean data sorting & deduplication
  const validData = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) return [];
    
    // Sort chronologically
    const sorted = [...chartPoints].sort((a, b) => a.timestamp - b.timestamp);
    
    // Deduplicate by timestamp (seconds)
    const uniqueMap = new Map<number, ChartPoint>();
    sorted.forEach(pt => {
      if (pt.timestamp && pt.close && !isNaN(pt.close) && pt.close > 0) {
        uniqueMap.set(pt.timestamp, pt);
      }
    });

    return Array.from(uniqueMap.values());
  }, [chartPoints]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (loading || validData.length === 0) return;

    const container = chartContainerRef.current;

    // Clean previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const isIntraday = activeTimeframe === "1G" || activeTimeframe === "1D" || activeTimeframe === "1H";

    // Initialize TradingView Lightweight Chart
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 340,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontSize: 11,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(226, 232, 240, 0.6)", style: LineStyle.Dotted },
        horzLines: { color: "rgba(226, 232, 240, 0.6)", style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#00008B",
          width: 1,
          style: LineStyle.LargeDashed,
          labelBackgroundColor: "#00008B"
        },
        horzLine: {
          color: "#00008B",
          width: 1,
          style: LineStyle.LargeDashed,
          labelBackgroundColor: "#00008B"
        }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25
        }
      },
      timeScale: {
        borderVisible: false,
        timeVisible: isIntraday,
        secondsVisible: false,
        rightOffset: 3
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartInstanceRef.current = chart;

    if (chartType === "area") {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: "rgba(0, 0, 139, 0.25)",
        bottomColor: "rgba(0, 0, 139, 0.00)",
        lineColor: "#00008B",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: "#FFFFFF",
        crosshairMarkerBackgroundColor: "#00008B"
      });

      const areaData = validData.map(pt => ({
        time: pt.timestamp as UTCTimestamp,
        value: pt.close
      }));
      areaSeries.setData(areaData);
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444"
      });

      const candleData = validData.map(pt => ({
        time: pt.timestamp as UTCTimestamp,
        open: pt.open || pt.close,
        high: pt.high || pt.close,
        low: pt.low || pt.close,
        close: pt.close
      }));
      candleSeries.setData(candleData);
    }

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(0, 0, 139, 0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75,
        bottom: 0
      }
    });

    const volumeData = validData.map(pt => ({
      time: pt.timestamp as UTCTimestamp,
      value: pt.volume || 0,
      color: (pt.close >= (pt.open || pt.close)) ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"
    }));
    volumeSeries.setData(volumeData);

    // Crosshair move handler
    chart.subscribeCrosshairMove((param: any) => {
      if (!param || !param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        setHoveredData(null);
        return;
      }

      const tsSec = param.time as number;
      const matchedPoint = validData.find(p => p.timestamp === tsSec);

      if (matchedPoint) {
        const dateObj = new Date(tsSec * 1000);
        const formattedDateStr = isIntraday
          ? dateObj.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "long" })
          : dateObj.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

        setHoveredData({
          time: formattedDateStr,
          open: matchedPoint.open,
          high: matchedPoint.high,
          low: matchedPoint.low,
          close: matchedPoint.close,
          volume: matchedPoint.volume
        });
      }
    });

    // Resize Observer for Responsive Width
    const handleResize = () => {
      if (container && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: container.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [validData, chartType, activeTimeframe, loading]);

  const displayPrice = hoveredData?.close !== undefined ? hoveredData.close : (currentPrice || (validData.length > 0 ? validData[validData.length - 1].close : 0));

  return (
    <div className="w-[#100%] space-y-4">
      {/* GRAFİK ÜSTÜ KONTROL VE SEÇENEKLER BARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* SOL: PİYASA VE SON VERİ DURUMU */}
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border",
            isMarketOpen
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
            {marketStatusText}
          </span>
          {lastUpdated && (
            <span className="text-[10px] font-bold text-slate-400">
              Son Veri: {lastUpdated}
            </span>
          )}
        </div>

        {/* SAĞ: CHART TİPİ VE TIMEFRAME BUTONLARI */}
        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
          
          {/* Çizgi / Mum Grafik Seçeneği */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px]",
                chartType === "area" ? "bg-white text-[#00008B] shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
              title="Çizgi Grafik"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Çizgi
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px]",
                chartType === "candle" ? "bg-white text-[#00008B] shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
              title="Mum Grafik (OHLC)"
            >
              <Layers className="w-3.5 h-3.5" />
              Mum
            </button>
          </div>

          {/* Timeframe Seçenekleri (1G, 1H, 1A, 3A, 6A, 1Y, 5Y) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => onTimeframeChange(tf.id)}
                title={tf.title}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-black transition-all border whitespace-nowrap",
                  activeTimeframe === tf.id
                    ? "bg-[#00008B] text-white border-[#00008B] shadow-xs scale-105"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İNTERAKTİF TOOLTIP / CROSSHAIR DEĞER EKRANI */}
      <div className="min-h-[42px] bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2.5 px-4 flex items-center justify-between gap-2 text-xs font-bold shadow-2xs">
        {hoveredData ? (
          <div className="flex items-center gap-4 flex-wrap w-full justify-between">
            <span className="text-slate-500 font-extrabold text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#00008B]" />
              {hoveredData.time}
            </span>
            <div className="flex items-center gap-3 text-slate-800 text-[11px]">
              {chartType === "candle" && (
                <>
                  <span>A: <strong className="text-slate-900">{hoveredData.open?.toFixed(2)}</strong></span>
                  <span>Y: <strong className="text-emerald-700">{hoveredData.high?.toFixed(2)}</strong></span>
                  <span>D: <strong className="text-rose-700">{hoveredData.low?.toFixed(2)}</strong></span>
                </>
              )}
              <span>Kapanış: <strong className="text-[#00008B] font-black">{hoveredData.close?.toFixed(2)} {currency}</strong></span>
              {hoveredData.volume !== undefined && hoveredData.volume > 0 && (
                <span className="text-slate-400">Hacim: <strong className="text-slate-600">{hoveredData.volume.toLocaleString("tr-TR")}</strong></span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-[11px] font-medium">
              Detaylı tarih ve OHLC değerlerini görmek için grafiğin üzerine gelin
            </span>
            {displayPrice > 0 && (
              <span className="text-xs font-black text-[#00008B]">
                Güncel: {displayPrice.toFixed(2)} {currency}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ANAGRAM GRAFİK TUVAL ALANI */}
      <div className="relative w-full h-[340px] bg-white rounded-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#00008B] animate-spin" />
            <span className="text-xs font-black text-[#00008B]">BİST Canlı Grafik Verileri Yükleniyor...</span>
          </div>
        )}

        {error || validData.length === 0 ? (
          <div className="absolute inset-0 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <div>
              <p className="text-sm font-black text-slate-800">Grafik Verisi Alınamıyor</p>
              <p className="text-xs text-slate-500 mt-0.5">{error || "Seçilen dönem için doğrulanmış fiyat verisi bulunamadı."}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-[#00008B] hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              >
                Yeniden Deneyin
              </button>
            )}
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
export default TradingViewStockChart;
