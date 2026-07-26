"use client";

import { useState, useEffect, useMemo, use } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  Bell, 
  Plus, 
  Share2, 
  Building2, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// BIST Şirket Adları Kataloğu
const STOCK_NAMES: Record<string, string> = {
    "ASELS": "Aselsan Elektronik San. ve Tic. A.Ş.",
    "THYAO": "Türk Hava Yolları A.O.",
    "EREGL": "Ereğli Demir ve Çelik Fabrikaları T.A.Ş.",
    "TUPRS": "Tüpraş Türkiye Petrol Rafinerileri A.Ş.",
    "KCHOL": "Koç Holding A.Ş.",
    "SAHOL": "Hacı Ömer Sabancı Holding A.Ş.",
    "GARAN": "Türkiye Garanti Bankası A.Ş.",
    "AKBNK": "Akbank T.A.Ş.",
    "ISCTR": "Türkiye İş Bankası A.Ş.",
    "YKBNK": "Yapı ve Kredi Bankası A.Ş.",
    "BIMAS": "BİM Birleşik Mağazalar A.Ş.",
    "MGROS": "Migros Ticaret A.Ş.",
    "SOKM": "Şok Marketler Ticaret A.Ş.",
    "SISE": "Türkiye Şişe ve Cam Fabrikaları A.Ş.",
    "FROTO": "Ford Otomotiv Sanayi A.Ş.",
    "TOASO": "Tofaş Türk Otomobil Fabrikası A.Ş.",
    "TTRAK": "Türk Traktör ve Ziraat Makineleri A.Ş.",
    "TCELL": "Turkcell İletişim Hizmetleri A.Ş.",
    "TTKOM": "Türk Telekomünikasyon A.Ş.",
    "SASA": "Sasa Polyester Sanayi A.Ş.",
    "HEKTS": "Hektaş Ticaret T.A.Ş.",
    "ASTOR": "Astor Enerji A.Ş.",
    "MIATK": "Mia Teknoloji A.Ş.",
    "PGSUS": "Pegasus Hava Taşımacılığı A.Ş."
};

const TIMEFRAMES = [
  { id: "1D", label: "1 Gün" },
  { id: "1W", label: "1 Hafta" },
  { id: "1M", label: "1 Ay" },
  { id: "3M", label: "3 Ay" },
  { id: "6M", label: "6 Ay" },
  { id: "1Y", label: "1 Yıl" },
  { id: "ALL", label: "TÜMÜ" }
];

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const rawSymbol = resolvedParams.symbol || "ASELS";
  const symbol = rawSymbol.toUpperCase().replace('.IS', '').trim();

  const [activeTimeframe, setActiveTimeframe] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const fullName = STOCK_NAMES[symbol] || `${symbol} Sanayi ve Ticaret A.Ş.`;

  // Fetch stock detail & chart data
  const fetchStockData = async (tf: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bist/stock?symbol=${symbol}&timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
      }
    } catch (e) {
      console.error("Failed to fetch stock data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(activeTimeframe);
  }, [symbol, activeTimeframe]);

  // SVG Path Calculation for Smooth Line & Gradient Area
  const svgPathData = useMemo(() => {
    if (!stockData || !stockData.chartPoints || stockData.chartPoints.length < 2) {
      return { linePath: "", areaPath: "", minPrice: 0, maxPrice: 0, prices: [] };
    }

    const points = stockData.chartPoints;
    const prices = points.map((p: any) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const width = 800;
    const height = 340;
    const paddingY = 20;

    const coords = points.map((pt: any, i: number) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - paddingY - ((pt.price - minPrice) / range) * (height - paddingY * 2);
      return { x, y, price: pt.price, time: pt.time };
    });

    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      linePath += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return { linePath, areaPath, minPrice, maxPrice, coords };
  }, [stockData]);

  const isPositive = (stockData?.priceChange || 0) >= 0;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* ÜST GEZİNTİ VE GERİ DÖNÜŞ BAR I */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link 
          href="/dashboard/data"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-black transition-all border border-slate-700/60 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          Varlık Merkezine Dön
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchStockData(activeTimeframe)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={cn("w-4 h-4 text-emerald-400", loading && "animate-spin")} />
          </button>
          <button className="px-3 py-2 rounded-xl bg-[#00008B] hover:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
            <Plus className="w-4 h-4" />
            Portföye Ekle
          </button>
        </div>
      </div>

      {/* ANA KOYU TEMA GRAFİK KARTI (FOTOĞRAFTAKİ İLE BİREBİR UYUMLU KOYU TASARIM) */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* ŞİRKET BİLGİSİ & FİYAT ÇUBUĞU */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">{symbol} Grafiği <span className="text-xs font-bold text-emerald-400 italic">Canlı</span></h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                BIST 100
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">{fullName}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {hoveredPoint ? hoveredPoint.price.toFixed(2) : (stockData?.currentPrice || "---")} <span className="text-2xl font-bold">₺</span>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 border",
              isPositive 
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80" 
                : "bg-rose-950/60 text-rose-400 border-rose-800/80"
            )}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? `+${stockData?.priceChange || 0}` : stockData?.priceChange} ₺ ({isPositive ? `+${stockData?.priceChangePercent || 0}` : stockData?.priceChangePercent}%)
            </div>
          </div>
        </div>

        {/* ZAMAN ARALIĞI BUTONLARI (1 Gün, 1 Hafta, 1 Ay, 3 Ay, 6 Ay, 1 Yıl, TÜMÜ) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/60">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setActiveTimeframe(tf.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap",
                activeTimeframe === tf.id
                  ? "bg-slate-700 text-white border-slate-500 shadow-md"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* İNTERAKTİF CANLI SVG GRAFİK ALANI */}
        <div className="relative h-80 w-full pt-4">
          {loading && (
            <div className="absolute inset-0 bg-[#121826]/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <RefreshCw className="w-5 h-5 animate-spin" />
                {activeTimeframe} Zaman Dilimi Grafiği Yükleniyor...
              </div>
            </div>
          )}

          {svgPathData.coords && svgPathData.coords.length > 1 ? (
            <div className="w-full h-full relative">
              <svg viewBox="0 0 800 340" className="w-full h-full overflow-visible preserve-3d">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = 320 - ratio * 280;
                  const priceVal = svgPathData.minPrice + ratio * (svgPathData.maxPrice - svgPathData.minPrice);
                  return (
                    <g key={i}>
                      <line x1="0" y1={y} x2="800" y2={y} stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                      <text x="795" y={y - 4} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="end">
                        ₺{priceVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill */}
                <path d={svgPathData.areaPath} fill="url(#chartGradient)" />

                {/* Main Glowing Green Line */}
                <path 
                  d={svgPathData.linePath} 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Interactive Points on Hover */}
                {svgPathData.coords.map((pt: any, i: number) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    className="fill-emerald-400 stroke-[#121826] stroke-2 cursor-pointer hover:r-8 transition-all"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>

              {/* Hover Tooltip Box */}
              {hoveredPoint && (
                <div className="absolute top-2 left-4 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl shadow-xl z-20 pointer-events-none">
                  <span className="text-slate-400 font-medium block text-[10px]">{hoveredPoint.time}</span>
                  <span className="font-black text-emerald-400 text-sm">₺{hoveredPoint.price.toFixed(2)}</span>
                </div>
              )}

              {/* X-Axis Time Labels */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mt-2 px-2 border-t border-slate-800/80 pt-2">
                <span>{svgPathData.coords[0]?.time}</span>
                <span>{svgPathData.coords[Math.floor(svgPathData.coords.length / 2)]?.time}</span>
                <span>{svgPathData.coords[svgPathData.coords.length - 1]?.time}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold">
              Bu zaman dilimi için grafik verisi hazılanıyor...
            </div>
          )}
        </div>
      </div>

      {/* ŞİRKET FİNANSAL VERİ VE İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">52 Haftalık En Yüksek</span>
          <p className="text-lg font-black text-white">₺{stockData?.high52 || "---"}</p>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">52 Haftalık En Düşük</span>
          <p className="text-lg font-black text-white">₺{stockData?.low52 || "---"}</p>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İşlem Hacmi</span>
          <p className="text-lg font-black text-white">{stockData?.volume || "14.2M"}</p>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Önceki Kapanış</span>
          <p className="text-lg font-black text-white">₺{stockData?.previousClose || "---"}</p>
        </div>
      </div>
    </div>
  );
}
