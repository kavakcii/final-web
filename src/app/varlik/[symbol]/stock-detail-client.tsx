"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Plus, 
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
  Layers,
  HelpCircle,
  Info,
  Calculator,
  TrendingUp,
  Table as TableIcon
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import halkarzAboutDb from "@/data/halkarz_about_db.json";
import TradingViewStockChart from "@/components/TradingViewStockChart";
import FinancialRatioHistoryChart from "@/components/FinancialRatioHistoryChart";

// REEL BIST FİYAT KATALOĞU (Yedek Referans)
const BIST_REAL_PRICES: Record<string, { current: number; high: number; low: number; change: number; changePercent: number; prevClose: number }> = {
  "ASELS": { current: 363.25, high: 433.09, low: 320.00, change: -17.25, changePercent: -4.54, prevClose: 380.50 },
  "THYAO": { current: 312.00, high: 345.50, low: 265.00, change: +4.50, changePercent: +1.46, prevClose: 307.50 },
  "EREGL": { current: 52.40, high: 61.20, low: 44.10, change: -0.80, changePercent: -1.50, prevClose: 53.20 },
  "TUPRS": { current: 168.50, high: 205.00, low: 142.00, change: +2.10, changePercent: +1.26, prevClose: 166.40 },
  "KCHOL": { current: 224.00, high: 270.00, low: 195.00, change: -3.50, changePercent: -1.54, prevClose: 227.50 },
  "SAHOL": { current: 98.50, high: 115.00, low: 82.00, change: +1.20, changePercent: +1.23, prevClose: 97.30 },
  "GARAN": { current: 118.00, high: 138.00, low: 94.00, change: -2.10, changePercent: -1.75, prevClose: 120.10 },
  "AKBNK": { current: 62.50, high: 74.00, low: 48.00, change: +0.90, changePercent: +1.46, prevClose: 61.60 },
  "ISCTR": { current: 14.80, high: 18.20, low: 11.50, change: -0.15, changePercent: -1.00, prevClose: 14.95 },
  "YKBNK": { current: 31.20, high: 39.00, low: 24.00, change: +0.40, changePercent: +1.30, prevClose: 30.80 }
};

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
  "TKFEN": "Tekfen Holding A.Ş.",
  "KARSN": "Karsan Otomotiv Sanayii ve Ticaret A.Ş."
};

/**
 * Format money in millions/billions/trillions with currency symbol
 * Strictly returns 'Veri Mevcut Değil' when amount is null/undefined
 */
function formatMoney(amount: number | null | undefined, currency: string = '₺'): string {
  if (amount == null || isNaN(amount)) return 'Veri Mevcut Değil';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const curr = currency === 'USD' ? '$' : '₺';
  
  if (abs >= 1_000_000_000_000) {
    return `${sign}${curr}${(abs / 1_000_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Trilyon`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${curr}${(abs / 1_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Milyar`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${curr}${(abs / 1_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Milyon`;
  }
  if (abs >= 1_000) {
    return `${sign}${curr}${(abs / 1_000).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Bin`;
  }
  return `${sign}${curr}${abs.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Maps backend ratio status to exact Turkish UX badge and styling
 */
function getRatioStatusBadge(status: string) {
  switch (status) {
    case 'available':
      return { label: 'Doğrulandı', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'insufficient_data':
      return { label: 'Eksik Veri', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'insufficient_history':
      return { label: 'Yetersiz Geçmiş Veri', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'negative_input':
      return { label: 'Negatif Girdi', className: 'bg-rose-50 text-rose-800 border-rose-200' };
    case 'not_applicable':
      return { label: 'Sektör Dışı', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'unavailable':
    default:
      return { label: 'Kullanılamıyor', className: 'bg-rose-50 text-rose-800 border-rose-200' };
  }
}

export default function StockDetailClient({ symbol: rawSymbol }: { symbol: string }) {
  // Clean symbol (Remove .IS suffix for clean UI display)
  const symbol = rawSymbol.toUpperCase().replace(/\.IS$/, '').trim();

  const [activeTimeframe, setActiveTimeframe] = useState("1G");
  const [activeNavTab, setActiveNavTab] = useState("genel");
  const [activeFinancialTab, setActiveFinancialTab] = useState<"income" | "balance" | "cashFlow">("income");
  const [statementPeriodType, setStatementPeriodType] = useState<"quarterly" | "annual">("quarterly");
  
  // Real BIST Price & Chart Data State
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // News feeds state
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Dividend history state
  const [dividendList, setDividendList] = useState<any[]>([]);
  const [dividendLoading, setDividendLoading] = useState(false);

  // Fundamentals & Ratio State
  const [fundamentalsData, setFundamentalsData] = useState<any>(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState<boolean>(true);

  const [ratiosData, setRatiosData] = useState<any>(null);
  const [ratiosLoading, setRatiosLoading] = useState<boolean>(true);
  const [selectedRatioTooltip, setSelectedRatioTooltip] = useState<any>(null);
  const [activeRatioCategory, setActiveRatioCategory] = useState<string>("valuation");

  // Sector Comparison & Historical Trend State
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(true);

  // Stage 6 Historical Multi-Period Analysis State
  const [historicalAnalysisData, setHistoricalAnalysisData] = useState<any>(null);
  const [historicalAnalysisLoading, setHistoricalAnalysisLoading] = useState<boolean>(true);

  // Fetch Fundamentals, Ratios, Comparison & Dividends
  useEffect(() => {
    async function loadFundamentals() {
      try {
        setFundamentalsLoading(true);
        const res = await fetch(`/api/finance/fundamentals?symbol=${symbol}`);
        if (res.ok) {
          const json = await res.json();
          setFundamentalsData(json);
        }
      } catch (e) {
        console.error('Fundamentals load error:', e);
      } finally {
        setFundamentalsLoading(false);
      }
    }

    async function loadRatios() {
      try {
        setRatiosLoading(true);
        const res = await fetch(`/api/finance/ratios?symbol=${symbol}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRatiosData(json.data);
          }
        }
      } catch (e) {
        console.error('Ratios load error:', e);
      } finally {
        setRatiosLoading(false);
      }
    }

    async function loadComparison() {
      try {
        setComparisonLoading(true);
        const res = await fetch(`/api/finance/comparison?symbol=${symbol}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setComparisonData(json.data);
          }
        }
      } catch (e) {
        console.error('Comparison load error:', e);
      } finally {
        setComparisonLoading(false);
      }
    }

    async function loadHistoricalAnalysis() {
      try {
        setHistoricalAnalysisLoading(true);
        const res = await fetch(`/api/finance/historical-analysis?symbol=${symbol}&periodType=${statementPeriodType}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setHistoricalAnalysisData(json.data);
          }
        }
      } catch (e) {
        console.error('Historical analysis load error:', e);
      } finally {
        setHistoricalAnalysisLoading(false);
      }
    }

    async function loadDividends() {
      try {
        setDividendLoading(true);
        const res = await fetch('/api/halkarz-dividends');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const filtered = json.data.filter((d: any) => d.symbol === symbol);
            setDividendList(filtered);
          }
        }
      } catch (e) {
        console.error('Dividend load error:', e);
      } finally {
        setDividendLoading(false);
      }
    }

    loadFundamentals();
    loadRatios();
    loadComparison();
    loadHistoricalAnalysis();
    loadDividends();
  }, [symbol, statementPeriodType]);

  // Section Refs for Smooth Scrolling
  const genelRef = useRef<HTMLDivElement>(null);
  const ozetRef = useRef<HTMLDivElement>(null);
  const rasyolarRef = useRef<HTMLDivElement>(null);
  const karsilastirmaRef = useRef<HTMLDivElement>(null);
  const trendlerRef = useRef<HTMLDivElement>(null);
  const tablolarRef = useRef<HTMLDivElement>(null);
  const temettulerRef = useRef<HTMLDivElement>(null);
  const guvenilirlikRef = useRef<HTMLDivElement>(null);
  const haberlerRef = useRef<HTMLDivElement>(null);

  const fullName = STOCK_NAMES[symbol] || fundamentalsData?.companyName || `${symbol} Sanayi ve Ticaret A.Ş.`;

  // Instant local about text
  const aboutText = useMemo(() => {
    const cached = (halkarzAboutDb as Record<string, string>)[symbol];
    if (cached && cached.length > 30) {
      return cached;
    }
    return `${symbol} (${fullName}), Borsa İstanbul (BIST) piyasasında sürdürülebilir büyüme odaklı faaliyet gösteren, yüksek üretim kapasitesine ve geniş hizmet ağına sahip Türkiye’nin önde gelen kuruluşları arasında yer almaktadır.`;
  }, [symbol, fullName]);

  // BIST Trading Hours Check (09:55 - 18:10 Istanbul Time)
  const isBistMarketOpen = useMemo(() => {
    try {
      const trTimeStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
      const trDate = new Date(trTimeStr);
      const day = trDate.getDay();
      if (day === 0 || day === 6) return false;
      const mins = trDate.getHours() * 60 + trDate.getMinutes();
      return mins >= 595 && mins <= 1090;
    } catch (e) {
      return false;
    }
  }, []);

  // Fetch stock detail & chart data with AbortController
  const fetchStockData = async (tf: string, isQuiet: boolean = false, signal?: AbortSignal) => {
    if (!isQuiet) setLoading(true);
    try {
      const res = await fetch(`/api/bist/stock?symbol=${symbol}&timeframe=${tf}`, { signal });
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error("Failed to fetch stock data:", e);
    } finally {
      if (!isQuiet && (!signal || !signal.aborted)) setLoading(false);
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

  // 60-Second background polling for live price
  useEffect(() => {
    const controller = new AbortController();
    fetchStockData(activeTimeframe, false, controller.signal);
    fetchNews();

    const intervalId = setInterval(() => {
      fetchStockData(activeTimeframe, true);
    }, 60000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [symbol, activeTimeframe]);

  const scrollToSection = (tabId: string) => {
    setActiveNavTab(tabId);
    let targetRef: React.RefObject<HTMLDivElement | null> | null = null;
    if (tabId === "genel") targetRef = genelRef;
    else if (tabId === "finansal-ozet") targetRef = ozetRef;
    else if (tabId === "rasyolar") targetRef = rasyolarRef;
    else if (tabId === "karsilastirma") targetRef = karsilastirmaRef;
    else if (tabId === "trendler") targetRef = trendlerRef;
    else if (tabId === "tablolar") targetRef = tablolarRef;
    else if (tabId === "temettuler") targetRef = temettulerRef;
    else if (tabId === "guvenilirlik") targetRef = guvenilirlikRef;
    else if (tabId === "haberler") targetRef = haberlerRef;

    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Currency of financial statements (TRY vs USD)
  const finCurrency = fundamentalsData?.quarters?.[0]?.period?.currency || fundamentalsData?.ttm?.periodsUsed?.[0]?.currency || fundamentalsData?.currency || 'TRY';
  const isUsdFinancials = finCurrency === 'USD';

  // Derived Financial Summary Values from Fundamentals Data
  const ttmIncome = fundamentalsData?.ttm?.incomeStatementTTM;
  const ttmCashFlow = fundamentalsData?.ttm?.cashFlowTTM;
  const latestBs = fundamentalsData?.ttm?.latestBalanceSheetSnapshot;
  const isBank = fundamentalsData?.sectorInfo?.category === 'BANK';

  // Financial Summary Cards Data
  const summaryCards = useMemo(() => {
    return [
      {
        title: "Net Satışlar / Gelir",
        value: ttmIncome?.revenue != null ? formatMoney(ttmIncome.revenue, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: isUsdFinancials ? "USD bazlı bilanço geliri" : "Net satış hasılatı"
      },
      {
        title: "Net Dönem Kârı",
        value: ttmIncome?.netIncome != null ? formatMoney(ttmIncome.netIncome, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: ttmIncome?.netIncome != null && ttmIncome.netIncome < 0 ? "Net zarar açıklanmıştır" : "Ana ortaklık payları"
      },
      {
        title: "FAVÖK (EBITDA)",
        value: isBank ? "Sektör Dışı (N/A)" : (ttmIncome?.ebitda != null ? formatMoney(ttmIncome.ebitda, finCurrency) : "Veri Mevcut Değil"),
        period: isBank ? "Banka Modeli" : (fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri"),
        type: isBank ? "Uygulanmaz" : "Yıllıklandırılmış Akış (TTM)",
        note: isBank ? "Bankacılıkta FAVÖK kullanılmaz" : "Faiz ve vergi öncesi operasyonel kâr"
      },
      {
        title: "Toplam Özkaynaklar",
        value: latestBs?.totalEquity != null ? formatMoney(latestBs.totalEquity, finCurrency) : "Veri Mevcut Değil",
        period: "Son Bilanço",
        type: "Bilanço Snapshot",
        note: "Şirketin net defter değeri"
      },
      {
        title: "Toplam Varlıklar (Aktifler)",
        value: latestBs?.totalAssets != null ? formatMoney(latestBs.totalAssets, finCurrency) : "Veri Mevcut Değil",
        period: "Son Bilanço",
        type: "Bilanço Snapshot",
        note: "Dönen ve duran varlıklar toplamı"
      },
      {
        title: "Net Finansal Borç",
        value: isBank ? "Sektör Dışı (N/A)" : (latestBs?.netDebt != null ? formatMoney(latestBs.netDebt, finCurrency) : "Veri Mevcut Değil"),
        period: isBank ? "Banka Modeli" : "Son Bilanço",
        type: isBank ? "Uygulanmaz" : "Bilanço Snapshot",
        note: isBank ? "Bankacılıkta Net Borç kullanılmaz" : "Finansal Borçlar - Nakit Varlıklar"
      },
      {
        title: "Serbest Nakit Akışı (FCF)",
        value: ttmCashFlow?.freeCashFlow != null ? formatMoney(ttmCashFlow.freeCashFlow, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: "İşletme Nakit Akışı - Yatırım Harcamaları"
      }
    ];
  }, [fundamentalsData, ttmIncome, ttmCashFlow, latestBs, isBank, finCurrency, isUsdFinancials]);

  // Multi-Period Statements (Quarterly vs Annual)
  const displayedPeriods = useMemo(() => {
    if (statementPeriodType === 'annual') {
      return fundamentalsData?.annuals && fundamentalsData.annuals.length > 0
        ? fundamentalsData.annuals
        : (fundamentalsData?.quarters || []);
    }
    return fundamentalsData?.quarters || [];
  }, [fundamentalsData, statementPeriodType]);

  // Combined Historical Dividends
  const combinedDividends = useMemo(() => {
    const livePrice = stockData?.currentPrice || BIST_REAL_PRICES[symbol]?.current || null;
    const historyDivs = fundamentalsData?.dividends || [];
    
    if (historyDivs.length > 0) {
      return historyDivs.map((d: any) => ({
        paymentDate: d.exDate || d.paymentDate,
        grossAmount: d.grossAmount,
        netAmount: d.netAmount ?? parseFloat((d.grossAmount * 0.90).toFixed(4)),
        netAmountFormatted: `${(d.netAmount ?? (d.grossAmount * 0.90)).toFixed(4)} ₺`,
        yieldPercent: livePrice && livePrice > 0 ? ((d.grossAmount / livePrice) * 100) : 0,
        source: d.source || 'Yahoo/KAP Arşivi'
      }));
    }
    
    return dividendList.map((item: any) => ({
      ...item,
      source: 'Halkarz / BIST Kataloğu'
    }));
  }, [fundamentalsData, dividendList, stockData, symbol]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden relative">
      
      {/* ========================================================================= */}
      {/* 1. SOL DÜZEN: LACİVERT SOL MENÜ (#00008B) - SEMBOL, FİYAT VE SEKMELER */}
      {/* ========================================================================= */}
      <aside className="w-64 shrink-0 min-h-screen bg-[#00008B] text-white p-5 space-y-6 flex flex-col justify-between shadow-2xl z-20">
        <div className="space-y-6">
          
          {/* SEMBOL, ŞİRKET ADI VE CANLI FİYAT */}
          <div className="flex items-center gap-3 border-b border-blue-800/80 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#00008B] flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {symbol.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1.5">
                <h1 className="text-xl font-black text-white tracking-tight truncate">{symbol}</h1>
                <span className="text-xs font-black text-blue-100 whitespace-nowrap bg-blue-900/60 px-2 py-0.5 rounded-lg border border-blue-700/60">
                  {stockData?.currentPrice ? `${stockData.currentPrice.toFixed(2)} ₺` : (BIST_REAL_PRICES[symbol]?.current ? `${BIST_REAL_PRICES[symbol].current.toFixed(2)} ₺` : "--- ₺")}
                </span>
              </div>
              <p className="text-[10px] font-bold text-blue-200/80 truncate max-w-[150px] mt-0.5">{fullName}</p>
            </div>
          </div>

          {/* MENÜ BAŞLIKLARI (AŞAMA 3 Mantıksal Sıralaması) */}
          <div className="space-y-1 pt-1">
            {[
              { id: "genel", label: "Genel Bakış & Grafik", icon: BarChart3 },
              { id: "finansal-ozet", label: "Finansal Özet", icon: PieChart },
              { id: "rasyolar", label: "Temel Rasyolar", icon: Calculator },
              { id: "karsilastirma", label: "Sektör Karşılaştırma", icon: Layers },
              { id: "trendler", label: "Finansal Trendler", icon: TrendingUp },
              { id: "tablolar", label: "Finansal Tablolar", icon: TableIcon },
              { id: "temettuler", label: "Temettüler", icon: Coins },
              { id: "guvenilirlik", label: "Veri Altyapısı", icon: ShieldCheck },
              { id: "haberler", label: "KAP Haberleri", icon: Newspaper }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-black transition-all border text-left",
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
          FinAI ® Doğrulanmış Finansal Katman
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ORTA VE SAĞ İÇERİK ALANI (CLEAN #F8FAFC) */}
      {/* ========================================================================= */}
      <main className="flex-1 bg-[#F8FAFC] min-h-screen p-5 md:p-8 space-y-8 text-slate-900 max-w-full overflow-hidden">
        
        {/* ÜST GEZİNTİ VE İŞLEM BARI */}
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

        {/* ========================================================================= */}
        {/* A) ŞİRKET HEADER & BİST PROFİLİ */}
        {/* ========================================================================= */}
        <div ref={genelRef} className="scroll-mt-6 space-y-4">
          <div className="bg-[#00008B] text-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-blue-900">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-black text-white tracking-tight">{symbol}</span>
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-blue-900/80 border border-blue-700 text-blue-200">
                    {fundamentalsData?.sectorInfo?.displayName || "BIST Şirketi"}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-blue-100 mt-1">{fullName}</h2>
              </div>

              {/* CANLI FİYAT VE GÜNLÜK DEĞİŞİM */}
              <div className="flex items-center gap-3 self-start sm:self-auto bg-blue-950/60 p-3 rounded-2xl border border-blue-800">
                <div className="text-right">
                  <div className="text-xl font-black text-white">
                    {stockData?.currentPrice ? `${stockData.currentPrice.toFixed(2)} ₺` : (BIST_REAL_PRICES[symbol]?.current ? `${BIST_REAL_PRICES[symbol].current.toFixed(2)} ₺` : "--- ₺")}
                  </div>
                  <div className={cn(
                    "text-xs font-black flex items-center justify-end gap-1",
                    (stockData?.changePercent || 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                  )}>
                    {(stockData?.changePercent || 0) >= 0 ? "+" : ""}{stockData?.change ? stockData.change.toFixed(2) : "0.00"} ₺ ({(stockData?.changePercent || 0) >= 0 ? "+" : ""}{stockData?.changePercent ? stockData.changePercent.toFixed(2) : "0.00"}%)
                  </div>
                </div>
              </div>
            </div>

            {/* USD PARA BİRİMİ DÖNÜŞÜM BİLGİLENDİRMESİ (THYAO vb.) */}
            {isUsdFinancials && (
              <div className="bg-sky-950/70 border border-sky-700/80 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-sky-100">
                <Info className="w-4 h-4 text-sky-300 shrink-0" />
                <p className="leading-relaxed font-semibold">
                  <strong className="text-white">Para Birimi Bilgisi:</strong> Şirket finansal tablolarını <strong>USD ($)</strong> bazında raporlamaktadır. F/K ve PD/DD gibi borsa çarpanlarında güncel döviz kuru ile para birimi dönüşümü uygulanmıştır.
                </p>
              </div>
            )}

            {/* HAKKINDA METNİ */}
            <div className="text-blue-100 text-xs md:text-sm font-medium leading-relaxed pt-1">
              {aboutText}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* B) FİYAT / PİYASA ÖZETİ & TRADINGVIEW CHART (GRAFİK DOKUNULMAZ) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* TRADINGVIEW STOCK CHART BİLEŞENİ (KESİNLİKLE KORUNAN BİLEŞEN) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00008B]" />
                {symbol} Fiyat Grafiği
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                TradingView Lightweight Engine
              </span>
            </div>

            <div className="w-full relative min-h-[380px]">
              <TradingViewStockChart
                symbol={symbol}
                chartPoints={stockData?.chartPoints || []}
                activeTimeframe={activeTimeframe}
                onTimeframeChange={(tf) => setActiveTimeframe(tf)}
                loading={loading}
                error={stockData?.error || null}
                currency="₺"
                isMarketOpen={isBistMarketOpen}
                marketStatusText={isBistMarketOpen ? "Piyasa Açık (Canlı)" : "Piyasa Kapalı"}
                lastUpdated={stockData?.lastUpdated}
                currentPrice={stockData?.currentPrice}
                priceChange={stockData?.change}
                priceChangePercent={stockData?.changePercent}
                onRetry={() => fetchStockData(activeTimeframe)}
              />
            </div>
          </div>

          {/* SAĞ PANEL: PİYASA İSTATİSTİKLERİ */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00008B]" />
                Piyasa İstatistikleri
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200">
                BIST Verisi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-blue-600" />
                  Piyasa Değeri
                </span>
                <p className="text-sm font-black text-[#00008B] truncate">
                  {stockData?.marketCap || (fundamentalsData?.marketCap ? formatMoney(fundamentalsData.marketCap, 'TRY') : "Veri Mevcut Değil")}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  İşlem Hacmi (24s)
                </span>
                <p className="text-sm font-black text-[#00008B] truncate">
                  {stockData?.volume || "Veri Mevcut Değil"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  52 Haftalık Dip / Tepe
                </span>
                <p className="text-xs font-black text-slate-800">
                  {stockData?.low52 ? `${stockData.low52.toFixed(2)} ₺` : "---"} - {stockData?.high52 ? `${stockData.high52.toFixed(2)} ₺` : "---"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5 text-purple-600" />
                  Dolaşımdaki Paylar
                </span>
                <p className="text-xs font-black text-[#00008B] truncate">
                  {fundamentalsData?.sharesOutstanding ? `${(fundamentalsData.sharesOutstanding / 1_000_000).toFixed(0)} Milyon Adet` : "Veri Mevcut Değil"}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00008B]" />
                Seans Durumu:
              </span>
              {isBistMarketOpen ? (
                <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Piyasa Açık (Canlı)
                </span>
              ) : (
                <span className="font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200">
                  Piyasa Kapalı
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* C) FİNANSAL ÖZET (7 TEMEL FİNANSAL KART) */}
        {/* ========================================================================= */}
        <div ref={ozetRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#00008B]" />
                {symbol} Finansal Özet Tablosu
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Şirketin Büyüklüğü, Kârlılığı, Özsermayesi ve Nakit Üretim Gücü
              </p>
            </div>

            <span className="text-xs font-black px-3 py-1 rounded-xl bg-blue-50 text-[#00008B] border border-blue-200 self-start sm:self-auto">
              Bilanço Para Birimi: {finCurrency}
            </span>
          </div>

          {fundamentalsLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
              Finansal özet verileri yükleniyor...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "bg-slate-50/90 border border-slate-200/90 p-4 rounded-2xl space-y-2.5 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between",
                    idx === 0 ? "lg:col-span-2" : ""
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                        {card.title}
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white text-[#00008B] border border-slate-200">
                        {card.period}
                      </span>
                    </div>

                    <p className={cn(
                      "text-xl font-black tracking-tight pt-1",
                      card.value === "Veri Mevcut Değil" || card.value === "Sektör Dışı (N/A)" ? "text-slate-400 text-base" : "text-[#00008B]"
                    )}>
                      {card.value}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{card.type}</span>
                    <span className="truncate max-w-[140px]" title={card.note}>{card.note}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* D) TEMEL RASYOLAR & DEĞERLEME ÇARPANLARI */}
        {/* ========================================================================= */}
        <div ref={rasyolarRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                <Calculator className="w-5 h-5 text-[#00008B]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Finansal Rasyolar & Değerleme Çarpanları</h3>
                <p className="text-xs font-bold text-slate-400">Doğrulanmış Bilanço ve TTM Verilerine Dayalı Finansal Göstergeler</p>
              </div>
            </div>

            {ratiosData?.quality && (
              <div className="flex items-center gap-2 text-xs font-black self-start md:self-auto">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
                  Doğrulanmış Rasyo: {ratiosData.quality.availableRatioCount} / {ratiosData.quality.totalRatioCount}
                </span>
              </div>
            )}
          </div>

          {ratiosLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
              Finansal rasyolar hesaplanıyor...
            </div>
          ) : ratiosData?.categories ? (
            <div className="space-y-6">
              {/* Kategori Seçiciler */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "valuation", label: "Değerleme (F/K, PD/DD)" },
                  { id: "profitability", label: "Kârlılık (ROE, ROA)" },
                  { id: "leverage", label: "Borçluluk" },
                  { id: "liquidity", label: "Likidite" },
                  { id: "perShare", label: "Hisse Başına" },
                  { id: "operational", label: "Operasyonel Verimlilik" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveRatioCategory(cat.id)}
                    className={cn(
                      "px-3.5 py-2 text-xs font-black rounded-xl transition-all border whitespace-nowrap flex items-center gap-1.5",
                      activeRatioCategory === cat.id
                        ? "bg-[#00008B] text-white border-[#00008B] shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Rasyo Kartları Grid */}
              {ratiosData.categories[activeRatioCategory] && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {ratiosData.categories[activeRatioCategory].description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ratiosData.categories[activeRatioCategory].ratios.map((item: any) => {
                      const badge = getRatioStatusBadge(item.status);
                      return (
                        <div 
                          key={item.key}
                          className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-black text-slate-800 leading-tight">
                                {item.name}
                              </span>
                              <button
                                onClick={() => setSelectedRatioTooltip(item)}
                                className="p-1 rounded-lg bg-blue-50 text-[#00008B] hover:bg-blue-100 transition-colors"
                                title="FinAI Eğitici Not & Metodoloji"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-baseline justify-between pt-1">
                              <span className={cn(
                                "text-2xl font-black tracking-tight",
                                item.status === "available" ? "text-[#00008B]" : "text-slate-400 text-lg"
                              )}>
                                {item.formattedValue || "Veri Mevcut Değil"}
                              </span>
                              
                              <span 
                                title={item.reason}
                                className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider cursor-help",
                                  badge.className
                                )}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span className="truncate max-w-[170px]" title={item.methodology}>
                              {item.methodology}
                            </span>
                            <span className="text-[#00008B] bg-blue-50 px-1.5 py-0.5 rounded font-black">
                              {item.periodLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              Finansal rasyo verisi temin edilemedi.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* E) SEKTÖR KARŞILAŞTIRMASI & MEDYAN ANALİZİ */}
        {/* ========================================================================= */}
        <div ref={karsilastirmaRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5 text-[#00008B]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Sektör Karşılaştırması</h3>
                <p className="text-xs font-bold text-slate-400">
                  Uç Değerlerden Arındırılmış Sektör Medyanı (Ortanca) ve Persentil Konumu
                </p>
              </div>
            </div>

            {comparisonData && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-black self-start md:self-auto">
                <span className="bg-blue-50 text-[#00008B] border border-blue-200 px-3 py-1 rounded-xl">
                  Sektör: {comparisonData.sectorDisplayName}
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
                  Doğrulanmış Akran: {comparisonData.validPeerCount} Şirket
                </span>
              </div>
            )}
          </div>

          {comparisonLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
              Sektör akran verileri ve medyanlar hesaplanıyor...
            </div>
          ) : comparisonData?.metrics ? (
            <div className="space-y-6">
              
              {/* SEKTÖR TABLOSU */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Metrik Adı</th>
                      <th className="py-3 px-4">Şirket Değeri</th>
                      <th className="py-3 px-4">Sektör Medyanı</th>
                      <th className="py-3 px-4">Fark</th>
                      <th className="py-3 px-4">Sektör İçi Konum</th>
                      <th className="py-3 px-4 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {Object.values(comparisonData.metrics as Record<string, any>).map((m: any) => (
                      <tr key={m.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-1.5">
                          {m.name}
                          <button
                            onClick={() => setSelectedRatioTooltip({
                              name: m.name,
                              formattedValue: m.formattedCompanyValue,
                              educationalTooltip: {
                                whatItMeasures: m.educationalNote,
                                howToInterpret: m.positionText,
                                sectorCaution: `Sektör Medyanı: ${m.formattedSectorMedian} (Örneklem: ${m.sampleSize} şirket). Uç değerler ve negatif kârlar medyan hesabına dahil edilmez.`,
                                finaiFormula: `Fark = Şirket Değeri - Sektör Medyanı (${m.formattedDifference})`
                              }
                            })}
                            className="p-0.5 rounded text-blue-600 hover:bg-blue-50"
                            title="Eğitici Not & Metodoloji"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#00008B]">
                          {m.formattedCompanyValue || "Veri Mevcut Değil"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {m.formattedSectorMedian}
                        </td>
                        <td className="py-3.5 px-4">
                          {m.difference != null ? (
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-black text-[11px]",
                              m.difference > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-blue-50 text-blue-900 border border-blue-200"
                            )}>
                              {m.formattedDifference}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-800">
                            {m.positionText}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                            m.status === "available"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : m.status === "not_applicable"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : m.status === "insufficient_sample"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          )} title={m.reason}>
                            {m.status === "available"
                              ? "Doğrulandı"
                              : m.status === "not_applicable"
                              ? "Sektör Dışı"
                              : m.status === "insufficient_sample"
                              ? "Yetersiz Örneklem"
                              : "Veri Yok"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* YILLIK BÜYÜME METRİKLERİ */}
              {comparisonData.growth && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00008B]" />
                    Karşılaştırmalı Yıllık Büyüme Oranları (YoY)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      comparisonData.growth.revenueGrowthYoY,
                      comparisonData.growth.ebitdaGrowthYoY,
                      comparisonData.growth.netIncomeGrowthYoY,
                      comparisonData.growth.epsGrowthYoY
                    ].map((g: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                          {g?.metricName}
                        </span>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className={cn(
                            "text-base font-black tracking-tight",
                            g?.status === 'available' ? (g.value >= 0 ? "text-emerald-700" : "text-rose-700") : "text-slate-400 text-xs"
                          )}>
                            {g?.formattedValue || "Veri Mevcut Değil"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold truncate max-w-[90px]" title={g?.reason}>
                            {g?.status === 'available' ? 'Yıllık (YoY)' : 'Hesaplanamadı'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              Sektör karşılaştırması için yeterli veri bulunmuyor.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* F) FİNANSAL TRENDLER (HISTORICAL CHART) */}
        {/* ========================================================================= */}
        <div ref={trendlerRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00008B]" />
                {symbol} Tarihsel Finansal Trendler & Rasyo Analizi
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Şirketin Gerçek Raporlama Dönemleri Boyunca Finansal Gelişimi ({statementPeriodType === 'annual' ? 'Yıllık' : 'Çeyreklik'})
              </p>
            </div>

            {/* Dönem Tipi Seçici */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => setStatementPeriodType("quarterly")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-black rounded-lg transition-all",
                  statementPeriodType === "quarterly"
                    ? "bg-[#00008B] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#00008B]"
                )}
              >
                Çeyreklik (3A)
              </button>
              <button
                onClick={() => setStatementPeriodType("annual")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-black rounded-lg transition-all",
                  statementPeriodType === "annual"
                    ? "bg-[#00008B] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#00008B]"
                )}
              >
                Yıllık (12A)
              </button>
            </div>
          </div>

          {(historicalAnalysisData?.periods && historicalAnalysisData.periods.length > 0) || (comparisonData?.historicalTrend && comparisonData.historicalTrend.length > 0) ? (
            <FinancialRatioHistoryChart 
              historicalData={historicalAnalysisData}
              historicalTrend={comparisonData?.historicalTrend} 
              symbol={symbol}
              currency={finCurrency === 'USD' ? '$' : '₺'}
            />
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
              Yeterli tarihsel veri bulunamadı.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* G, H, I) FİNANSAL TABLOLAR (GELİR TABLOSU, BİLANÇO, NAKİT AKIŞI) */}
        {/* ========================================================================= */}
        <div ref={tablolarRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-[#00008B]" />
                {symbol} Finansal Tablolar
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Resmi Raporlama Dönemleri Bazında Gelir Tablosu, Bilanço ve Nakit Akışı
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Dönem Tipi Seçici (Çeyreklik / Yıllık) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setStatementPeriodType("quarterly")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-black rounded-lg transition-all",
                    statementPeriodType === "quarterly"
                      ? "bg-white text-[#00008B] shadow-sm"
                      : "text-slate-500 hover:text-[#00008B]"
                  )}
                >
                  Çeyreklik (3A)
                </button>
                <button
                  onClick={() => setStatementPeriodType("annual")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-black rounded-lg transition-all",
                    statementPeriodType === "annual"
                      ? "bg-white text-[#00008B] shadow-sm"
                      : "text-slate-500 hover:text-[#00008B]"
                  )}
                >
                  Yıllık (12A)
                </button>
              </div>

              {/* Tablo Seçici Butonlar */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: "income", label: "Gelir Tablosu" },
                  { id: "balance", label: "Bilanço" },
                  { id: "cashFlow", label: "Nakit Akışı" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFinancialTab(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-black rounded-lg transition-all",
                      activeFinancialTab === tab.id
                        ? "bg-[#00008B] text-white shadow-sm"
                        : "text-slate-600 hover:text-[#00008B]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {displayedPeriods.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Kalem ({finCurrency})</th>
                    {displayedPeriods.map((q: any, i: number) => (
                      <th key={i} className="py-3 px-4 text-right">
                        {q.period.periodType === 'ANNUAL' 
                          ? `${q.period.year} Yıllık`
                          : (q.period.periodLabel || `${q.period.year} Q${q.period.quarter}`)}
                      </th>
                    ))}
                    {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                      <th className="py-3 px-4 text-right text-[#00008B] bg-blue-50/50">
                        TTM (Son 4 Çeyrek)
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {activeFinancialTab === "income" && (
                    <>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-black text-slate-900">Satış Gelirleri (Revenue)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right text-slate-900 font-black">
                            {q.incomeStatement?.revenue != null ? formatMoney(q.incomeStatement.revenue, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/30">
                            {ttmIncome?.revenue != null ? formatMoney(ttmIncome.revenue, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Brüt Kâr (Gross Profit)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.incomeStatement?.grossProfit != null ? formatMoney(q.incomeStatement.grossProfit, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                            {ttmIncome?.grossProfit != null ? formatMoney(ttmIncome.grossProfit, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Faaliyet Kârı (EBIT)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.incomeStatement?.operatingIncome != null ? formatMoney(q.incomeStatement.operatingIncome, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                            {ttmIncome?.operatingIncome != null ? formatMoney(ttmIncome.operatingIncome, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">FAVÖK (EBITDA)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {isBank ? "Sektör Dışı (N/A)" : (q.incomeStatement?.ebitda != null ? formatMoney(q.incomeStatement.ebitda, finCurrency) : "Veri Yok")}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                            {isBank ? "Sektör Dışı (N/A)" : (ttmIncome?.ebitda != null ? formatMoney(ttmIncome.ebitda, finCurrency) : "Veri Yok")}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50 bg-slate-50/40">
                        <td className="py-3 px-4 font-black text-slate-900">Net Dönem Kârı (Net Income)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                            {q.incomeStatement?.netIncome != null ? formatMoney(q.incomeStatement.netIncome, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/60">
                            {ttmIncome?.netIncome != null ? formatMoney(ttmIncome.netIncome, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                    </>
                  )}

                  {activeFinancialTab === "balance" && (
                    <>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-black text-slate-900">Nakit ve Benzerleri</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.balanceSheet?.cashAndEquivalents != null ? formatMoney(q.balanceSheet.cashAndEquivalents, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Dönen Varlıklar (Current Assets)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.balanceSheet?.currentAssets != null ? formatMoney(q.balanceSheet.currentAssets, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                      <tr className="hover:bg-slate-50 bg-slate-50/40">
                        <td className="py-3 px-4 font-black text-slate-900">Toplam Varlıklar (Total Assets)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                            {q.balanceSheet?.totalAssets != null ? formatMoney(q.balanceSheet.totalAssets, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Kısa Vadeli Borçlar</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.balanceSheet?.currentLiabilities != null ? formatMoney(q.balanceSheet.currentLiabilities, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Net Finansal Borç</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {isBank ? "Sektör Dışı (N/A)" : (q.balanceSheet?.netDebt != null ? formatMoney(q.balanceSheet.netDebt, finCurrency) : "Veri Yok")}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                      <tr className="hover:bg-slate-50 bg-slate-50/40">
                        <td className="py-3 px-4 font-black text-slate-900">Toplam Özkaynaklar (Equity)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                            {q.balanceSheet?.totalEquity != null ? formatMoney(q.balanceSheet.totalEquity, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                      </tr>
                    </>
                  )}

                  {activeFinancialTab === "cashFlow" && (
                    <>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-black text-slate-900">İşletme Nakit Akışı (Operating CF)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right text-slate-900 font-black">
                            {q.cashFlowStatement?.operatingCashFlow != null ? formatMoney(q.cashFlowStatement.operatingCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30 font-black">
                            {ttmCashFlow?.operatingCashFlow != null ? formatMoney(ttmCashFlow.operatingCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Yatırım Harcamaları (CapEx)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.cashFlowStatement?.capitalExpenditures != null ? formatMoney(q.cashFlowStatement.capitalExpenditures, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            {ttmCashFlow?.capitalExpenditures != null ? formatMoney(ttmCashFlow.capitalExpenditures, finCurrency) : "—"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50 bg-slate-50/40">
                        <td className="py-3 px-4 font-black text-slate-900">Serbest Nakit Akışı (Free Cash Flow)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                            {q.cashFlowStatement?.freeCashFlow != null ? formatMoney(q.cashFlowStatement.freeCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/60">
                            {ttmCashFlow?.freeCashFlow != null ? formatMoney(ttmCashFlow.freeCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Yatırım Faaliyetlerinden Nakit Akışı</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.cashFlowStatement?.investingCashFlow != null ? formatMoney(q.cashFlowStatement.investingCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            {ttmCashFlow?.investingCashFlow != null ? formatMoney(ttmCashFlow.investingCashFlow, finCurrency) : "—"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Finansman Faaliyetlerinden Nakit Akışı</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.cashFlowStatement?.financingCashFlow != null ? formatMoney(q.cashFlowStatement.financingCashFlow, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            {ttmCashFlow?.financingCashFlow != null ? formatMoney(ttmCashFlow.financingCashFlow, finCurrency) : "—"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Ödenen Temettüler (Dividends Paid)</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.cashFlowStatement?.dividendsPaid != null ? formatMoney(q.cashFlowStatement.dividendsPaid, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            {ttmCashFlow?.dividendsPaid != null ? formatMoney(ttmCashFlow.dividendsPaid, finCurrency) : "—"}
                          </td>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-800">Net Nakit Değişimi</td>
                        {displayedPeriods.map((q: any, i: number) => (
                          <td key={i} className="py-3 px-4 text-right">
                            {q.cashFlowStatement?.netChangeInCash != null ? formatMoney(q.cashFlowStatement.netChangeInCash, finCurrency) : "Veri Yok"}
                          </td>
                        ))}
                        {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            {ttmCashFlow?.netChangeInCash != null ? formatMoney(ttmCashFlow.netChangeInCash, finCurrency) : "—"}
                          </td>
                        )}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
              Finansal tablo dönem verisi temin edilemedi.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* J) TEMETTÜLER VE KÂR PAYI GEÇMİŞİ */}
        {/* ========================================================================= */}
        <div ref={temettulerRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#00008B]" />
              {symbol} Temettü Dağıtım Geçmişi & Kâr Payı
            </h3>
            <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              Resmi Temettü Kayıtları ({combinedDividends.length} Ödeme)
            </span>
          </div>

          {dividendLoading ? (
            <div className="py-8 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00008B]" />
              Temettü verileri yükleniyor...
            </div>
          ) : combinedDividends.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Hak Kullanım / Ödeme Tarihi</th>
                    <th className="py-3 px-4">Pay Başına Net Temettü</th>
                    <th className="py-3 px-4">Temettü Verimi</th>
                    <th className="py-3 px-4">Kaynak</th>
                    <th className="py-3 px-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {combinedDividends.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{item.paymentDate}</td>
                      <td className="py-3 px-4 text-[#00008B] font-black">{item.netAmountFormatted}</td>
                      <td className="py-3 px-4 text-emerald-700 font-black">
                        {item.yieldPercent > 0 ? `%${item.yieldPercent.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400 font-medium">
                        {item.source}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Ödendi / Kesinleşti
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
              Bu hisse senedi için geçmiş temettü kaydı bulunmamaktadır.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* K) VERİ KAYNAĞI VE GÜVENİLİRLİK PANELİ */}
        {/* ========================================================================= */}
        <div ref={guvenilirlikRef} className="scroll-mt-6 bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-black text-white tracking-tight">FinAi Veri Altyapısı & Güvenilirlik Beyanı</h3>
                <p className="text-xs text-slate-400 font-medium">BIST Finansal Tablo Doğrulama ve Matematiksel Bütünlük Güvencesi</p>
              </div>
            </div>

            <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto">
              {fundamentalsData?.quality?.status === 'verified' ? 'Doğrulanmış Finansal Katman' : 'Kısmi / Doğrulama Aşamasında'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Veri Kaynağı</span>
              <p className="text-xs font-black text-white">{fundamentalsData?.quality?.sourceMetadata?.source || "Doğrulanmış BIST Finansal Tablo Katmanı"}</p>
              <span className="text-[9px] text-slate-400 font-medium block">
                {fundamentalsData?.quality?.sourceMetadata?.verifiedAt ? `Son Doğrulama: ${new Date(fundamentalsData.quality.sourceMetadata.verifiedAt).toLocaleDateString('tr-TR')}` : "Resmi Raporlama"}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kayıtlı Dönemler</span>
              <p className="text-xs font-black text-emerald-300">
                {fundamentalsData?.quarters?.length || 0} Çeyrek • {fundamentalsData?.annuals?.length || 0} Yıl
              </p>
              <span className="text-[9px] text-slate-400 font-medium block">Ayrık Finansal Tablolar</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TTM Bütünlüğü</span>
              <p className="text-xs font-black text-white">
                {fundamentalsData?.ttm?.isVerified ? "4 Çeyrek Tam (Doğrulandı)" : "Kısıtlı Geçmiş"}
              </p>
              <span className="text-[9px] text-slate-400 font-medium block">Sentetik Veri Kullanılmaz</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Para Birimi & Konsolidasyon</span>
              <p className="text-xs font-black text-white">
                {finCurrency} • Konsolide
              </p>
              <span className="text-[9px] text-slate-400 font-medium block">
                {isUsdFinancials ? "USD Orijinal Bilanço Raporu" : "BIST Standart TRY"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-2 border-t border-slate-800/80">
            * FinAi üzerindeki tüm finansal rasyolar ve sektör karşılaştırmaları, şirketlerin Kamuyu Aydınlatma Platformu (KAP) ve resmi finansal raporlamalarından derlenen doğrulanmış verilerle hesaplanmaktadır. Eksik çeyreklerde tahmin veya uydurma veri kullanılmaz. Tüm analizler finansal okuryazarlık amaçlıdır; doğrudan yatırım tavsiyesi içermez.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* L) CANLI HABERLER & KAP BİLDİRİMLERİ */}
        {/* ========================================================================= */}
        <div ref={haberlerRef} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                <Newspaper className="w-5 h-5 text-[#00008B]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Haberler & KAP Bildirimleri</h3>
                <p className="text-xs font-bold text-slate-400">Şirket Duyuruları ve Finansal Basın Akışı</p>
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

                    <h4 
                      onClick={() => setSelectedArticle(article)}
                      className="font-black text-slate-900 text-sm leading-snug hover:text-[#00008B] cursor-pointer transition-colors line-clamp-2"
                    >
                      {article.title}
                    </h4>
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
            <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
              Bu hisse senedi için henüz haber bulunamadı.
            </div>
          )}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* STAGE 3: EDUCATIONAL RATIO TOOLTIP MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRatioTooltip && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedRatioTooltip(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 border-b border-slate-100 pb-3 pr-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-[#00008B] border border-blue-200 uppercase">
                    FinAI Öğretici Analiz
                  </span>
                  <span className="text-xs font-bold text-slate-400">• {symbol}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedRatioTooltip.name} ({selectedRatioTooltip.formattedValue || "Veri Mevcut Değil"})
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold leading-relaxed">
                <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-[#00008B] block uppercase tracking-wider text-[10px]">
                    Bu Oran Neyi Ölçer?
                  </span>
                  <p className="text-slate-800">{selectedRatioTooltip.educationalTooltip?.whatItMeasures || "Oran analizi şirket kârlılığı ve değerlemesini ölçer."}</p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-emerald-800 block uppercase tracking-wider text-[10px]">
                    Nasıl Yorumlanır?
                  </span>
                  <p className="text-slate-800">{selectedRatioTooltip.educationalTooltip?.howToInterpret || "Sektör medyanı ile birlikte değerlendirilmelidir."}</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-amber-800 block uppercase tracking-wider text-[10px]">
                    Sektörel Dikkat Noktaları
                  </span>
                  <p className="text-slate-800">{selectedRatioTooltip.educationalTooltip?.sectorCaution || "Sektör dinamiklerine göre değişkenlik gösterir."}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-slate-700 block uppercase tracking-wider text-[10px]">
                    FinAI Formülü & Metodoloji
                  </span>
                  <p className="font-mono text-slate-900 text-[11px]">{selectedRatioTooltip.educationalTooltip?.finaiFormula || selectedRatioTooltip.methodology}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                  * FinAI analizleri öğretici amaçlıdır; doğrudan yatırım tavsiyesi içermez.
                </span>
                <button 
                  onClick={() => setSelectedRatioTooltip(null)}
                  className="px-5 py-2 rounded-xl bg-[#00008B] hover:bg-blue-800 text-white text-xs font-black transition-all shadow-md"
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SADE HABER OKUMA MODALI */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
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

                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedArticle.title}
                </h3>
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
