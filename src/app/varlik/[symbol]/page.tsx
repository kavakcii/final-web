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
  Info,
  Layers,
  PieChart,
  Activity,
  Bookmark
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
    "PGSUS": "Pegasus Hava Taşımacılığı A.Ş.",
    "BIGEN": "Birleşim Grup Enerji Yatırımları A.Ş."
};

// SOL TARAFTAKİ DAİMA AÇIK HİSSE KISAYOL BAŞLIKLARI
const SHORTCUT_STOCKS = [
  { symbol: "THYAO", name: "Türk Hava Yolları" },
  { symbol: "ASELS", name: "Aselsan" },
  { symbol: "MIATK", name: "Mia Teknoloji" },
  { symbol: "ASTOR", name: "Astor Enerji" },
  { symbol: "GARAN", name: "Garanti BBVA" },
  { symbol: "EREGL", name: "Ereğli Demir Çelik" },
  { symbol: "TUPRS", name: "Tüpraş" },
  { symbol: "KCHOL", name: "Koç Holding" },
  { symbol: "SASA", name: "Sasa Polyester" },
  { symbol: "BIMAS", name: "BİM Mağazaları" },
  { symbol: "BIGEN", name: "Birleşim Enerji" },
  { symbol: "OTKAR", name: "Otokar" }
];

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

  // SVG Path Calculation for Smooth Blue Line & Darkening Blue Gradient Area
  const svgPathData = useMemo(() => {
    if (!stockData || !stockData.chartPoints || stockData.chartPoints.length < 2) {
      return { linePath: "", areaPath: "", minPrice: 0, maxPrice: 0, coords: [] };
    }

    const points = stockData.chartPoints;
    const prices = points.map((p: any) => p.price);
    
    let rawMin = Math.min(...prices);
    let rawMax = Math.max(...prices);

    let minPrice = rawMin;
    let maxPrice = rawMax;
    if (maxPrice - minPrice < 0.2) {
      const center = (rawMin + rawMax) / 2 || stockData.currentPrice || 100;
      minPrice = center * 0.95;
      maxPrice = center * 1.05;
    } else {
      const buffer = (maxPrice - minPrice) * 0.1;
      minPrice = minPrice - buffer;
      maxPrice = maxPrice + buffer;
    }

    const range = maxPrice - minPrice || 1;

    const width = 800;
    const height = 320;
    const paddingY = 30;

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
    <div className="flex min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. SOL DÜZEN: LACİVERT DAİMA AÇIK KISAYOL MENÜSÜ (BRAND BLUE #00008B) */}
      {/* ========================================================================= */}
      <aside className="w-64 shrink-0 min-h-screen bg-[#00008B] text-white p-5 space-y-6 flex flex-col justify-between shadow-2xl z-20">
        <div className="space-y-6">
          
          {/* MARKA BAŞLIĞI */}
          <div className="flex items-center gap-3 border-b border-blue-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#00008B] flex items-center justify-center font-black text-xl shadow-md">
              F
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">FinAl Varlık</h1>
              <p className="text-[10px] font-bold text-blue-200/80">Canlı Piyasa & Analiz</p>
            </div>
          </div>

          {/* MENÜ GEZİNTİSİ */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-blue-300/70 uppercase tracking-widest px-2">Gezinti</span>
            <Link 
              href="/dashboard/data" 
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black bg-blue-900/60 text-white border border-blue-700/60 hover:bg-blue-800 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-sky-300" />
              Varlık Merkezi
            </Link>
          </div>

          {/* DAİMA AÇIK HİSSE KISAYOL BAŞLIKLARI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-blue-300/80 uppercase tracking-widest">Hisse Kısayolları</span>
              <Bookmark className="w-3.5 h-3.5 text-blue-300/80" />
            </div>

            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-700">
              {SHORTCUT_STOCKS.map((st) => {
                const isActive = st.symbol === symbol;
                return (
                  <Link
                    key={st.symbol}
                    href={`/varlik/${st.symbol}`}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                      isActive
                        ? "bg-white text-[#00008B] border-white font-black shadow-md scale-[1.02]"
                        : "bg-blue-950/40 text-blue-100 border-blue-800/40 hover:bg-blue-800/70 hover:text-white"
                    )}
                  >
                    <span className="font-black">{st.symbol}</span>
                    <span className={cn("text-[9px] truncate max-w-[100px]", isActive ? "text-[#00008B]/80 font-bold" : "text-blue-300/70")}>{st.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ALT BİLGİ */}
        <div className="border-t border-blue-800/80 pt-4 text-[10px] font-bold text-blue-200/60 text-center">
          FinAl ® Canlı BIST Altyapısı
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. SAĞ VE ORTA DÜZEN: BEYAZ TEMA İÇERİK ALANI (CLEAN WHITE #F8FAFC) */}
      {/* ========================================================================= */}
      <main className="flex-1 bg-[#F8FAFC] min-h-screen p-5 md:p-8 space-y-6 text-slate-900 max-w-full overflow-hidden">
        
        {/* ÜST GEZİNTİ VE İŞLEM BAR I */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link 
            href="/dashboard/data"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-black transition-all border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#00008B]" />
            Varlık Merkezine Dön
          </Link>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchStockData(activeTimeframe)}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
              title="Verileri Yenile"
            >
              <RefreshCw className={cn("w-4 h-4 text-[#00008B]", loading && "animate-spin")} />
            </button>
            <button className="px-4 py-2 rounded-xl bg-[#00008B] hover:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
              <Plus className="w-4 h-4" />
              Portföye Ekle
            </button>
          </div>
        </div>

        {/* ANA GRAFİK KARTI (BEYAZ TEMA, MAVİ ÇİZGİ & KOYULAŞAN MAVİ GRADIENT) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          
          {/* ŞİRKET BİLGİSİ & FİYAT ÇUBUĞU */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{symbol} Grafiği <span className="text-xs font-bold text-[#00008B] italic">Canlı</span></h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200">
                  BIST 100
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-1">{fullName}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black text-[#00008B] tracking-tight">
                {hoveredPoint ? hoveredPoint.price.toFixed(2) : (stockData?.currentPrice || "---")} <span className="text-2xl font-bold">₺</span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 border",
                isPositive 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                {isPositive ? `+${stockData?.priceChange || 0}` : stockData?.priceChange} ₺ ({isPositive ? `+${stockData?.priceChangePercent || 0}` : stockData?.priceChangePercent}%)
              </div>
            </div>
          </div>

          {/* ZAMAN ARALIĞI BUTONLARI (1 Gün, 1 Hafta, 1 Ay, 3 Ay, 6 Ay, 1 Yıl, TÜMÜ) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setActiveTimeframe(tf.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap",
                  activeTimeframe === tf.id
                    ? "bg-[#00008B] text-white border-[#00008B] shadow-md"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* MAVİ ÇİZGİLİ VE AŞAĞIDAN YUKARIYA KOYULAŞAN MAVİ GRADIENTLI SVG GRAFİK ALANI */}
          <div className="relative h-80 w-full pt-4">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 text-[#00008B] font-black text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {activeTimeframe} Zaman Dilimi Grafiği Yükleniyor...
                </div>
              </div>
            )}

            {svgPathData.coords && svgPathData.coords.length > 1 ? (
              <div className="w-full h-full relative">
                <svg 
                  viewBox="0 0 800 320" 
                  className="w-full h-full overflow-visible preserve-3d"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    {/* AŞAĞIDAN YUKARIYA KOYULAŞAN LACİVERT MAVİ GRADIENT */}
                    <linearGradient id="blueChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00008B" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Y-Axis Grid Lines & Price Labels on the Right */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = 290 - ratio * 240;
                    const priceVal = svgPathData.minPrice + ratio * (svgPathData.maxPrice - svgPathData.minPrice);
                    return (
                      <g key={i}>
                        <line x1="0" y1={y} x2="800" y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                        <text x="795" y={y - 4} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="end">
                          ₺{priceVal.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Blue Gradient Fill */}
                  <path d={svgPathData.areaPath} fill="url(#blueChartGradient)" />

                  {/* Main Royal Blue Chart Line */}
                  <path 
                    d={svgPathData.linePath} 
                    fill="none" 
                    stroke="#00008B" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {/* Live Pulse Circle at the Current/Latest Point */}
                  {(() => {
                    const lastCoord = svgPathData.coords[svgPathData.coords.length - 1];
                    if (!lastCoord) return null;
                    return (
                      <g>
                        <circle cx={lastCoord.x} cy={lastCoord.y} r="8" className="fill-[#00008B] opacity-40 animate-ping" />
                        <circle cx={lastCoord.x} cy={lastCoord.y} r="5" className="fill-[#00008B] stroke-white stroke-2" />
                      </g>
                    );
                  })()}

                  {/* Interactive Touch Areas */}
                  {svgPathData.coords.map((pt: any, i: number) => (
                    <rect
                      key={i}
                      x={pt.x - 8}
                      y={0}
                      width={16}
                      height={320}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                    />
                  ))}

                  {/* Hover Indicator Circle */}
                  {hoveredPoint && (
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="6"
                      className="fill-[#00008B] stroke-white stroke-2 shadow-lg"
                    />
                  )}
                </svg>

                {/* Hover Tooltip Box */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-[#00008B] text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl z-20 pointer-events-none -translate-x-1/2 -translate-y-12 transition-all border border-blue-400/40"
                    style={{ left: `${(hoveredPoint.x / 800) * 100}%`, top: `${(hoveredPoint.y / 320) * 100}%` }}
                  >
                    <span className="text-blue-200 font-medium block text-[10px]">{hoveredPoint.time}</span>
                    <span className="font-black text-white text-sm">₺{hoveredPoint.price.toFixed(2)}</span>
                  </div>
                )}

                {/* X-Axis Time Labels */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 px-2 border-t border-slate-100 pt-2">
                  <span>{svgPathData.coords[0]?.time}</span>
                  <span>{svgPathData.coords[Math.floor(svgPathData.coords.length / 2)]?.time}</span>
                  <span>{svgPathData.coords[svgPathData.coords.length - 1]?.time}</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                Bu zaman dilimi için grafik verisi hazılanıyor...
              </div>
            )}
          </div>
        </div>

        {/* ŞİRKET FİNANSAL VERİ VE İSTATİSTİK KARTLARI (BEYAZ TEMA & LACİVERT RAKAMLAR) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">52 Haftalık En Yüksek</span>
            <p className="text-lg font-black text-[#00008B]">₺{stockData?.high52 || "---"}</p>
          </div>
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">52 Haftalık En Düşük</span>
            <p className="text-lg font-black text-[#00008B]">₺{stockData?.low52 || "---"}</p>
          </div>
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">İşlem Hacmi</span>
            <p className="text-lg font-black text-[#00008B]">{stockData?.volume || "1.4M"}</p>
          </div>
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Önceki Kapanış</span>
            <p className="text-lg font-black text-[#00008B]">₺{stockData?.previousClose || "---"}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
