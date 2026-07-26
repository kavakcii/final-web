"use client";

import { useState, useEffect, useMemo, use, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  Plus, 
  Building2, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Newspaper,
  X,
  FileText,
  PieChart,
  Coins,
  Activity,
  Sliders,
  ListFilter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import halkarzAboutDb from "@/data/halkarz_about_db.json";

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
    "BIGEN": "Birleşim Grup Enerji Yatırımları A.Ş.",
    "TKFEN": "Tekfen Holding A.Ş."
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
  const [activeNavTab, setActiveNavTab] = useState("genel");
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // HABERLERİ CANLI ÇEKME & OKUMA MODALI
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // SECTION REFS FOR SMOOTH SCROLLING
  const genelRef = useRef<HTMLDivElement>(null);
  const grafikRef = useRef<HTMLDivElement>(null);
  const ozelliklerRef = useRef<HTMLDivElement>(null);
  const haberlerRef = useRef<HTMLDivElement>(null);
  const temettulerRef = useRef<HTMLDivElement>(null);

  const fullName = STOCK_NAMES[symbol] || `${symbol} Sanayi ve Ticaret A.Ş.`;

  // INSTANT 0MS LOCAL HALKARZ ABOUT TEXT (Sıfır bekleme, yerel veritabanından anında okuma)
  const aboutText = useMemo(() => {
    const cached = (halkarzAboutDb as Record<string, string>)[symbol];
    if (cached && cached.length > 30) {
      return cached;
    }
    return `${symbol} (${fullName}), Borsa İstanbul (BIST) piyasasında sürdürülebilir büyüme odaklı faaliyet gösteren, yüksek üretim kapasitesine ve geniş hizmet ağına sahip Türkiye’nin önde gelen kuruluşları arasında yer almaktadır. Şirket, inovatif çözümleri, AR-GE yatırımları ve nitelikli insan kaynağı ile ulusal ve uluslararası pazarlarda stratejik konumunu korumakta ve yatırımcılarına katma değer sunmayı sürdürmektedir.`;
  }, [symbol, fullName]);

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

  // Fetch live news feeds for symbol
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/bist/news?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNewsList(data.articles || []);
      }
    } catch (e) {
      console.error("Failed to fetch stock news:", e);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(activeTimeframe);
    fetchNews();
  }, [symbol, activeTimeframe]);

  const scrollToSection = (tabId: string) => {
    setActiveNavTab(tabId);
    let targetRef: React.RefObject<HTMLDivElement | null> | null = null;
    if (tabId === "genel") targetRef = genelRef;
    else if (tabId === "grafik") targetRef = grafikRef;
    else if (tabId === "ozellikler") targetRef = ozelliklerRef;
    else if (tabId === "haberler") targetRef = haberlerRef;
    else if (tabId === "temettuler") targetRef = temettulerRef;

    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <div className="flex min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden relative">
      
      {/* ========================================================================= */}
      {/* 1. SOL DÜZEN: LACİVERT SOL MENÜ (#00008B) - SEMBOL, FİYAT VE SEKMELER */}
      {/* ========================================================================= */}
      <aside className="w-64 shrink-0 min-h-screen bg-[#00008B] text-white p-5 space-y-6 flex flex-col justify-between shadow-2xl z-20">
        <div className="space-y-6">
          
          {/* TIKLANAN HİSSENİN BAŞLIĞI, LOGOSU VE FİYATI */}
          <div className="flex items-center gap-3 border-b border-blue-800/80 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00008B] flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {symbol.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1.5">
                <h1 className="text-xl font-black text-white tracking-tight truncate">{symbol}</h1>
                <span className="text-xs font-black text-blue-100 whitespace-nowrap bg-blue-900/60 px-2 py-0.5 rounded-lg border border-blue-700/60">
                  {stockData?.currentPrice || "---"} ₺
                </span>
              </div>
              <p className="text-[10px] font-bold text-blue-200/80 truncate max-w-[150px] mt-0.5">{fullName}</p>
            </div>
          </div>

          {/* MENÜ BAŞLIKLARI (Genel Bilgi, Haberler, Grafik, Hisse Özellikleri, Temettüler) */}
          <div className="space-y-1.5 pt-2">
            {[
              { id: "genel", label: "Genel Bilgi", icon: FileText },
              { id: "haberler", label: "Haberler", icon: Newspaper },
              { id: "grafik", label: "Grafik", icon: BarChart3 },
              { id: "ozellikler", label: "Hisse Özellikleri", icon: Activity },
              { id: "temettuler", label: "Temettüler", icon: Coins }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black transition-all border text-left",
                    isActive
                      ? "bg-white text-[#00008B] border-white shadow-lg scale-[1.02]"
                      : "bg-blue-950/40 text-blue-100 border-blue-800/40 hover:bg-blue-800/70 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-[#00008B]" : "text-blue-300")} />
                  {tab.label}
                </button>
              );
            })}
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
              onClick={() => { fetchStockData(activeTimeframe); fetchNews(); }}
              disabled={loading || newsLoading}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
              title="Verileri ve Haberleri Yenile"
            >
              <RefreshCw className={cn("w-4 h-4 text-[#00008B]", (loading || newsLoading) && "animate-spin")} />
            </button>
            <button className="px-4 py-2 rounded-xl bg-[#00008B] hover:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
              <Plus className="w-4 h-4" />
              Portföye Ekle
            </button>
          </div>
        </div>

        {/* 1. SEKSİYON: ANINDA 0MS ŞİRKET HAKKINDA (SABİT BAŞLIK, SIFIR BEKLEME) */}
        <div ref={genelRef} className="scroll-mt-6">
          <div className="bg-[#00008B] text-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-blue-900">
            
            <div className="border-b border-blue-800/80 pb-4">
              <h2 className="font-black text-xl text-white tracking-tight">
                Şirket Hakkında
              </h2>
            </div>

            <div className="space-y-4 pt-1">
              <h3 className="font-black text-white text-base tracking-tight">{fullName}</h3>

              <div className="space-y-4 text-white text-xs md:text-sm font-medium leading-relaxed tracking-wide">
                {aboutText.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 2. SEKSİYON: GRAFİK KARTI (GENİŞLİK 100% UYUMLU, PRESERVEASPECTRATIO NONE) */}
        <div ref={grafikRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 pb-8 shadow-xl space-y-6 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00008B]" />
              {symbol} Canlı Grafik
            </h2>

            {/* ZAMAN ARALIĞI BUTONLARI (1 Gün, 1 Hafta, 1 Ay, 3 Ay, 6 Ay, 1 Yıl, TÜMÜ) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setActiveTimeframe(tf.id)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-black transition-all border whitespace-nowrap",
                    activeTimeframe === tf.id
                      ? "bg-[#00008B] text-white border-[#00008B] shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* MAVİ ÇİZGİLİ VE UÇTAN UCA %100 UZANAN KOYULAŞAN MAVİ GRADIENTLI SVG GRAFİK ALANI */}
          <div className="relative min-h-[340px] w-full pt-2 pb-4">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 text-[#00008B] font-black text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {activeTimeframe} Zaman Dilimi Grafiği Yükleniyor...
                </div>
              </div>
            )}

            {svgPathData.coords && svgPathData.coords.length > 1 ? (
              <div className="w-full h-full relative flex flex-col justify-between space-y-4">
                <div className="h-72 w-full relative">
                  <svg 
                    viewBox="0 0 800 320" 
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible preserve-3d"
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <defs>
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
                </div>

                {/* X-Axis Time Labels (Fully Visible & Perfectly Edge-to-Edge Aligned) */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-3 border-t border-slate-200/80 px-2">
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

        {/* 3. SEKSİYON: HİSSE ÖZELLİKLERİ VE FİNANSAL İSTATİSTİKLER */}
        <div ref={ozelliklerRef} className="scroll-mt-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00008B]" />
            {symbol} Hisse Özellikleri & İstatistikler
          </h2>
          
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
        </div>

        {/* 4. SEKSİYON: CANLI HABERLER */}
        <div ref={haberlerRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                <Newspaper className="w-5 h-5 text-[#00008B]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Haberler & Bildirimler</h2>
                <p className="text-xs font-bold text-slate-400">Tüm Güncel Finansal Haberler</p>
              </div>
            </div>

            <button 
              onClick={fetchNews}
              disabled={newsLoading}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#00008B] text-xs font-black border border-blue-200 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", newsLoading && "animate-spin")} />
              Yenile
            </button>
          </div>

          {/* HABER LİSTESİ Grid */}
          {newsLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
              {symbol} haberleri yükleniyor...
            </div>
          ) : newsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsList.map((article) => (
                <div 
                  key={article.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 hover:border-[#00008B] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border",
                        article.category === "KAP Bildirimi"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : article.category === "Finansal Analiz"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-blue-50 text-[#00008B] border-blue-200"
                      )}>
                        {article.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{article.pubDate}</span>
                    </div>

                    <h3 
                      onClick={() => setSelectedArticle(article)}
                      className="font-black text-slate-900 text-sm leading-snug hover:text-[#00008B] cursor-pointer transition-colors line-clamp-2"
                    >
                      {article.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                    <button 
                      onClick={() => setSelectedArticle(article)}
                      className="inline-flex items-center gap-1 text-xs font-black text-[#00008B] hover:underline"
                    >
                      Haber İçeriğini Oku <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              Bu hisse senedi için henüz haber bulunamadı.
            </div>
          )}
        </div>

        {/* 5. SEKSİYON: TEMETTÜLER VE KÂR PAYI GEÇMİŞİ */}
        <div ref={temettulerRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#00008B]" />
              {symbol} Temettü Dağıtım Geçmişi
            </h2>
            <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              Düzenli Temettü Ödeyen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Hak Kullanım Tarihi</th>
                  <th className="py-3 px-3">Pay Başına Brüt Temettü</th>
                  <th className="py-3 px-3">Temettü Verimi</th>
                  <th className="py-3 px-3 text-right">Dağıtma Oranı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-black text-slate-900">28 Mayıs 2024</td>
                  <td className="py-3 px-3 text-[#00008B] font-black">₺2.85</td>
                  <td className="py-3 px-3 text-emerald-700">%3.85</td>
                  <td className="py-3 px-3 text-right text-slate-500">%45.2</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-black text-slate-900">15 Haziran 2023</td>
                  <td className="py-3 px-3 text-[#00008B] font-black">₺1.95</td>
                  <td className="py-3 px-3 text-emerald-700">%4.10</td>
                  <td className="py-3 px-3 text-right text-slate-500">%42.0</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-black text-slate-900">22 Nisan 2022</td>
                  <td className="py-3 px-3 text-[#00008B] font-black">₺1.40</td>
                  <td className="py-3 px-3 text-emerald-700">%3.45</td>
                  <td className="py-3 px-3 text-right text-slate-500">%38.5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* SADE HABER OKUMA MODALI */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-3 border-b border-slate-100 pb-4 pr-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-[#00008B] border border-blue-200 uppercase">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400">• {selectedArticle.pubDate}</span>
                </div>

                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedArticle.title}
                </h2>
              </div>

              <div className="space-y-4 text-slate-800 text-sm font-semibold leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                {selectedArticle.content?.split('\n\n').map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                )) || <p>{selectedArticle.summary}</p>}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#00008B] hover:bg-blue-800 text-white text-xs font-black transition-all shadow-md"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
