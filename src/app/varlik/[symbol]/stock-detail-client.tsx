"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  RefreshCw, 
  Plus, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Newspaper,
  X,
  PieChart,
  Coins,
  Activity,
  Layers,
  HelpCircle,
  Info,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Table as TableIcon,
  Search,
  CheckCircle2,
  Users,
  Target,
  Building2,
  Globe,
  MapPin,
  Briefcase,
  AlertCircle,
  Database
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import halkarzAboutDb from "@/data/halkarz_about_db.json";
import TradingViewStockChart from "@/components/TradingViewStockChart";
import FinancialRatioHistoryChart from "@/components/FinancialRatioHistoryChart";
import { DataStatusBadge } from "@/components/finai/DataStatusBadge";
import { DataQualityPanel } from "@/components/finai/DataQualityPanel";

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
    case 'VALID':
      return { label: 'Doğrulandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'insufficient_data':
      return { label: 'Eksik Veri', className: 'bg-slate-50 text-slate-600 border-slate-200' };
    case 'insufficient_history':
      return { label: 'Yetersiz Geçmiş Veri', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'negative_input':
      return { label: 'Negatif Girdi', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'not_applicable':
      return { label: 'Sektör Dışı', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
    case 'insufficient_sample':
      return { label: 'Yetersiz Karşılaştırma Verisi', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'unavailable':
    case 'validation_failed':
    default:
      return { label: 'Kullanılamıyor', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
}

/**
 * Format percentage strictly
 */
function formatPercent(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'Veri Mevcut Değil';
  const sign = val > 0 ? '+' : '';
  return `${sign}%${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format ratio multiplier strictly
 */
function formatRatio(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'Veri Mevcut Değil';
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Maps trend direction to visual badge
 */
function getTrendDisplay(trend?: string) {
  switch (trend) {
    case 'IMPROVING':
      return { icon: TrendingUp, label: 'İyileşiyor', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'DETERIORATING':
      return { icon: TrendingDown, label: 'Geriliyor', className: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'STABLE':
      return { icon: Minus, label: 'Yatay', className: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'VOLATILE':
      return { icon: Activity, label: 'Dalgalı', className: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'INSUFFICIENT_HISTORY':
    default:
      return { icon: HelpCircle, label: 'Yetersiz Geçmiş Veri', className: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
}

export type NavTabType = "overview" | "financials" | "analysis" | "ratios" | "dividends" | "ownership" | "news" | "quality";

export default function StockDetailClient({ symbol: rawSymbol }: { symbol: string }) {
  // Clean symbol (Remove .IS suffix for clean UI display)
  const symbol = rawSymbol.toUpperCase().replace(/\.IS$/, '').trim();

  const [activeTimeframe, setActiveTimeframe] = useState("1G");
  const [activeNavTab, setActiveNavTab] = useState<NavTabType>("overview");
  const [activeFinancialTab, setActiveFinancialTab] = useState<"income" | "balance" | "cashFlow">("income");
  const [statementPeriodType, setStatementPeriodType] = useState<"quarterly" | "annual">("quarterly");
  
  // Real BIST Price & Chart Data State
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // News feeds state & filters
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<string>("all");
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>("");

  // Dividend history state
  const [dividendList, setDividendList] = useState<any[]>([]);
  const [dividendLoading, setDividendLoading] = useState(false);

  // Company Profile state (FinAi Company API)
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyLoading, setCompanyLoading] = useState<boolean>(true);

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

  // Historical Multi-Period Analysis State (FAZ 12 Engine)
  const [historicalAnalysisData, setHistoricalAnalysisData] = useState<any>(null);
  const [historicalAnalysisLoading, setHistoricalAnalysisLoading] = useState<boolean>(true);

  // Corporate Actions & Splits state
  const [corporateActionsData, setCorporateActionsData] = useState<any>(null);
  const [corporateActionsLoading, setCorporateActionsLoading] = useState<boolean>(true);

  // Ownership & Major Holders state
  const [ownershipData, setOwnershipData] = useState<any>(null);
  const [ownershipLoading, setOwnershipLoading] = useState<boolean>(true);

  // Analyst Estimates state
  const [analystData, setAnalystData] = useState<any>(null);
  const [analystLoading, setAnalystLoading] = useState<boolean>(true);

  // Valuation Distribution state
  const [valuationData, setValuationData] = useState<any>(null);
  const [valuationLoading, setValuationLoading] = useState<boolean>(true);

  // Data Quality State
  const [qualityData, setQualityData] = useState<any>(null);
  const [qualityLoading, setQualityLoading] = useState<boolean>(true);

  // Sync tab with URL hash if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "financials", "analysis", "ratios", "dividends", "ownership", "news", "quality"].includes(hash)) {
        setActiveNavTab(hash as NavTabType);
      } else if (hash === "genel") {
        setActiveNavTab("overview");
      } else if (hash === "tablolar" || hash === "finansal-tablolar") {
        setActiveNavTab("financials");
      } else if (hash === "risk" || hash === "analiz" || hash === "tarihsel") {
        setActiveNavTab("analysis");
      } else if (hash === "rasyolar" || hash === "karsilastirma" || hash === "degerleme") {
        setActiveNavTab("ratios");
      } else if (hash === "temettuler" || hash === "kurumsal") {
        setActiveNavTab("dividends");
      } else if (hash === "ortaklik" || hash === "analist") {
        setActiveNavTab("ownership");
      } else if (hash === "haberler" || hash === "kap") {
        setActiveNavTab("news");
      } else if (hash === "kalite" || hash === "derinlik") {
        setActiveNavTab("quality");
      }
    }
  }, []);

  const handleTabChange = (tabId: NavTabType) => {
    setActiveNavTab(tabId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tabId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fetch all FinAi APIs with state safety and AbortController
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Reset all states immediately on symbol change to avoid stale data leakage
    setStockData(null);
    setCompanyData(null);
    setFundamentalsData(null);
    setRatiosData(null);
    setComparisonData(null);
    setHistoricalAnalysisData(null);
    setCorporateActionsData(null);
    setOwnershipData(null);
    setAnalystData(null);
    setValuationData(null);
    setQualityData(null);
    setDividendList([]);
    setNewsList([]);

    setLoading(true);
    setCompanyLoading(true);
    setFundamentalsLoading(true);
    setRatiosLoading(true);
    setComparisonLoading(true);
    setHistoricalAnalysisLoading(true);
    setCorporateActionsLoading(true);
    setOwnershipLoading(true);
    setAnalystLoading(true);
    setValuationLoading(true);
    setQualityLoading(true);
    setDividendLoading(true);
    setNewsLoading(true);

    async function loadCompany() {
      try {
        const res = await fetch(`/api/finai/company/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setCompanyData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Company profile error:', e);
      } finally {
        if (!signal.aborted) setCompanyLoading(false);
      }
    }

    async function loadFundamentals() {
      try {
        const res = await fetch(`/api/finance/fundamentals?symbol=${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          setFundamentalsData(json);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Fundamentals error:', e);
      } finally {
        if (!signal.aborted) setFundamentalsLoading(false);
      }
    }

    async function loadRatios() {
      try {
        const res = await fetch(`/api/finance/ratios?symbol=${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setRatiosData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Ratios error:', e);
      } finally {
        if (!signal.aborted) setRatiosLoading(false);
      }
    }

    async function loadComparison() {
      try {
        const res = await fetch(`/api/finance/comparison?symbol=${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setComparisonData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Comparison error:', e);
      } finally {
        if (!signal.aborted) setComparisonLoading(false);
      }
    }

    async function loadHistoricalAnalysis() {
      try {
        const res = await fetch(`/api/finai/analysis/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setHistoricalAnalysisData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Analysis error:', e);
      } finally {
        if (!signal.aborted) setHistoricalAnalysisLoading(false);
      }
    }

    async function loadValuation() {
      try {
        const res = await fetch(`/api/finai/valuation/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setValuationData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Valuation error:', e);
      } finally {
        if (!signal.aborted) setValuationLoading(false);
      }
    }

    async function loadDividends() {
      try {
        const [finaiDivRes, halkarzRes] = await Promise.all([
          fetch(`/api/finai/dividends/${symbol}`, { signal }),
          fetch('/api/halkarz-dividends', { signal })
        ]);

        let loaded = false;
        if (finaiDivRes.ok) {
          const json = await finaiDivRes.json();
          if (json.success && Array.isArray(json.data?.events) && json.data.events.length > 0) {
            setDividendList(json.data.events);
            loaded = true;
          }
        }
        if (!loaded && halkarzRes.ok) {
          const json = await halkarzRes.json();
          if (json.success && Array.isArray(json.data)) {
            const filtered = json.data.filter((d: any) => d.symbol === symbol);
            setDividendList(filtered);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Dividend error:', e);
      } finally {
        if (!signal.aborted) setDividendLoading(false);
      }
    }

    async function loadCorporateActions() {
      try {
        const res = await fetch(`/api/finai/corporate-actions/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setCorporateActionsData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Corporate actions error:', e);
      } finally {
        if (!signal.aborted) setCorporateActionsLoading(false);
      }
    }

    async function loadOwnership() {
      try {
        const res = await fetch(`/api/finai/ownership/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setOwnershipData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Ownership error:', e);
      } finally {
        if (!signal.aborted) setOwnershipLoading(false);
      }
    }

    async function loadAnalyst() {
      try {
        const res = await fetch(`/api/finai/analyst/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setAnalystData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Analyst error:', e);
      } finally {
        if (!signal.aborted) setAnalystLoading(false);
      }
    }

    async function loadQuality() {
      try {
        const res = await fetch(`/api/finai/quality/${symbol}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setQualityData(json.data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Quality error:', e);
      } finally {
        if (!signal.aborted) setQualityLoading(false);
      }
    }

    loadCompany();
    loadFundamentals();
    loadRatios();
    loadComparison();
    loadHistoricalAnalysis();
    loadValuation();
    loadDividends();
    loadCorporateActions();
    loadOwnership();
    loadAnalyst();
    loadQuality();

    return () => {
      controller.abort();
    };
  }, [symbol, statementPeriodType]);

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

  // Fetch live news feeds for symbol from FinAi News API
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/finai/news/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNewsList(json.data);
        } else if (json.articles) {
          setNewsList(json.articles);
        } else {
          setNewsList([]);
        }
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

  // Escape key listener for dismissing open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedRatioTooltip) setSelectedRatioTooltip(null);
        if (selectedArticle) setSelectedArticle(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRatioTooltip, selectedArticle]);

  // Currency of financial statements (TRY vs USD)
  const finCurrency = fundamentalsData?.quarters?.[0]?.period?.currency || fundamentalsData?.ttm?.periodsUsed?.[0]?.currency || fundamentalsData?.currency || 'TRY';
  const isUsdFinancials = finCurrency === 'USD';

  // Derived Financial Summary Values from Fundamentals Data
  const ttmIncome = fundamentalsData?.ttm?.incomeStatementTTM;
  const ttmCashFlow = fundamentalsData?.ttm?.cashFlowTTM;
  const latestBs = fundamentalsData?.ttm?.latestBalanceSheetSnapshot;
  const isBank = fundamentalsData?.sectorInfo?.category === 'BANK';

  // Financial Summary Cards Data
  // Financial Summary Cards Data (FAZ 13 Madde 7: 8 Temel Finansal Kart)
  const summaryCards = useMemo(() => {
    return [
      {
        title: "Net Satış Gelirleri (Revenue)",
        value: ttmIncome?.revenue != null ? formatMoney(ttmIncome.revenue, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: isUsdFinancials ? "USD bazlı satış hasılatı" : "Net satış hasılatı"
      },
      {
        title: "Brüt Kâr (Gross Profit)",
        value: isBank ? "Sektör için uygulanabilir değil" : (ttmIncome?.grossProfit != null ? formatMoney(ttmIncome.grossProfit, finCurrency) : "Veri Mevcut Değil"),
        period: isBank ? "Banka Modeli" : (fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri"),
        type: isBank ? "Uygulanmaz" : "Yıllıklandırılmış Akış (TTM)",
        note: isBank ? "Bankacılıkta Brüt Kâr kullanılmaz" : "Gelir - Satış Maliyeti"
      },
      {
        title: "Faaliyet Kârı (Operating Income)",
        value: ttmIncome?.operatingIncome != null ? formatMoney(ttmIncome.operatingIncome, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: "Esas faaliyet kârı (EBIT)"
      },
      {
        title: "FAVÖK (EBITDA)",
        value: isBank ? "Sektör için uygulanabilir değil" : (ttmIncome?.ebitda != null ? formatMoney(ttmIncome.ebitda, finCurrency) : "Veri Mevcut Değil"),
        period: isBank ? "Banka Modeli" : (fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri"),
        type: isBank ? "Uygulanmaz" : "Yıllıklandırılmış Akış (TTM)",
        note: isBank ? "Bankacılıkta FAVÖK kullanılmaz" : "Faiz ve vergi öncesi operasyonel kâr"
      },
      {
        title: "Net Dönem Kârı (Net Income)",
        value: ttmIncome?.netIncome != null ? formatMoney(ttmIncome.netIncome, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: ttmIncome?.netIncome != null && ttmIncome.netIncome < 0 ? "Net dönem zararı açıklanmıştır" : "Ana ortaklık payları"
      },
      {
        title: "İşletme Nakit Akışı (OCF)",
        value: ttmCashFlow?.operatingCashFlow != null ? formatMoney(ttmCashFlow.operatingCashFlow, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: "Operasyonel faaliyetlerden sağlanan nakit"
      },
      {
        title: "Serbest Nakit Akışı (FCF)",
        value: ttmCashFlow?.freeCashFlow != null ? formatMoney(ttmCashFlow.freeCashFlow, finCurrency) : "Veri Mevcut Değil",
        period: fundamentalsData?.ttm?.isVerified ? "Son 4 Çeyrek (TTM)" : "Dönemsel Veri",
        type: "Yıllıklandırılmış Akış (TTM)",
        note: "İşletme Nakit Akışı - Yatırım Harcamaları"
      },
      {
        title: "Toplam Özkaynaklar (Equity)",
        value: latestBs?.totalEquity != null ? formatMoney(latestBs.totalEquity, finCurrency) : "Veri Mevcut Değil",
        period: "Son Bilanço",
        type: "Bilanço Snapshot",
        note: "Şirketin net defter değeri"
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
        grossAmountFormatted: d.grossAmount != null ? `${d.grossAmount.toFixed(4)} ₺` : '—',
        netAmount: d.netAmount ?? null,
        netAmountFormatted: d.netAmount != null ? `${d.netAmount.toFixed(4)} ₺` : 'Net veri mevcut değil',
        yieldPercent: livePrice && livePrice > 0 && d.grossAmount != null ? ((d.grossAmount / livePrice) * 100) : null,
        source: d.source || 'FinAi Doğrulanmış Temettü Arşivi'
      }));
    }
    
    return dividendList.map((item: any) => ({
      ...item,
      netAmountFormatted: item.netAmount != null ? `${item.netAmount.toFixed(4)} ₺` : 'Net veri mevcut değil',
      source: item.source || 'FinAi / BIST Kataloğu'
    }));
  }, [fundamentalsData, dividendList, stockData, symbol]);

  // Filtered News Items for Dedicated News Studio
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      // Category match
      const category = (item.category || "").toLowerCase();
      let matchCat = true;
      if (newsCategoryFilter === "kap") {
        matchCat = category.includes("kap") || category.includes("bildirim");
      } else if (newsCategoryFilter === "analysis") {
        matchCat = category.includes("analiz") || category.includes("finans") || category.includes("bilanço");
      } else if (newsCategoryFilter === "other") {
        matchCat = !category.includes("kap") && !category.includes("analiz");
      }

      // Query match
      const title = (item.title || "").toLowerCase();
      const content = (item.content || item.summary || "").toLowerCase();
      const query = newsSearchQuery.trim().toLowerCase();
      const matchQuery = !query || title.includes(query) || content.includes(query);

      return matchCat && matchQuery;
    });
  }, [newsList, newsCategoryFilter, newsSearchQuery]);

  // News category counts
  const newsCounts = useMemo(() => {
    const all = newsList.length;
    const kap = newsList.filter(n => (n.category || "").toLowerCase().includes("kap") || (n.category || "").toLowerCase().includes("bildirim")).length;
    const analysis = newsList.filter(n => (n.category || "").toLowerCase().includes("analiz") || (n.category || "").toLowerCase().includes("finans") || (n.category || "").toLowerCase().includes("bilanço")).length;
    const other = all - kap - analysis;
    return { all, kap, analysis, other: other > 0 ? other : 0 };
  }, [newsList]);

  // Navigation Items (8 Comprehensive Company Intelligence Modules)
  const navItems: { id: NavTabType; label: string; icon: any; count?: number }[] = [
    { id: "overview", label: "Genel Bakış & Fiyat", icon: BarChart3 },
    { id: "financials", label: "Finansal Tablolar", icon: TableIcon },
    { id: "analysis", label: "Tarihsel Analiz & Risk", icon: Activity },
    { id: "ratios", label: "Rasyolar & Değerleme", icon: Calculator },
    { id: "dividends", label: "Temettü & Kurumsal", icon: Coins, count: combinedDividends.length > 0 ? combinedDividends.length : undefined },
    { id: "ownership", label: "Ortaklık & Analistler", icon: Users },
    { id: "news", label: "KAP & Haberler", icon: Newspaper, count: newsList.length > 0 ? newsList.length : undefined },
    { id: "quality", label: "Veri Kalitesi & Derinlik", icon: ShieldCheck }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] w-full overflow-x-hidden relative">
      
      {/* ========================================================================= */}
      {/* 1. SOL MENÜ: LACİVERT SOL PANEL (#00008B) - MODÜLER GEZİNTİ */}
      {/* ========================================================================= */}
      <aside className="w-64 shrink-0 min-h-screen bg-[#00008B] text-white p-5 space-y-6 flex flex-col justify-between shadow-2xl z-20 hidden md:flex">
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

          {/* MODÜLER SEKME BUTONLARI (Doğrudan Sekme Değiştirici) */}
          <div className="space-y-1.5 pt-1">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all border text-left",
                    isActive
                      ? "bg-white text-[#00008B] border-white shadow-xl scale-[1.02]"
                      : "bg-blue-950/40 text-blue-100 border-blue-800/40 hover:bg-blue-800/70 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-[#00008B]" : "text-blue-300")} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count != null && (
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-black",
                      isActive ? "bg-blue-100 text-[#00008B]" : "bg-blue-900/80 text-blue-200 border border-blue-700/60"
                    )}>
                      {tab.count}
                    </span>
                  )}
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
      <main className="flex-1 bg-[#F8FAFC] min-h-screen p-4 sm:p-6 md:p-8 space-y-6 text-slate-900 max-w-full overflow-hidden">
        
        {/* ÜST GEZİNTİ VE İŞLEM BARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <Link 
            href="/dashboard/data"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-black transition-all border border-slate-200 shadow-sm self-start"
          >
            <ArrowLeft className="w-4 h-4 text-[#00008B]" />
            Varlık Merkezine Dön
          </Link>

          {/* YATAY MODÜL GEZİNTİ PİLL BAR (Tüm Ekranlar & Mobil) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-black rounded-xl transition-all border whitespace-nowrap flex items-center gap-1.5 shadow-sm shrink-0",
                    isActive
                      ? "bg-[#00008B] text-white border-[#00008B]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{tab.label}</span>
                  {tab.count != null && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded-full font-black",
                      isActive ? "bg-blue-900 text-blue-100" : "bg-slate-100 text-slate-600"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
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
        {/* MODÜL 1: GENEL BAKIŞ & GRAFİK (OVERVIEW) */}
        {/* ========================================================================= */}
        {activeNavTab === "overview" && (
          <div className="space-y-6">
            
            {/* ŞİRKET HEADER & BİST PROFİLİ */}
            <div className="bg-[#00008B] text-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-blue-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-2xl font-black text-white tracking-tight">{symbol}</span>
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-blue-900/80 border border-blue-700 text-blue-200">
                      {companyData?.sector || fundamentalsData?.sectorInfo?.displayName || "BIST Şirketi"}
                    </span>
                    {companyData?.industry && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-300">
                        {companyData.industry}
                      </span>
                    )}
                    <DataStatusBadge status={qualityData?.status || 'SUCCESS'} />
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

              {/* USD PARA BİRİMİ DÖNÜŞÜM BİLGİLENDİRMESİ */}
              {isUsdFinancials && (
                <div className="bg-sky-950/70 border border-sky-700/80 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-sky-100">
                  <Info className="w-4 h-4 text-sky-300 shrink-0" />
                  <p className="leading-relaxed font-semibold">
                    <strong className="text-white">Para Birimi Bilgisi:</strong> Şirket finansal tablolarını <strong>USD ($)</strong> bazında raporlamaktadır. F/K ve PD/DD gibi borsa çarpanlarında güncel döviz kuru ile para birimi dönüşümü uygulanmıştır.
                  </p>
                </div>
              )}

              {/* HAKKINDA METNİ & ŞİRKET KÜNYESİ */}
              <div className="space-y-3 pt-1">
                <p className="text-blue-100 text-xs md:text-sm font-medium leading-relaxed">
                  {companyData?.businessSummary || aboutText}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-blue-200 border-t border-blue-800/60 font-semibold">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-300" />
                    {companyData?.country || "Türkiye"}{companyData?.city ? ` • ${companyData.city}` : ""}
                  </span>
                  {companyData?.employees != null && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-300" />
                      {companyData.employees.toLocaleString('tr-TR')} Çalışan
                    </span>
                  )}
                  {companyData?.website && (
                    <a 
                      href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sky-300 hover:text-white underline underline-offset-2"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Resmi Web Sitesi
                    </a>
                  )}
                  <span className="ml-auto text-[10px] text-blue-300/80 italic">
                    * Veriler FinAi doğrulanmış arşivinden alınmaktadır.
                  </span>
                </div>
              </div>
            </div>

            {/* FİYAT / PİYASA ÖZETİ & TRADINGVIEW CHART (GRAFİK DOKUNULMAZ) */}
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

            {/* FİNANSAL ÖZET (7 TEMEL FİNANSAL KART) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
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

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-blue-50 text-[#00008B] border border-blue-200">
                    Bilanço Para Birimi: {finCurrency}
                  </span>
                  <button 
                    onClick={() => handleTabChange("financials")}
                    className="text-xs font-black text-[#00008B] hover:underline flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200"
                  >
                    Tüm Tabloları İncele <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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

            {/* FINAI COMPANY INTELLIGENCE HIGHLIGHTS (4 STRATEJİK BOYUT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Tarihsel Değerleme Durumu */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-[#00008B]" />
                      Değerleme Konumu
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-50 text-[#00008B] border border-blue-100">
                      Tarihsel
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xl font-black text-slate-900">
                      {historicalAnalysisData?.valuationDistribution?.pePercentile != null
                        ? `%${historicalAnalysisData.valuationDistribution.pePercentile} Dilim`
                        : (stockData?.pe ? `F/K: ${stockData.pe.toFixed(2)}` : 'Veri Mevcut Değil')}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mt-0.5">
                      {historicalAnalysisData?.valuationDistribution?.neutralCommentary || "Tarihsel F/K ve PD/DD dağılımı analizi."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("ratios")}
                  className="w-full pt-2 border-t border-slate-100 text-xs font-black text-[#00008B] hover:underline flex items-center justify-between"
                >
                  <span>Tarihsel Dağılımı İncele</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2. Risk & Fiyat Davranışı */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      Fiyat Davranışı & Risk
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      1 Yıllık
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xl font-black text-slate-900">
                      {historicalAnalysisData?.priceRiskMetrics?.volatility1Y != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.volatility1Y.toFixed(1)} Volatilite`
                        : 'Veri Mevcut Değil'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mt-0.5">
                      {historicalAnalysisData?.priceRiskMetrics?.maxDrawdown != null
                        ? `Maksimum Tepe-Dip Kaybı: %${historicalAnalysisData.priceRiskMetrics.maxDrawdown.toFixed(1)}`
                        : "Günlük getirilerin yıllıklandırılmış standart sapması."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("analysis")}
                  className="w-full pt-2 border-t border-slate-100 text-xs font-black text-[#00008B] hover:underline flex items-center justify-between"
                >
                  <span>Risk Metriklerini Gör</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3. Harici Analist Konsensüsü */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      Analist Tahminleri
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Harici Veri
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xl font-black text-slate-900">
                      {analystData?.targetMeanPrice != null
                        ? `${analystData.targetMeanPrice.toFixed(2)} ₺`
                        : 'Analist Verisi Yok'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mt-0.5">
                      {analystData?.numberOfAnalysts != null
                        ? `${analystData.numberOfAnalysts} piyasa analistinin konsensüs ortalama hedef fiyatı.`
                        : "Harici analist raporu mevcut değil."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("ownership")}
                  className="w-full pt-2 border-t border-slate-100 text-xs font-black text-[#00008B] hover:underline flex items-center justify-between"
                >
                  <span>Analist & Ortaklık Detayları</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4. Tarihsel Veri Derinliği */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-purple-600" />
                      Veri Derinliği
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                      Doğrulandı
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xl font-black text-slate-900">
                      {qualityData?.historicalPricesCount ? `${qualityData.historicalPricesCount.toLocaleString('tr-TR')} Bar` : 'Veri Mevcut Değil'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mt-0.5">
                      {qualityData?.statementsEarliest && qualityData?.statementsLatest
                        ? `Mali Tablo: ${qualityData.statementsEarliest.slice(0, 4)} → ${qualityData.statementsLatest.slice(0, 4)} (${qualityData.quarterlyStatementsCount} Çeyrek)`
                        : "Doğrulanmış tarihsel veri derinliği karnesi."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("quality")}
                  className="w-full pt-2 border-t border-slate-100 text-xs font-black text-[#00008B] hover:underline flex items-center justify-between"
                >
                  <span>Kalite Karnesini Aç</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* FINAI VERİ KALİTESİ VE DOĞRULAMA KARNESİ */}
            <DataQualityPanel
              qualityData={qualityData}
              symbol={symbol}
              reportingCurrency={finCurrency}
            />

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 2: FİNANSAL TABLOLAR (FINANCIALS) */}
        {/* ========================================================================= */}
        {activeNavTab === "financials" && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
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
                                {q.incomeStatement?.revenue != null ? formatMoney(q.incomeStatement.revenue, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/30">
                                {ttmIncome?.revenue != null ? formatMoney(ttmIncome.revenue, finCurrency) : "Eksik Veri"}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Brüt Kâr (Gross Profit)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.incomeStatement?.grossProfit != null ? formatMoney(q.incomeStatement.grossProfit, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                                {ttmIncome?.grossProfit != null ? formatMoney(ttmIncome.grossProfit, finCurrency) : "Eksik Veri"}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Faaliyet Kârı (EBIT)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.incomeStatement?.operatingIncome != null ? formatMoney(q.incomeStatement.operatingIncome, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                                {ttmIncome?.operatingIncome != null ? formatMoney(ttmIncome.operatingIncome, finCurrency) : "Eksik Veri"}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">FAVÖK (EBITDA)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {isBank ? "Sektör Dışı (N/A)" : (q.incomeStatement?.ebitda != null ? formatMoney(q.incomeStatement.ebitda, finCurrency) : "Eksik Veri")}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30">
                                {isBank ? "Sektör Dışı (N/A)" : (ttmIncome?.ebitda != null ? formatMoney(ttmIncome.ebitda, finCurrency) : "Eksik Veri")}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="py-3 px-4 font-black text-slate-900">Net Dönem Kârı (Net Income)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                                {q.incomeStatement?.netIncome != null ? formatMoney(q.incomeStatement.netIncome, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/60">
                                {ttmIncome?.netIncome != null ? formatMoney(ttmIncome.netIncome, finCurrency) : "Eksik Veri"}
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
                                {q.balanceSheet?.cashAndEquivalents != null ? formatMoney(q.balanceSheet.cashAndEquivalents, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Dönen Varlıklar (Current Assets)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.balanceSheet?.currentAssets != null ? formatMoney(q.balanceSheet.currentAssets, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="py-3 px-4 font-black text-slate-900">Toplam Varlıklar (Total Assets)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                                {q.balanceSheet?.totalAssets != null ? formatMoney(q.balanceSheet.totalAssets, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Kısa Vadeli Borçlar</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.balanceSheet?.currentLiabilities != null ? formatMoney(q.balanceSheet.currentLiabilities, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Net Finansal Borç</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {isBank ? "Sektör Dışı (N/A)" : (q.balanceSheet?.netDebt != null ? formatMoney(q.balanceSheet.netDebt, finCurrency) : "Eksik Veri")}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && <td className="py-3 px-4 text-right bg-blue-50/30">—</td>}
                          </tr>
                          <tr className="hover:bg-slate-50 bg-slate-50/40">
                            <td className="py-3 px-4 font-black text-slate-900">Toplam Özkaynaklar (Equity)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right font-black text-[#00008B]">
                                {q.balanceSheet?.totalEquity != null ? formatMoney(q.balanceSheet.totalEquity, finCurrency) : "Eksik Veri"}
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
                                {q.cashFlowStatement?.operatingCashFlow != null ? formatMoney(q.cashFlowStatement.operatingCashFlow, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] bg-blue-50/30 font-black">
                                {ttmCashFlow?.operatingCashFlow != null ? formatMoney(ttmCashFlow.operatingCashFlow, finCurrency) : "Eksik Veri"}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Yatırım Harcamaları (CapEx)</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.cashFlowStatement?.capitalExpenditures != null ? formatMoney(q.cashFlowStatement.capitalExpenditures, finCurrency) : "Eksik Veri"}
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
                                {q.cashFlowStatement?.freeCashFlow != null ? formatMoney(q.cashFlowStatement.freeCashFlow, finCurrency) : "Eksik Veri"}
                              </td>
                            ))}
                            {statementPeriodType === 'quarterly' && fundamentalsData?.ttm?.isVerified && (
                              <td className="py-3 px-4 text-right text-[#00008B] font-black bg-blue-50/60">
                                {ttmCashFlow?.freeCashFlow != null ? formatMoney(ttmCashFlow.freeCashFlow, finCurrency) : "Eksik Veri"}
                              </td>
                            )}
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">Yatırım Faaliyetlerinden Nakit Akışı</td>
                            {displayedPeriods.map((q: any, i: number) => (
                              <td key={i} className="py-3 px-4 text-right">
                                {q.cashFlowStatement?.investingCashFlow != null ? formatMoney(q.cashFlowStatement.investingCashFlow, finCurrency) : "Eksik Veri"}
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
                                {q.cashFlowStatement?.financingCashFlow != null ? formatMoney(q.cashFlowStatement.financingCashFlow, finCurrency) : "Eksik Veri"}
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
                                {q.cashFlowStatement?.dividendsPaid != null ? formatMoney(q.cashFlowStatement.dividendsPaid, finCurrency) : "Eksik Veri"}
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
                                {q.cashFlowStatement?.netChangeInCash != null ? formatMoney(q.cashFlowStatement.netChangeInCash, finCurrency) : "Eksik Veri"}
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

            {/* ÇEYREKLİK KARŞILAŞTIRMALAR (QoQ & YoY) - FAZ 12 İLERİ ANALİTİK MOTOR ÇIKTISI */}
            {historicalAnalysisData?.quarterlyComparisons && historicalAnalysisData.quarterlyComparisons.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#00008B]" />
                      Çeyreklik Finansal Karşılaştırmalar (QoQ & YoY)
                    </h4>
                    <p className="text-xs font-bold text-slate-400">
                      Son Raporlanan Çeyrek Değerlerinin Bir Önceki Çeyrek (QoQ) ve Önceki Yılın Aynı Çeyreği (YoY) ile Karşılaştırması
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-blue-50 text-[#00008B] border border-blue-200 self-start sm:self-auto">
                    FAZ 12 Analitik Motor Çıktısı
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Finansal Kalem</th>
                        <th className="py-3 px-4 text-right">Son Çeyrek ({historicalAnalysisData.quarterlyComparisons[0]?.latestQuarterPeriod || '—'})</th>
                        <th className="py-3 px-4 text-right">Önceki Çeyrek ({historicalAnalysisData.quarterlyComparisons[0]?.previousQuarterPeriod || '—'})</th>
                        <th className="py-3 px-4 text-right">Çeyreklik Değişim (QoQ)</th>
                        <th className="py-3 px-4 text-right">Geçen Yıl Aynı Çeyrek ({historicalAnalysisData.quarterlyComparisons[0]?.sameQuarterLastYearPeriod || '—'})</th>
                        <th className="py-3 px-4 text-right">Yıllık Değişim (YoY)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {historicalAnalysisData.quarterlyComparisons.map((row: any, idx: number) => {
                        const qoqPos = row.qoqGrowth != null && row.qoqGrowth >= 0;
                        const yoyPos = row.yoyGrowth != null && row.yoyGrowth >= 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-black text-slate-900">{row.metricName}</td>
                            <td className="py-3 px-4 text-right text-slate-900 font-black">
                              {row.latestQuarterValue != null ? formatMoney(row.latestQuarterValue, finCurrency) : "Veri Mevcut Değil"}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              {row.previousQuarterValue != null ? formatMoney(row.previousQuarterValue, finCurrency) : "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {row.qoqGrowth != null ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded font-black text-[11px]",
                                  qoqPos ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                )}>
                                  {qoqPos ? "+" : ""}%{row.qoqGrowth.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              {row.sameQuarterLastYearValue != null ? formatMoney(row.sameQuarterLastYearValue, finCurrency) : "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {row.yoyGrowth != null ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded font-black text-[11px]",
                                  yoyPos ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                )}>
                                  {yoyPos ? "+" : ""}%{row.yoyGrowth.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FINAI VERİ KALİTESİ VE DOĞRULAMA KARNESİ */}
            <DataQualityPanel
              qualityData={qualityData}
              symbol={symbol}
              reportingCurrency={finCurrency}
            />

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL: TARİHSEL ANALİZ & RİSK (ANALYSIS) - FAZ 12 İLERİ ANALİTİK MOTORU */}
        {/* ========================================================================= */}
        {activeNavTab === "analysis" && (
          <div className="space-y-6">

            {/* 1. TARİHSEL FİNANSAL TRENDLER & RASYOLAR GRAFİĞİ */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00008B]" />
                    {symbol} Tarihsel Finansal Trendler & Rasyo Grafiği
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Gerçek Raporlama Dönemleri Boyunca Marjlar, Nakit Akışı, Kaldıraç ve Devir Hızları Gelişimi
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

            {/* 2. BÜYÜME ANALİZİ (GROWTH ANALYTICS) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00008B]" />
                    {symbol} Büyüme Analizi (YoY & CAGR)
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Tarihsel Büyüme Oranları ve Yıllıklandırılmış Bileşik Büyüme Hızı
                  </p>
                </div>
                <div 
                  className="group relative inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 cursor-help"
                  title="Trend, mevcut tarihsel finansal dönemlerdeki değişimi gösterir; gelecekteki performansı garanti etmez."
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#00008B]" />
                  <span>Metodoloji Bilgisi</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Gelir Büyümesi (Revenue YoY)",
                    val: historicalAnalysisData?.growthAnalysis?.yoy?.revenueYoY,
                    cagr: historicalAnalysisData?.growthAnalysis?.cagr?.revenueCAGR,
                    trend: historicalAnalysisData?.growthAnalysis?.yoy?.revenueTrend || 'STABLE'
                  },
                  {
                    title: "Net Kâr Büyümesi (Net Income YoY)",
                    val: historicalAnalysisData?.growthAnalysis?.yoy?.netIncomeYoY,
                    cagr: historicalAnalysisData?.growthAnalysis?.cagr?.netIncomeCAGR,
                    trend: historicalAnalysisData?.growthAnalysis?.yoy?.netIncomeTrend || 'STABLE'
                  },
                  {
                    title: "FAVÖK Büyümesi (EBITDA YoY)",
                    val: isBank ? null : historicalAnalysisData?.growthAnalysis?.yoy?.ebitdaYoY,
                    cagr: isBank ? null : historicalAnalysisData?.growthAnalysis?.cagr?.ebitdaCAGR,
                    trend: isBank ? 'INSUFFICIENT_HISTORY' : (historicalAnalysisData?.growthAnalysis?.yoy?.ebitdaTrend || 'STABLE'),
                    isNotApplicable: isBank
                  },
                  {
                    title: "Serbest Nakit Akışı (FCF YoY)",
                    val: historicalAnalysisData?.growthAnalysis?.yoy?.fcfYoY,
                    cagr: historicalAnalysisData?.growthAnalysis?.cagr?.fcfCAGR,
                    trend: historicalAnalysisData?.growthAnalysis?.yoy?.fcfTrend || 'STABLE'
                  },
                  {
                    title: "Hisse Başı Kâr (EPS YoY)",
                    val: historicalAnalysisData?.growthAnalysis?.yoy?.epsYoY,
                    cagr: null,
                    trend: historicalAnalysisData?.growthAnalysis?.yoy?.epsTrend || 'STABLE'
                  },
                  {
                    title: "Hisse Başı Defter Değeri (BVPS YoY)",
                    val: historicalAnalysisData?.growthAnalysis?.yoy?.bvpsYoY,
                    cagr: null,
                    trend: historicalAnalysisData?.growthAnalysis?.yoy?.bvpsTrend || 'STABLE'
                  },
                  {
                    title: "İşletme Nakit Akışı (OCF CAGR)",
                    val: historicalAnalysisData?.growthAnalysis?.cagr?.operatingCashFlowCAGR,
                    cagr: null,
                    trend: 'STABLE'
                  },
                  {
                    title: "Satış Hasılatı CAGR (Bileşik)",
                    val: historicalAnalysisData?.growthAnalysis?.cagr?.revenueCAGR,
                    cagr: null,
                    trend: 'IMPROVING'
                  }
                ].map((item, idx) => {
                  const trendInfo = getTrendDisplay(item.trend);
                  const TrendIcon = trendInfo.icon;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                            {item.title}
                          </span>
                          <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-0.5 shrink-0", trendInfo.className)}>
                            <TrendIcon className="w-2.5 h-2.5" />
                            {trendInfo.label}
                          </span>
                        </div>
                        <p className="text-lg font-black text-slate-900 pt-1">
                          {item.isNotApplicable
                            ? "Sektör için uygulanabilir değil"
                            : (item.val != null ? `${item.val >= 0 ? "+" : ""}%${item.val.toFixed(1)}` : "Yetersiz Geçmiş Veri")}
                        </p>
                      </div>
                      {item.cagr != null && !item.isNotApplicable && (
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-semibold flex items-center justify-between">
                          <span>Bileşik Hız (CAGR):</span>
                          <span className="font-bold text-[#00008B]">{item.cagr >= 0 ? "+" : ""}%{item.cagr.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>* Trend ve büyüme oranları, mevcut tarihsel finansal tablolardaki dönemsel değişimi gösterir; gelecekteki performansı garanti etmez ve al-sat sinyali değildir.</span>
              </div>
            </div>

            {/* 3. KÂRLILIK ANALİZİ & MARJLAR (PROFITABILITY ANALYTICS) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#00008B]" />
                    {symbol} Kârlılık Analizi & Marj Gelişimi
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Operasyonel Marjlar, Sermaye Getirisi (ROE / ROA) ve Tarihsel Gelişim Yönü
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    name: "Brüt Kâr Marjı",
                    val: isBank ? null : (ratiosData?.profitability?.grossMargin ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.grossMargin),
                    isNotApplicable: isBank,
                    desc: "Brüt Kâr / Hasılat"
                  },
                  {
                    name: "Faaliyet Kâr Marjı (EBIT Margin)",
                    val: ratiosData?.profitability?.operatingMargin ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.operatingMargin,
                    isNotApplicable: false,
                    desc: "Faaliyet Kârı / Hasılat"
                  },
                  {
                    name: "FAVÖK Marjı (EBITDA Margin)",
                    val: isBank ? null : (ratiosData?.profitability?.ebitdaMargin ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.ebitdaMargin),
                    isNotApplicable: isBank,
                    desc: "FAVÖK / Hasılat"
                  },
                  {
                    name: "Net Kâr Marjı (Net Margin)",
                    val: ratiosData?.profitability?.netMargin ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.netMargin,
                    isNotApplicable: false,
                    desc: "Net Dönem Kârı / Hasılat"
                  },
                  {
                    name: "Özkaynak Kârlılığı (ROE)",
                    val: ratiosData?.profitability?.roe ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.roe,
                    isNotApplicable: false,
                    desc: "Net Kâr / Toplam Özkaynak"
                  },
                  {
                    name: "Aktif Kârlılık (ROA)",
                    val: ratiosData?.profitability?.roa ?? historicalAnalysisData?.profitabilityTrends?.[historicalAnalysisData.profitabilityTrends.length - 1]?.roa,
                    isNotApplicable: false,
                    desc: "Net Kâr / Toplam Varlıklar"
                  },
                  {
                    name: "Serbest Nakit Akış Marjı (FCF Margin)",
                    val: historicalAnalysisData?.cashFlowTrends?.[historicalAnalysisData.cashFlowTrends.length - 1]?.freeCashFlow != null && ttmIncome?.revenue
                      ? (historicalAnalysisData.cashFlowTrends[historicalAnalysisData.cashFlowTrends.length - 1].freeCashFlow / ttmIncome.revenue) * 100
                      : null,
                    isNotApplicable: false,
                    desc: "Serbest Nakit Akışı / Hasılat"
                  },
                  {
                    name: "Nakit Dönüşüm Gücü",
                    val: ttmIncome?.netIncome != null && ttmCashFlow?.operatingCashFlow != null && ttmIncome.netIncome > 0
                      ? (ttmCashFlow.operatingCashFlow / ttmIncome.netIncome) * 100
                      : null,
                    isNotApplicable: false,
                    desc: "İşletme Nakit Akışı / Net Kâr"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-xl font-black text-[#00008B] pt-1">
                        {item.isNotApplicable
                          ? "Sektör için uygulanabilir değil"
                          : (item.val != null ? `%${item.val.toFixed(2)}` : "Veri Mevcut Değil")}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-semibold truncate">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. RİSK / FİYAT DAVRANIŞI (PRICE BEHAVIOR & RISK METRICS) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#00008B]" />
                    {symbol} Fiyat Davranışı & Risk Metrikleri
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Geçmiş Günlük Fiyat Hareketlerinin İstatistiksel Volatilite ve Düşüş Analizi
                  </p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 self-start sm:self-auto">
                  {historicalAnalysisData?.priceRiskMetrics?.tradingDaysEvaluated 
                    ? `${historicalAnalysisData.priceRiskMetrics.tradingDaysEvaluated} İş Günü İncelendi`
                    : 'Piyasa İş Günü Analizi'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1 Yıllık Volatilite */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">1 Yıllık Volatilite</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-[#00008B] border border-blue-100">Yıllıklandırılmış</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.volatility1Y != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.volatility1Y.toFixed(2)}`
                        : 'Veri Mevcut Değil'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    Son 1 yıllık günlük logaritmik getirilerin standart sapmasının 252 işlem günü ile yıllıklandırılması.
                  </p>
                </div>

                {/* 3 Yıllık Volatilite */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">3 Yıllık Volatilite</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-[#00008B] border border-blue-100">Yıllıklandırılmış</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.volatility3Y != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.volatility3Y.toFixed(2)}`
                        : 'Yetersiz Geçmiş Veri'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    Son 3 yıllık işlem verilerine dayalı orta vadeli dalgalanma boyutu.
                  </p>
                </div>

                {/* 5 Yıllık Volatilite */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">5 Yıllık Volatilite</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-[#00008B] border border-blue-100">Yıllıklandırılmış</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.volatility5Y != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.volatility5Y.toFixed(2)}`
                        : 'Yetersiz Geçmiş Veri'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    Uzun vadeli piyasa döngüleri boyunca ortalama risk katsayısı.
                  </p>
                </div>

                {/* Maksimum Değer Kaybı (Max Drawdown) */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Maksimum Değer Kaybı (MDD)</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">Tepe → Dip</span>
                    </div>
                    <p className="text-2xl font-black text-rose-700 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.maxDrawdown != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.maxDrawdown.toFixed(2)}`
                        : 'Veri Mevcut Değil'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    İncelenen dönemde fiyatta görülen zirve seviyeden en derin dip noktaya kadar yaşanan en büyük düşüş oranı.
                  </p>
                </div>

                {/* Negatif Yönlü Volatilite */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Negatif Yönlü Volatilite</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">Düşüş Riski</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.downsideVolatility1Y != null
                        ? `%${historicalAnalysisData.priceRiskMetrics.downsideVolatility1Y.toFixed(2)}`
                        : 'Veri Mevcut Değil'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    Sadece negatif getirili günlerin standart sapması (Aşağı yönlü kayıp riski).
                  </p>
                </div>

                {/* Pozitif Getirili Gün Oranı */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pozitif Getirili Gün Oranı</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Frekans</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700 pt-1">
                      {historicalAnalysisData?.priceRiskMetrics?.positiveReturnDaysRatio != null
                        ? `%${(historicalAnalysisData.priceRiskMetrics.positiveReturnDaysRatio * 100).toFixed(1)}`
                        : 'Veri Mevcut Değil'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    Toplam işlem günleri içerisinde hissenin günü artı getiri ile kapattığı seansların yüzdesi.
                  </p>
                </div>

              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
                <strong>Metodoloji Notu:</strong> Risk metrikleri geçmiş fiyat hareketlerinin standart sapması ve tepe-dip hareketini gösterir; gelecekteki fiyat performansını garanti etmez ve yatırım tavsiyesi değildir.
              </div>
            </div>

            {/* FINAI VERİ KALİTESİ VE DOĞRULAMA KARNESİ */}
            <DataQualityPanel
              qualityData={qualityData}
              symbol={symbol}
              reportingCurrency={finCurrency}
            />

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 4: RASYOLAR & SEKTÖR (RATIOS) */}
        {/* ========================================================================= */}
        {activeNavTab === "ratios" && (
          <div className="space-y-6">
            
            {/* TARİHSEL DEĞERLEME DAĞILIMI (FAZ 12 İLERİ ANALİTİK MOTORU ÇIKTISI) */}
            {(() => {
              const valDist = valuationData?.distribution || historicalAnalysisData?.valuationDistribution;
              if (!valDist) return null;

              const peMin = valDist.peMin;
              const peMax = valDist.peMax;
              const peMed = valDist.peMedian;
              const peCur = valDist.peCurrent;
              const pePct = valDist.pePercentile;

              const pbMin = valDist.pbMin;
              const pbMax = valDist.pbMax;
              const pbMed = valDist.pbMedian;
              const pbCur = valDist.pbCurrent;
              const pbPct = valDist.pbPercentile;

              const getPosition = (val: number | null, min: number | null, max: number | null) => {
                if (val == null || min == null || max == null || max <= min) return 50;
                const pct = ((val - min) / (max - min)) * 100;
                return Math.max(3, Math.min(97, pct));
              };

              return (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-5 h-5 text-[#00008B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          {symbol} Tarihsel Değerleme Dağılımı (Valuation Distribution)
                        </h3>
                        <p className="text-xs font-bold text-slate-400">
                          Bilanço Dönemleri Boyunca Gerçekleşen F/K ve PD/DD Çarpanlarının İstatistiksel Dağılımı ve Persentil Konumu
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-blue-50 text-[#00008B] border border-blue-200">
                        {valDist.sampleSize ? `${valDist.sampleSize} Dönem Örneklemi` : 'Tarihsel Analiz'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* F/K DAĞILIMI */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                            Fiyat / Kazanç (F/K) Dağılımı
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">Tarihsel Değerleme Bandı</span>
                        </div>
                        {pePct != null ? (
                          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-100 text-[#00008B] border border-blue-200">
                            %{pePct} Persentil
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Persentil Hesaplanamadı</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Tarihsel Min</span>
                          <span className="text-sm font-black text-slate-700">{peMin != null ? peMin.toFixed(2) : '—'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-sm">
                          <span className="text-[9px] font-black text-[#00008B] uppercase block">Tarihsel Medyan</span>
                          <span className="text-sm font-black text-[#00008B]">{peMed != null ? peMed.toFixed(2) : '—'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Tarihsel Max</span>
                          <span className="text-sm font-black text-slate-700">{peMax != null ? peMax.toFixed(2) : '—'}</span>
                        </div>
                      </div>

                      {peMin != null && peMax != null && peMax > peMin ? (
                        <div className="space-y-2 pt-2">
                          <div className="relative h-4 bg-gradient-to-r from-emerald-100 via-blue-100 to-rose-100 rounded-full border border-slate-200">
                            {peMed != null && (
                              <div
                                style={{ left: `${getPosition(peMed, peMin, peMax)}%` }}
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 -translate-x-1/2"
                                title={`Tarihsel Medyan: ${peMed.toFixed(2)}`}
                              />
                            )}
                            {peCur != null && peCur >= peMin && peCur <= peMax && (
                              <div
                                style={{ left: `${getPosition(peCur, peMin, peMax)}%` }}
                                className="absolute -top-1 w-6 h-6 bg-[#00008B] text-white rounded-full border-2 border-white shadow-md flex items-center justify-center -translate-x-1/2 z-20"
                                title={`Güncel F/K: ${peCur.toFixed(2)} (%${pePct || 0} Persentil)`}
                              >
                                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                            <span>Min: {peMin.toFixed(2)}</span>
                            <span className="text-[#00008B] font-black">
                              Güncel: {peCur != null ? peCur.toFixed(2) : 'Veri Mevcut Değil'}
                            </span>
                            <span>Max: {peMax.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">Dağılım grafiği için yeterli pozitif F/K verisi bulunamadı.</p>
                      )}
                    </div>

                    {/* PD/DD DAĞILIMI */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                            Piyasa Değeri / Defter Değeri (PD/DD) Dağılımı
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">Özsermaye Çarpanı Dağılımı</span>
                        </div>
                        {pbPct != null ? (
                          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-100 text-[#00008B] border border-blue-200">
                            %{pbPct} Persentil
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Persentil Hesaplanamadı</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Tarihsel Min</span>
                          <span className="text-sm font-black text-slate-700">{pbMin != null ? pbMin.toFixed(2) : '—'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-sm">
                          <span className="text-[9px] font-black text-[#00008B] uppercase block">Tarihsel Medyan</span>
                          <span className="text-sm font-black text-[#00008B]">{pbMed != null ? pbMed.toFixed(2) : '—'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Tarihsel Max</span>
                          <span className="text-sm font-black text-slate-700">{pbMax != null ? pbMax.toFixed(2) : '—'}</span>
                        </div>
                      </div>

                      {pbMin != null && pbMax != null && pbMax > pbMin ? (
                        <div className="space-y-2 pt-2">
                          <div className="relative h-4 bg-gradient-to-r from-emerald-100 via-blue-100 to-rose-100 rounded-full border border-slate-200">
                            {pbMed != null && (
                              <div
                                style={{ left: `${getPosition(pbMed, pbMin, pbMax)}%` }}
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 -translate-x-1/2"
                                title={`Tarihsel Medyan: ${pbMed.toFixed(2)}`}
                              />
                            )}
                            {pbCur != null && pbCur >= pbMin && pbCur <= pbMax && (
                              <div
                                style={{ left: `${getPosition(pbCur, pbMin, pbMax)}%` }}
                                className="absolute -top-1 w-6 h-6 bg-[#00008B] text-white rounded-full border-2 border-white shadow-md flex items-center justify-center -translate-x-1/2 z-20"
                                title={`Güncel PD/DD: ${pbCur.toFixed(2)} (%${pbPct || 0} Persentil)`}
                              >
                                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                            <span>Min: {pbMin.toFixed(2)}</span>
                            <span className="text-[#00008B] font-black">
                              Güncel: {pbCur != null ? pbCur.toFixed(2) : 'Veri Mevcut Değil'}
                            </span>
                            <span>Max: {pbMax.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">Dağılım grafiği için yeterli pozitif PD/DD verisi bulunamadı.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {valDist.neutralCommentary && (
                      <p className="text-xs font-semibold text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#00008B] shrink-0" />
                        <span><strong>Tarihsel Konum:</strong> {valDist.neutralCommentary}</span>
                      </p>
                    )}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Metodoloji Notu:</strong> Negatif kâr (zarar açıklayan dönemler) ve negatif özsermaye durumunda hesaplanan çarpanlar matematiksel sapmayı önlemek adına persentil ve dağılım hesaplarına dahil edilmez. Bu gösterge yatırım tavsiyesi, al/sat sinyali veya ucuz/pahalı tespiti niteliği taşımaz.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TEMEL RASYOLAR & DEĞERLEME ÇARPANLARI */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
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

            {/* SEKTÖR KARŞILAŞTIRMASI & MEDYAN ANALİZİ */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
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
                              {(() => {
                                const badge = getRatioStatusBadge(m.status);
                                return (
                                  <span 
                                    className={cn(
                                      "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                      badge.className
                                    )} 
                                    title={m.reason}
                                  >
                                    {badge.label}
                                  </span>
                                );
                              })()}
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
                              <span className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]" title={g?.reason}>
                                {g?.status === 'available' ? 'Yıllık (YoY)' : getRatioStatusBadge(g?.status || 'unavailable').label}
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

            {/* FİNANSAL TRENDLER (HISTORICAL CHART) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-5">
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

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 4: TEMETTÜLER (DIVIDENDS) */}
        {/* ========================================================================= */}
        {activeNavTab === "dividends" && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                    <Coins className="w-5 h-5 text-[#00008B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Temettü Dağıtım Geçmişi & Kâr Payı</h3>
                    <p className="text-xs font-bold text-slate-400">Resmi Şirket Kâr Payı ve Hak Kullanım Kayıtları</p>
                  </div>
                </div>
                
                <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 self-start sm:self-auto">
                  {combinedDividends.length} Kayıtlı Temettü Ödemesi
                </span>
              </div>

              {dividendLoading ? (
                <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
                  Temettü verileri yükleniyor...
                </div>
              ) : combinedDividends.length > 0 ? (
                <div className="space-y-4">
                  
                  {/* ÖZET KARTLARI */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Son Temettü Tarihi</span>
                      <p className="text-base font-black text-[#00008B]">{combinedDividends[0]?.paymentDate || "—"}</p>
                      <span className="text-[9px] text-slate-400 font-medium block">Resmi Hak Kullanımı</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Son Dağıtım Tutarı (Brüt)</span>
                      <p className="text-base font-black text-emerald-700">{combinedDividends[0]?.netAmountFormatted || "—"}</p>
                      <span className="text-[9px] text-slate-400 font-medium block">Hisse Başına Resmi Brüt Tutar</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Son Temettü Verimi</span>
                      <p className="text-base font-black text-[#00008B]">
                        {combinedDividends[0]?.yieldPercent > 0 ? `%${combinedDividends[0].yieldPercent.toFixed(2)}` : "—"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium block">Güncel Borsa Fiyatına Göre</span>
                    </div>
                  </div>

                  {/* TEMETTÜ TABLOSU */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Hak Kullanım / Ödeme Tarihi</th>
                          <th className="py-3 px-4">Pay Başına Temettü (Brüt)</th>
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

                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  Bu hisse senedi için geçmiş temettü kaydı bulunmamaktadır.
                </div>
              )}
            </div>

            {/* KURUMSAL HAREKETLER / SERMAYE ARTIRIMLARI & BÖLÜNMELER (SPLITS TIMELINE) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5 text-[#00008B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Kurumsal Hareketler & Sermaye Artırımları</h3>
                    <p className="text-xs font-bold text-slate-400">Resmi Sermaye Artırımı, Bedelli, Bedelsiz ve Hisse Bölünmesi (Stock Split) Tarihçesi</p>
                  </div>
                </div>

                <span className="text-xs font-black px-3 py-1 bg-blue-50 text-[#00008B] rounded-xl border border-blue-200 self-start sm:self-auto">
                  {corporateActionsData?.splits ? `${corporateActionsData.splits.length} Sermaye Hareketi` : 'Resmi Kayıtlar'}
                </span>
              </div>

              {corporateActionsLoading ? (
                <div className="py-8 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00008B]" />
                  Sermaye hareketleri yükleniyor...
                </div>
              ) : corporateActionsData?.splits && corporateActionsData.splits.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Tescil / İşlem Tarihi</th>
                          <th className="py-3 px-4">İşlem Türü</th>
                          <th className="py-3 px-4">Bölünme / Dağıtım Oranı</th>
                          <th className="py-3 px-4">Pay Katsayısı</th>
                          <th className="py-3 px-4">Kaynak</th>
                          <th className="py-3 px-4 text-right">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                        {corporateActionsData.splits.map((s: any, idx: number) => {
                          const ratioFormatted = s.numerator && s.denominator ? `${s.numerator} : ${s.denominator}` : (s.splitRatio ? `${s.splitRatio}x` : '—');
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-black text-slate-900">{s.eventDate}</td>
                              <td className="py-3 px-4 text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#00008B]"></span>
                                  Hisse Bölünmesi / Sermaye Artırımı
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#00008B] font-black">{ratioFormatted}</td>
                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{s.splitRatio ?? '—'}</td>
                              <td className="py-3 px-4 text-[10px] text-slate-400 font-medium">BIST / KAP Kayıtları</td>
                              <td className="py-3 px-4 text-right">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-[#00008B] border border-blue-200">
                                  Tamamlandı
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
                    * Şirketin tescil edilmiş sermaye hareketleri tarihsel fiyat serilerindeki düzeltilmiş fiyat hesaplamalarının temelini oluşturur.
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  Bu hisse senedi için geçmiş kurumsal bölünme / sermaye hareketi kaydı bulunmamaktadır.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 6: ORTAKLIK YAPISI VE HARİCİ ANALİSTLER (OWNERSHIP & ANALYSTS) */}
        {/* ========================================================================= */}
        {activeNavTab === "ownership" && (
          <div className="space-y-6">

            {/* 1. ORTAKLIK YAPISI & KURUMSAL SAHİPLİK */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-[#00008B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Ortaklık Yapısı & Sermaye Dağılımı</h3>
                    <p className="text-xs font-bold text-slate-400">Kurumsal Yatırımcılar, Şirket İçi Ortaklar ve Dolaşımdaki Paylar</p>
                  </div>
                </div>

                <span className="text-xs font-black px-3 py-1 bg-blue-50 text-[#00008B] rounded-xl border border-blue-200 self-start sm:self-auto">
                  Resmi KAP & BIST Bildirimleri
                </span>
              </div>

              {ownershipLoading ? (
                <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
                  Ortaklık bilgileri yükleniyor...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ortaklık Metrik Kartları */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kurumsal Sahiplik</span>
                      <p className="text-2xl font-black text-[#00008B]">
                        {ownershipData?.institutionsPercentHeld != null
                          ? `%${(ownershipData.institutionsPercentHeld * 100).toFixed(2)}`
                          : "Veri Mevcut Değil"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Yatırım ve Emeklilik Fonları</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">İçeridekilerin Payı (İnsiders)</span>
                      <p className="text-2xl font-black text-slate-900">
                        {ownershipData?.insidersPercentHeld != null
                          ? `%${(ownershipData.insidersPercentHeld * 100).toFixed(2)}`
                          : "Veri Mevcut Değil"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Yönetim ve Ana Hissedarlar</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kurumsal Yatırımcı Sayısı</span>
                      <p className="text-2xl font-black text-indigo-700">
                        {ownershipData?.institutionsCount != null
                          ? `${ownershipData.institutionsCount} Kurum`
                          : "Veri Mevcut Değil"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Portföyünde Bulunduran Kurumlar</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Toplam Ödenmiş Sermaye</span>
                      <p className="text-xl font-black text-slate-900">
                        {fundamentalsData?.sharesOutstanding
                          ? `${(fundamentalsData.sharesOutstanding / 1_000_000).toFixed(0)} Milyon Pay`
                          : "Veri Mevcut Değil"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Dolaşımdaki Pay Sayısı</span>
                    </div>
                  </div>

                  {/* Önemli Kurumsal Ortaklar Tablosu */}
                  {ownershipData?.topInstitutions && ownershipData.topInstitutions.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#00008B]" />
                        Önemli Kurumsal Pay Sahipleri
                      </h4>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Ortak / Kurum Adı</th>
                              <th className="py-3 px-4 text-right">Pay Oranı</th>
                              <th className="py-3 px-4 text-right">Hisse Adedi</th>
                              <th className="py-3 px-4 text-right">Piyasa Değeri Tutarı</th>
                              <th className="py-3 px-4 text-right">Son Bildirim Tarihi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {ownershipData.topInstitutions.map((inst: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-black text-slate-900">{inst.holder || "—"}</td>
                                <td className="py-3 px-4 text-right text-[#00008B] font-black">
                                  {inst.percentage != null ? `%${(inst.percentage * 100).toFixed(2)}` : "—"}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-800">
                                  {inst.shares != null ? inst.shares.toLocaleString('tr-TR') : "—"}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600">
                                  {inst.value != null ? formatMoney(inst.value, 'TRY') : "—"}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                                  {inst.dateReported || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
                      Bu şirket için detaylı kurumsal fon ortaklık listesi kaydı bulunmamaktadır.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. HARİCİ ANALİST TAHMİNLERİ & HEDEF FİYATLAR */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm">
                    <Target className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{symbol} Harici Analist Konsensüsü</h3>
                    <p className="text-xs font-bold text-slate-400">Piyasa Aracı Kurumları ve Finansal Analistlerin Fiyat Hedefleri</p>
                  </div>
                </div>

                <span className="text-[11px] font-black px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 self-start sm:self-auto">
                  Harici Piyasa Konsensüsü
                </span>
              </div>

              {analystLoading ? (
                <div className="py-12 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00008B]" />
                  Analist konsensüs verileri taranıyor...
                </div>
              ) : analystData && (analystData.targetMeanPrice != null || analystData.numberOfAnalysts != null) ? (
                <div className="space-y-6">
                  {/* Analist Hedef Fiyat Kartları */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ortalama Hedef Fiyat</span>
                      <p className="text-2xl font-black text-[#00008B]">
                        {analystData.targetMeanPrice != null ? `${analystData.targetMeanPrice.toFixed(2)} ₺` : "—"}
                      </p>
                      {analystData.targetMeanPrice != null && stockData?.currentPrice ? (
                        <span className={cn(
                          "text-[10px] font-black",
                          analystData.targetMeanPrice >= stockData.currentPrice ? "text-emerald-700" : "text-rose-700"
                        )}>
                          {analystData.targetMeanPrice >= stockData.currentPrice ? "+" : ""}
                          {(((analystData.targetMeanPrice - stockData.currentPrice) / stockData.currentPrice) * 100).toFixed(1)}% Potansiyel Fark
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold block">Konsensüs Ortalama</span>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Medyan Hedef Fiyat</span>
                      <p className="text-2xl font-black text-slate-900">
                        {analystData.targetMedianPrice != null ? `${analystData.targetMedianPrice.toFixed(2)} ₺` : (analystData.targetMeanPrice != null ? `${analystData.targetMeanPrice.toFixed(2)} ₺` : "—")}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Ortanca Analist Beklentisi</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hedef Fiyat Bandı (Min - Max)</span>
                      <p className="text-xl font-black text-slate-900">
                        {analystData.targetLowPrice != null && analystData.targetHighPrice != null
                          ? `${analystData.targetLowPrice.toFixed(2)} - ${analystData.targetHighPrice.toFixed(2)} ₺`
                          : "Veri Mevcut Değil"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">En Düşük ve En Yüksek Tahmin</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Raporlayan Analist Sayısı</span>
                      <p className="text-2xl font-black text-emerald-700">
                        {analystData.numberOfAnalysts != null ? `${analystData.numberOfAnalysts} Analist` : "—"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block">Aktif Piyasa Kapsamı</span>
                    </div>
                  </div>

                  {/* Konsensüs Eğilimi Badge */}
                  {analystData.recommendationKey && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700">Konsensüs Tavsiye Eğilimi:</span>
                        <span className={cn(
                          "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border",
                          analystData.recommendationKey.includes('buy')
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : analystData.recommendationKey.includes('sell')
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-blue-50 text-[#00008B] border-blue-200"
                        )}>
                          {analystData.recommendationKey === 'strong_buy' ? 'Güçlü Al (Strong Buy)'
                            : analystData.recommendationKey === 'buy' ? 'Al (Buy)'
                            : analystData.recommendationKey === 'hold' ? 'Tut (Hold)'
                            : analystData.recommendationKey === 'underperform' ? 'Zayıf Performans'
                            : analystData.recommendationKey === 'sell' ? 'Sat (Sell)'
                            : analystData.recommendationKey}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {analystData.numberOfAnalysts ? `${analystData.numberOfAnalysts} profesyonel analistin konsensüs skoru` : ''}
                      </span>
                    </div>
                  )}

                  {/* ZORUNLU YASAL UYARI (MADDE 11) */}
                  <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-1">
                    <span className="font-black text-amber-900 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Zorunlu Yasal Uyarı
                    </span>
                    <p className="text-xs font-semibold text-amber-900/90 leading-relaxed">
                      Harici analist verisi — FinAi tarafından üretilmemiştir, yatırım tavsiyesi niteliği taşımaz. Bu sayfada sunulan analist hedef fiyatları ve tavsiyeleri, bağımsız aracı kurumlar ve finansal kuruluşlar tarafından kamuya açıklanan verilerden derlenmiştir. FinAi herhangi bir al/sat tavsiyesi veya getiri garantisi vermez.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-slate-600 font-black text-sm">Bu hisse senedi için aktif harici analist konsensüsü bulunmamaktadır.</p>
                    <p className="text-slate-400 text-xs">FinAi kesinlikle yapay veya sentetik analist tahmini üretmez.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-[11px] text-slate-500 font-medium">
                    * BIST piyasasında işlem gören hisselerin bir kısmında aracı kurumlar tarafından düzenli konsensüs hedef fiyat raporlanmamaktadır. Veri mevcut olduğunda otomatik olarak arşivlenir.
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 5: ÖZEL KAP & HABERLER STÜDYOSU (NEWS STUDIO) */}
        {/* ========================================================================= */}
        {activeNavTab === "news" && (
          <div className="space-y-6">
            
            {/* HABER STÜDYOSU BAŞLIĞI VE CANLI DURUM */}
            <div className="bg-[#00008B] text-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-blue-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#00008B] flex items-center justify-center font-black text-xl shadow-md">
                    <Newspaper className="w-6 h-6 text-[#00008B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">{symbol} KAP & Haberler Stüdyosu</h2>
                    <p className="text-xs text-blue-200 font-medium">Kamuoyu Aydınlatma Platformu (KAP) Duyuruları ve Finansal Basın Akışı</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-blue-900/80 border border-blue-700 text-blue-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Canlı Akış Aktif
                  </span>
                  <button 
                    onClick={fetchNews}
                    disabled={newsLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#00008B] text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 text-[#00008B]", newsLoading && "animate-spin")} />
                    Yenile
                  </button>
                </div>
              </div>

              {/* FİLTRELEME VE ARAMA KONTROL BARI */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                {/* Kategori Filtre Butonları */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "all", label: "Tüm Haberler", count: newsCounts.all },
                    { id: "kap", label: "KAP Bildirimleri", count: newsCounts.kap },
                    { id: "analysis", label: "Bilanço & Finansal Analiz", count: newsCounts.analysis },
                    { id: "other", label: "Genel Haberler", count: newsCounts.other },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewsCategoryFilter(cat.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-black rounded-xl transition-all border whitespace-nowrap flex items-center gap-1.5",
                        newsCategoryFilter === cat.id
                          ? "bg-white text-[#00008B] border-white shadow-md font-black"
                          : "bg-blue-950/60 text-blue-200 border-blue-800/60 hover:bg-blue-800/60 hover:text-white"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded-full font-bold",
                        newsCategoryFilter === cat.id ? "bg-blue-100 text-[#00008B]" : "bg-blue-900 text-blue-300"
                      )}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Arama Inputu */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newsSearchQuery}
                    onChange={(e) => setNewsSearchQuery(e.target.value)}
                    placeholder="Haber veya duyuru ara..."
                    className="w-full pl-9 pr-8 py-1.5 bg-blue-950/70 border border-blue-700/80 rounded-xl text-xs text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-white/40 font-medium"
                  />
                  {newsSearchQuery && (
                    <button 
                      onClick={() => setNewsSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* HABER KARTLARI LİSTESİ */}
            {newsLoading ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-3 shadow-xl">
                <RefreshCw className="w-6 h-6 animate-spin text-[#00008B]" />
                <span>{symbol} güncel haberleri ve KAP bildirimleri taranıyor...</span>
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNews.map((article) => (
                  <div 
                    key={article.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-[#00008B] hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border",
                          (article.category || "").includes("KAP")
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : (article.category || "").includes("Analiz") || (article.category || "").includes("Finans")
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-blue-50 text-[#00008B] border-blue-200"
                        )}>
                          {article.category || "Haber"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{article.pubDate}</span>
                      </div>

                      <h4 
                        onClick={() => setSelectedArticle(article)}
                        className="font-black text-slate-900 text-sm leading-snug hover:text-[#00008B] cursor-pointer transition-colors line-clamp-2"
                      >
                        {article.title}
                      </h4>

                      <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                        {article.summary || article.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">BIST / KAP Akışı</span>
                      <button 
                        onClick={() => setSelectedArticle(article)}
                        className="inline-flex items-center gap-1 text-xs font-black text-[#00008B] hover:underline"
                      >
                        Haberi Detaylı Oku <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs shadow-xl space-y-2">
                <p className="text-slate-600 font-black text-sm">Arama kriterlerine uygun haber bulunamadı.</p>
                <p className="text-slate-400 text-xs">Filtreleri sıfırlayarak tüm haber akışını görüntüleyebilirsiniz.</p>
                {newsSearchQuery && (
                  <button 
                    onClick={() => { setNewsSearchQuery(""); setNewsCategoryFilter("all"); }}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-blue-50 text-[#00008B] text-xs font-black border border-blue-200 inline-flex items-center gap-1"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÜL 8: VERİ KALİTESİ VE DERİNLİK (DATA QUALITY & TRANSPARENCY) */}
        {/* ========================================================================= */}
        {activeNavTab === "quality" && (
          <div className="space-y-6">
            <DataQualityPanel
              qualityData={qualityData}
              symbol={symbol}
              reportingCurrency={finCurrency}
            />

            {/* FİNAİ ARŞİV MİMARİSİ VE ŞEFFAFLIK BİLDİRİMİ */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00008B]" />
                FinAi Veri Bütünlüğü ve Şeffaflık Taahhüdü
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 leading-relaxed">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-[#00008B] uppercase tracking-wider block">
                    1. Kayıpsız Supabase-First Katman
                  </span>
                  <p>
                    Tüm tarihsel fiyat barları, resmi bilançolar, temettü ve sermaye hareketleri PostgreSQL/Supabase veritabanında kayıpsız olarak arşivlenmektedir. İstemciye sunulan her metrik, bu doğrulanmış depolama katmanından okunmaktadır.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-[#00008B] uppercase tracking-wider block">
                    2. Kesinlikle Sentetik Veri Yok
                  </span>
                  <p>
                    FinAi sisteminde eksik veya gecikmeli finansal kalemler asla 0 (sıfır) olarak gösterilmez veya rastgele değerlerle doldurulmaz. Veri yoksa açıkça "Veri Mevcut Değil" veya "Yetersiz Geçmiş Veri" statüsü verilir.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-[#00008B] uppercase tracking-wider block">
                    3. Resmi Brüt Temettü Korunumu
                  </span>
                  <p>
                    Kâr payı dağıtımlarında şirketlerin genel kurullarında onayladığı resmi brüt tutarlar tescil edilmektedir. Tahmini stopaj veya varsayımsal net hesaplama uygulanmaz.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-[#00008B] uppercase tracking-wider block">
                    4. Ağırlıklı Hisse Adediyle EPS
                  </span>
                  <p>
                    Hisse Başına Kâr (EPS) hesaplamalarında ödenmiş sermaye yerine dönem içi ağırlıklı ortalama hisse adedi (weighted average shares) kullanılmaktadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* EDUCATIONAL RATIO TOOLTIP MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRatioTooltip && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedRatioTooltip.name} Eğitici Analiz ve Metodoloji`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedRatioTooltip(null)}
                aria-label="Kapat"
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
                {selectedRatioTooltip.reason && selectedRatioTooltip.status !== 'available' && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                    <span className="font-black text-amber-800 block uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Veri Durumu: {getRatioStatusBadge(selectedRatioTooltip.status || 'unavailable').label}
                    </span>
                    <p className="text-slate-800 font-medium">{selectedRatioTooltip.reason}</p>
                  </div>
                )}

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
              role="dialog"
              aria-modal="true"
              aria-label={selectedArticle.title || "KAP ve Piyasa Haberi"}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                aria-label="Kapat"
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
