'use client';

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart, Info, Brain, X, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, History as HistoryIcon, Calendar, RefreshCw, Activity, ExternalLink, BarChart3, FileText, Search, ArrowUpRight, Coins, Layers, Eye, ArrowUpDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { BIST_CATALOG, TEFAS_CATALOG } from "@/lib/asset-catalog";
import Link from "next/link";
import { HalkarzDividendItem } from "@/app/api/halkarz-dividends/route";

// Grouped Asset Type
interface GroupedAsset {
    symbol: string;
    type: Asset["type"];
    totalQuantity: number;
    totalCost: number;
    avgCost: number;
    transactions: Asset[];
}

// Helper for currency formatting
const formatCurrency = (value: number, currency: string = "₺") => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value).replace('₺', '') + ' ' + currency;
};

// Helper for date formatting
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default function PortfolioPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [priceExtremes, setPriceExtremes] = useState<Record<string, {low: number, high: number, current: number, target?: number, rating?: string}>>({});
    const [earningsDates, setEarningsDates] = useState<Record<string, number>>({});
    const [halkarzDividends, setHalkarzDividends] = useState<HalkarzDividendItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllDividendsModalOpen, setIsAllDividendsModalOpen] = useState(false);
    const [allDividendsSearch, setAllDividendsSearch] = useState("");
    const [newItemValues, setNewItemValues] = useState<{ symbol: string, quantity: string, avgCost: string }>({ symbol: '', quantity: '', avgCost: '' });
    const [newItemType, setNewItemType] = useState<Asset["type"]>("STOCK");

    // Dynamic Focus Mode State
    const [focusedWidget, setFocusedWidget] = useState<string | null>(null);

    // Temettü Takvimi Akıllı Sıralama State
    const [dividendSortOption, setDividendSortOption] = useState<'date-asc' | 'date-desc' | 'amount-desc' | 'amount-asc' | 'yield-desc' | 'yield-asc' | 'symbol-asc' | 'symbol-desc'>('date-asc');

    // Smart Search Autocomplete States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isAssetSelected, setIsAssetSelected] = useState(false);

    // UI states
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

    // Analysis Modal State
    const [analysisModal, setAnalysisModal] = useState<{ isOpen: boolean; loading: boolean; content: string; title: string }>({
        isOpen: false,
        loading: false,
        content: "",
        title: ""
    });

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; assetId: string | null; assetSymbol: string; isTransaction: boolean }>({
        isOpen: false,
        assetId: null,
        assetSymbol: "",
        isTransaction: false
    });

    // Feedback message state
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // 0.65 Hızındaki Pürüzsüz Apple iOS Spring Fizik Motoru
    const iosSpring065Config: any = useMemo(() => ({
        type: "spring",
        stiffness: 75,
        damping: 15,
        mass: 1.1
    }), []);

    // Group assets by symbol
    const groupedAssets = useMemo(() => {
        const groups: Record<string, GroupedAsset> = {};

        assets.forEach(asset => {
            if (!groups[asset.symbol]) {
                groups[asset.symbol] = {
                    symbol: asset.symbol,
                    type: asset.type,
                    totalQuantity: 0,
                    totalCost: 0,
                    avgCost: 0,
                    transactions: []
                };
            }

            groups[asset.symbol].totalQuantity += asset.quantity;
            groups[asset.symbol].totalCost += (asset.quantity * asset.avgCost);
            groups[asset.symbol].transactions.push(asset);
        });

        return Object.values(groups).map(group => {
            group.avgCost = group.totalQuantity > 0 ? group.totalCost / group.totalQuantity : 0;
            group.transactions.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
            return group;
        });
    }, [assets]);

    // Kullanıcının elinde bulunan hisselere filtrelenmiş temettü verisi
    const userPortfolioDividends = useMemo(() => {
        const assetMap = new Map(groupedAssets.map(g => [g.symbol.toUpperCase(), g.totalQuantity]));
        
        const list = halkarzDividends
            .filter(item => assetMap.has(item.symbol))
            .map(item => {
                const quantity = assetMap.get(item.symbol) || 0;
                const totalIncome = quantity * item.netAmountPerShare;
                return {
                    ...item,
                    userQuantity: quantity,
                    totalIncome
                };
            });

        switch (dividendSortOption) {
            case 'amount-asc':
                return list.sort((a, b) => a.netAmountPerShare - b.netAmountPerShare);
            case 'amount-desc':
                return list.sort((a, b) => b.netAmountPerShare - a.netAmountPerShare);
            case 'yield-desc':
                return list.sort((a, b) => b.yieldPercent - a.yieldPercent);
            case 'yield-asc':
                return list.sort((a, b) => a.yieldPercent - b.yieldPercent);
            case 'date-asc':
                return list.sort((a, b) => a.timestamp - b.timestamp);
            case 'date-desc':
                return list.sort((a, b) => b.timestamp - a.timestamp);
            case 'symbol-asc':
                return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
            case 'symbol-desc':
                return list.sort((a, b) => b.symbol.localeCompare(a.symbol));
            default:
                return list;
        }
    }, [halkarzDividends, groupedAssets, dividendSortOption]);

    // Fetch Data
    const fetchPortfolioData = async () => {
        setLoading(true);
        try {
            const storedAssets = await PortfolioService.getAssets();
            setAssets(storedAssets);

            // Fetch HalkArz Dividends
            try {
                const divRes = await fetch('/api/halkarz-dividends');
                const divJson = await divRes.json();
                if (divJson.success && Array.isArray(divJson.data)) {
                    setHalkarzDividends(divJson.data);
                }
            } catch (e) {
                console.error("HalkArz dividends fetch error:", e);
            }

            if (storedAssets.length > 0) {
                const uniqueSymbols = Array.from(new Set(storedAssets.map(a => a.symbol))).join(',');
                try {
                    const res = await fetch(`/api/finance?symbols=${uniqueSymbols}`);
                    const json = await res.json();

                    if (json.results) {
                        const priceMap: Record<string, number> = {};
                        const extremesMap: Record<string, {low: number, high: number, current: number, target?: number, rating?: string}> = {};
                        const earningsMap: Record<string, number> = {};

                        json.results.forEach((r: any) => {
                            if (r.symbol && r.regularMarketPrice) {
                                const symbol = r.symbol.toUpperCase();
                                priceMap[symbol] = r.regularMarketPrice;
                                if (symbol.endsWith('.IS')) { priceMap[symbol.replace('.IS', '')] = r.regularMarketPrice; }

                                const baseSymbol = symbol.replace('.IS', '');
                                
                                const low = r.fiftyTwoWeekLow || r.threeMonthLow;
                                const high = r.fiftyTwoWeekHigh || r.threeMonthHigh;

                                if (low && high) {
                                    extremesMap[baseSymbol] = { 
                                        low: low, 
                                        high: high, 
                                        current: r.regularMarketPrice, 
                                        target: r.targetMeanPrice || undefined, 
                                        rating: r.recommendationKey || undefined 
                                    };
                                }
                                const rawTime = r.earningsTimestamp || r.earningsTimestampStart;
                                if (rawTime) {
                                    const parsedTime = typeof rawTime === 'number' ? rawTime * 1000 : new Date(rawTime).getTime();
                                    if (!isNaN(parsedTime)) earningsMap[baseSymbol] = parsedTime; 
                                }
                            }
                        });

                        setPrices(priceMap);
                        setPriceExtremes(extremesMap);
                        setEarningsDates(earningsMap);
                    }
                } catch (e) {
                    console.error("Network/Parse Error:", e);
                }
            }
        } catch (error) {
            console.error("Failed to load portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolioData();
    }, []);

    // Search Autocomplete
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const ALL_ASSETS = [...BIST_CATALOG, ...TEFAS_CATALOG];
        const localMatches = ALL_ASSETS.filter(asset => 
            asset.symbol.toLowerCase().startsWith(query) || 
            asset.name.toLowerCase().includes(query)
        ).map(asset => ({ symbol: asset.symbol, shortname: asset.name, typeDisp: asset.type })).slice(0, 5);

        if (localMatches.length > 0) {
            setSearchResults(localMatches);
            setShowDropdown(true);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${searchQuery}`);
                const data = await res.json();
                if (data.results) {
                    setSearchResults(data.results.slice(0, 5));
                    setShowDropdown(true);
                }
            } catch (e) { console.error(e); } finally { setIsSearching(false); }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (newItemValues.symbol && newItemValues.quantity && newItemValues.avgCost) {
            try {
                const quantity = Number(newItemValues.quantity);
                const totalCost = Number(newItemValues.avgCost);
                const unitCost = quantity > 0 ? Number((totalCost / quantity).toFixed(4)) : 0;

                await PortfolioService.addAsset({
                    symbol: newItemValues.symbol.toUpperCase(),
                    type: newItemType,
                    quantity: quantity,
                    avgCost: unitCost,
                    dateAdded: new Date().toISOString()
                });

                setIsModalOpen(false);
                setNewItemValues({ symbol: '', quantity: '', avgCost: '' });
                setSearchQuery("");
                setIsAssetSelected(false);
                setFeedback({ message: "İşlem başarıyla kaydedildi!", type: 'success' });
                setTimeout(() => setFeedback(null), 3000);
                await fetchPortfolioData();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    const confirmDelete = (assetId: string, symbol: string, isTransaction: boolean = false) => {
        setDeleteConfirm({ isOpen: true, assetId, assetSymbol: symbol, isTransaction });
    };

    const handleDelete = async () => {
        if (deleteConfirm.assetId) {
            try {
                await PortfolioService.removeAsset(deleteConfirm.assetId);
                setDeleteConfirm({ isOpen: false, assetId: null, assetSymbol: "", isTransaction: false });
                setFeedback({ message: "Kayıt silindi.", type: 'success' });
                setTimeout(() => setFeedback(null), 3000);
                await fetchPortfolioData();
            } catch (error) { console.error(error); }
        }
    };

    const handleAnalyze = async (symbol: string, type: Asset["type"]) => {
        setAnalysisModal({ isOpen: true, loading: true, content: "", title: `${symbol} Analizi` });
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: JSON.stringify({ symbol, type }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            setAnalysisModal(prev => ({ ...prev, loading: false, content: data.analysis }));
        } catch (error) {
            console.error(error);
            setAnalysisModal(prev => ({ ...prev, loading: false, content: "Analiz alınamadı." }));
        }
    };

    const totalValue = assets.reduce((acc, asset) => acc + (asset.quantity * (prices[asset.symbol] || asset.avgCost)), 0);
    const totalCostValue = assets.reduce((acc, asset) => acc + (asset.quantity * asset.avgCost), 0);
    const totalProfit = totalValue - totalCostValue;
    const profitRatio = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;

    // Filtered lists for truncated views vs full views
    const isTableFullyShown = focusedWidget === 'table';
    const displayedAssets = isTableFullyShown ? groupedAssets : groupedAssets.slice(0, 5);

    const isCalendarFullyShown = focusedWidget === 'earnings';
    const earningsEntries = Object.entries(earningsDates);
    const displayedEarnings = isCalendarFullyShown ? earningsEntries : earningsEntries.slice(0, 5);

    const isDividendFullyShown = focusedWidget === 'dividends';
    const displayedUserDividends = userPortfolioDividends.slice(0, 4);

    const isExtremesFullyShown = focusedWidget === 'extremes';
    const extremesEntries = Object.entries(priceExtremes);
    const displayedExtremes = isExtremesFullyShown ? extremesEntries : extremesEntries.slice(0, 5);

    // Filtered & Sorted All Dividends for Modal and Focus Mode
    const sortedFilteredAllDividends = useMemo(() => {
        const filtered = halkarzDividends.filter(item => 
            item.symbol.toLowerCase().includes(allDividendsSearch.toLowerCase()) ||
            item.companyName.toLowerCase().includes(allDividendsSearch.toLowerCase())
        );

        const list = [...filtered];
        switch (dividendSortOption) {
            case 'amount-asc':
                return list.sort((a, b) => a.netAmountPerShare - b.netAmountPerShare);
            case 'amount-desc':
                return list.sort((a, b) => b.netAmountPerShare - a.netAmountPerShare);
            case 'yield-desc':
                return list.sort((a, b) => b.yieldPercent - a.yieldPercent);
            case 'yield-asc':
                return list.sort((a, b) => a.yieldPercent - b.yieldPercent);
            case 'date-asc':
                return list.sort((a, b) => a.timestamp - b.timestamp);
            case 'date-desc':
                return list.sort((a, b) => b.timestamp - a.timestamp);
            case 'symbol-asc':
                return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
            case 'symbol-desc':
                return list.sort((a, b) => b.symbol.localeCompare(a.symbol));
            default:
                return list;
        }
    }, [halkarzDividends, allDividendsSearch, dividendSortOption]);

    // Widget Definitions
    const widgetDefinitions = [
        { id: 'summary', name: 'Bakiye & Özet Kartlar', icon: Wallet, desc: 'Toplam Varlık ve Net Kar/Zarar' },
        { id: 'table', name: 'Portföy Tablosu', icon: FileText, desc: `${groupedAssets.length} Varlık Listesi` },
        { id: 'earnings', name: 'Bilanço Takvimi', icon: Calendar, desc: 'Yaklaşan Şirket Bilançoları' },
        { id: 'dividends', name: 'Temettü Takvimim', icon: Coins, desc: 'HalkArz Canlı Temettü Verileri' },
        { id: 'distribution', name: 'Varlık Dağılım Grafiği', icon: PieChart, desc: 'Portföy Risk & Yığılma Oranı' },
        { id: 'extremes', name: 'Fiyat Analizi (52H)', icon: Activity, desc: '52 Haftalık Fiyat Bantları' },
        { id: 'correlation', name: 'Korelasyon Analizi', icon: BarChart3, desc: 'Yapay Zeka Risk Denge Analizi' }
    ];

    // Shared Container for Main Grid Widgets (Kartın Herhangi Bir Yerine Tıklandığında Doğrudan Odak Modu)
    const renderWidgetCard = (id: string, isFocused: boolean = false) => {
        return (
            <div
                key={id}
                onClick={() => {
                    if (!isFocused) setFocusedWidget(id);
                }}
                className={cn(
                    "w-full transition-all duration-300 rounded-3xl overflow-hidden",
                    !isFocused && "cursor-pointer hover:border-blue-300 hover:shadow-2xl active:scale-[0.99]",
                    isFocused && "ring-2 ring-[#00008B]/20 shadow-2xl"
                )}
            >
                {renderWidgetContent(id, isFocused)}
            </div>
        );
    };

    // Helper: Internal Widget Renderer (Gereksiz "Genişlet", "Modal Aç" butonları kaldırılmış yalın tasarım)
    const renderWidgetContent = (id: string, isFocused: boolean = false) => {
        switch(id) {
            case 'summary':
                return (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                        <Wallet className="w-3.5 h-3.5 text-[#00008B]" />
                                    </div>
                                    <span className="text-[#00008B]/60 text-[10px] font-bold uppercase tracking-widest">Toplam Varlık Değeri</span>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-[#00008B] tracking-tighter mt-1">
                                {formatCurrency(totalValue)}
                            </h2>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Canlı Piyasa Değerlemesi</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                        {totalProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                                    </div>
                                    <span className="text-[#00008B]/60 text-[10px] font-bold uppercase tracking-widest">Net Kâr / Zarar</span>
                                </div>
                                <div className={cn("px-2 py-0.5 rounded-lg text-xs font-black border", totalProfit >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-rose-50 text-rose-700 border-rose-200/60")}>
                                    %{profitRatio.toFixed(2)}
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className={cn("text-2xl md:text-3xl font-black tracking-tight block", totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                            className="w-full bg-blue-50/40 hover:bg-blue-50 border border-dashed border-blue-200/80 hover:border-[#00008B] rounded-2xl p-4 flex items-center justify-center gap-2.5 text-[#00008B] font-bold text-xs uppercase tracking-wider transition-all group shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-[#00008B] group-hover:scale-110 transition-transform" />
                            <span>Yeni İşlem Ekle</span>
                        </button>
                    </div>
                );

            case 'table':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-[#00008B]/5 overflow-hidden flex flex-col justify-between h-full">
                        <div>
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-[#00008B] tracking-tight">Portföy Tablosu</h3>
                                    <div className="text-[10px] font-bold text-[#00008B] bg-blue-50 border border-blue-200/50 px-3 py-1 rounded-full">
                                        {groupedAssets.length} VARLIK
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] text-[#00008B]/50 uppercase tracking-widest font-bold border-b border-slate-100 bg-slate-50/50">
                                            <th className="py-4 px-6">Varlık</th>
                                            <th className="py-4 px-4">Maliyet / Adet</th>
                                            <th className="py-4 px-4">Anlık</th>
                                            <th className="py-4 px-4">Bakiye</th>
                                            <th className="py-4 px-4">Kâr/Zarar</th>
                                            <th className="py-4 px-6 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {groupedAssets.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[#00008B]/40 font-medium text-sm">
                                                    Henüz eklenmiş bir varlığınız bulunmuyor.
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence initial={false}>
                                                {displayedAssets.map((group) => {
                                                    const currentPrice = prices[group.symbol] || 0;
                                                    const marketValue = currentPrice * group.totalQuantity;
                                                    const profit = marketValue - group.totalCost;
                                                    const isProfit = profit >= 0;
                                                    const isExpanded = expandedSymbol === group.symbol;

                                                    return (
                                                        <React.Fragment key={group.symbol}>
                                                            <tr 
                                                                className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                                                onClick={(e) => { e.stopPropagation(); setExpandedSymbol(isExpanded ? null : group.symbol); }}
                                                            >
                                                                <td className="py-4 px-6 font-bold text-[#00008B]">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-base font-black tracking-tight">{group.symbol}</span>
                                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/50 text-blue-700 font-bold uppercase tracking-wider">{group.type}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-4">
                                                                    <div className="flex flex-col text-xs font-semibold">
                                                                        <span className="text-[#00008B]">{group.totalQuantity} adet</span>
                                                                        <span className="text-slate-400 text-[11px]">{formatCurrency(group.avgCost)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-4 font-bold text-[#00008B]">
                                                                    {currentPrice > 0 ? formatCurrency(currentPrice) : "-"}
                                                                </td>
                                                                <td className="py-4 px-4 font-black text-[#00008B]">
                                                                    {formatCurrency(marketValue)}
                                                                </td>
                                                                <td className="py-4 px-4">
                                                                    <div className={cn("inline-flex items-center px-2.5 py-1 rounded-xl font-bold text-xs border", isProfit ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-rose-50 text-rose-700 border-rose-200/60")}>
                                                                        {isProfit ? "+" : ""}{formatCurrency(profit)}
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-6 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleAnalyze(group.symbol, group.type); }} 
                                                                            className="p-2 hover:bg-blue-100/60 text-[#00008B] rounded-xl transition-colors"
                                                                            title="AI Analizi"
                                                                        >
                                                                            <Brain className="w-4 h-4" />
                                                                        </button>
                                                                        <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-90 text-[#00008B]")} />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={6} className="bg-slate-50/80 p-4 border-t border-b border-slate-100">
                                                                        <div className="space-y-2 max-w-2xl">
                                                                            <div className="text-[10px] font-bold text-[#00008B]/60 uppercase tracking-widest mb-2">İşlem Geçmişi</div>
                                                                            {group.transactions.map(tx => (
                                                                                <div key={tx.id} className="flex justify-between text-xs py-2 px-3 bg-white rounded-xl border border-slate-100 items-center">
                                                                                    <span className="text-slate-400 font-medium">{formatDate(tx.dateAdded)}</span>
                                                                                    <span className="text-[#00008B] font-bold">{tx.quantity} adet @ {formatCurrency(tx.avgCost)}</span>
                                                                                    <button onClick={(e) => { e.stopPropagation(); confirmDelete(tx.id, group.symbol, true); }} className="text-slate-400 hover:text-rose-600 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'earnings':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#00008B]" />
                                <h3 className="text-sm font-bold text-[#00008B] uppercase tracking-wider">Bilanço Takvimi</h3>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-hidden">
                            {earningsEntries.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center font-medium">Yaklaşan bilanço verisi yok.</p>
                            ) : (
                                displayedEarnings.map(([sym, time]) => {
                                    const days = Math.ceil((time - Date.now()) / (86400000));
                                    if (days < -30) return null;
                                    const isReported = days <= 0;
                                    const kapUrl = isReported ? `/api/kap-link?symbol=${sym}` : null;

                                    return (
                                        <div key={sym} className="flex flex-col p-3 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs gap-1.5 hover:bg-blue-50/40 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#00008B] text-sm">{sym}</span>
                                                    <span className="text-[9px] text-[#00008B]/40 font-bold uppercase tracking-wider">Bilanço Dönemi</span>
                                                </div>
                                                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", days > 0 ? "bg-blue-50 text-blue-700 border-blue-200/50" : "bg-emerald-50 text-emerald-700 border-emerald-200/50")}>
                                                    {days > 0 ? `${days} GÜN KALDI` : "AÇIKLANDI"}
                                                </span>
                                            </div>
                                            {kapUrl && (
                                                <a 
                                                    href={kapUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1.5 text-[10px] text-[#00008B] font-bold hover:underline bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/50 w-fit mt-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Bilançoya ulaşmak için tıklayınız
                                                </a>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );

            case 'dividends':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-sm font-bold text-[#00008B] uppercase tracking-wider">
                                        {isFocused ? "Tüm Piyasa Temettü Takvimi" : "Temettü Takvimim"}
                                    </h3>
                                </div>
                                {isFocused && (
                                    <div className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/60 rounded-xl px-2.5 py-1.5 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                        <ArrowUpDown className="w-3.5 h-3.5 text-[#00008B]" />
                                        <span className="text-[10px] font-bold text-[#00008B] uppercase hidden sm:inline">Sırala:</span>
                                        <select
                                            value={dividendSortOption}
                                            onChange={(e) => setDividendSortOption(e.target.value as any)}
                                            className="bg-transparent text-xs font-black text-[#00008B] focus:outline-none cursor-pointer"
                                        >
                                            <option value="amount-asc">Net Tutar: En Düşük → En Yüksek (₺/Pay)</option>
                                            <option value="amount-desc">Net Tutar: En Yüksek → En Düşük (₺/Pay)</option>
                                            <option value="yield-desc">Verim: En Yüksek → En Düşük (%)</option>
                                            <option value="yield-asc">Verim: En Düşük → En Yüksek (%)</option>
                                            <option value="date-asc">Tarih: En Yakın → En Uzak</option>
                                            <option value="date-desc">Tarih: En Uzak → En Yakın</option>
                                            <option value="symbol-asc">Hisse Kodu: A → Z</option>
                                            <option value="symbol-desc">Hisse Kodu: Z → A</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* ODAK MODUNDA DOĞRUDAN TÜM PİYASA TEMETTÜ TAKVİMİ LİSTESİ VE AKILLI SIRALAMA */}
                            {isFocused ? (
                                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                        <div className="relative flex-1 w-full">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Hisse Kodu veya Şirket Adı Ara..."
                                                className="w-full bg-slate-50 border border-slate-200 text-[#00008B] font-bold text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all"
                                                value={allDividendsSearch}
                                                onChange={(e) => setAllDividendsSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {sortedFilteredAllDividends.length === 0 ? (
                                            <p className="text-center py-6 text-slate-400 text-xs font-medium">Aramanızla eşleşen temettü verisi bulunamadı.</p>
                                        ) : (
                                            sortedFilteredAllDividends.map((item) => {
                                                const isUserAsset = groupedAssets.some(g => g.symbol === item.symbol);
                                                const userAssetObj = groupedAssets.find(g => g.symbol === item.symbol);
                                                const userTotalNet = userAssetObj ? userAssetObj.totalQuantity * item.netAmountPerShare : 0;

                                                return (
                                                    <div 
                                                        key={item.symbol} 
                                                        className={cn(
                                                            "p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs gap-3",
                                                            isUserAsset ? "bg-emerald-50/80 border-emerald-300 shadow-sm" : "bg-slate-50/70 border-slate-100 hover:bg-blue-50/40"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-[#00008B] text-xs shrink-0 shadow-sm">
                                                                {item.symbol}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-black text-[#00008B] text-sm">{item.companyName}</span>
                                                                    {isUserAsset && (
                                                                        <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-emerald-600 text-white uppercase">
                                                                            Portföyde ({userAssetObj?.totalQuantity} Adet)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-semibold">Tarih: <b>{item.paymentDate}</b></span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="text-[#00008B] font-black text-sm block">{item.netAmountFormatted} / Pay</span>
                                                            <span className="text-emerald-700 font-bold text-[10px]">%{item.yieldPercent} Verim</span>
                                                            {isUserAsset && (
                                                                <span className="text-emerald-800 font-black text-[11px] block mt-0.5">{formatCurrency(userTotalNet)} Net</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* SADECE PORTFÖYDEKİ HİSSELERE ÖZEL VARSAYILAN KISA LİSTE */
                                <div className="space-y-3 overflow-hidden">
                                    {displayedUserDividends.length === 0 ? (
                                        <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-slate-100 my-2">
                                            <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 font-medium">Portföyünüzdeki hisselere ait duyurulmuş temettü kararı bulunmuyor.</p>
                                        </div>
                                    ) : (
                                        displayedUserDividends.map((item) => (
                                            <div key={item.symbol} className="flex flex-col gap-2 p-3.5 rounded-2xl border bg-emerald-50/60 border-emerald-200/60 hover:bg-emerald-50 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-black text-[#00008B] text-sm">{item.symbol}</span>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                %{item.yieldPercent} Verim
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{item.companyName}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-emerald-700 font-black text-sm block">{formatCurrency(item.totalIncome)}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{item.userQuantity} Adet İçin Net</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] mt-1 pt-2 border-t border-emerald-200/40">
                                                    <div className="flex items-center gap-1 text-slate-600 font-semibold">
                                                        <Calendar className="w-3 h-3 text-[#00008B]" />
                                                        <span>Tarih: {item.paymentDate}</span>
                                                    </div>
                                                    <div className="text-slate-600 font-bold">
                                                        Net: <span className="text-[#00008B] font-black">{item.netAmountFormatted}</span> / Pay
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'distribution':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-[#00008B]" />
                                <h3 className="font-bold text-[#00008B] text-xs uppercase tracking-wider">Varlık Dağılım Grafiği</h3>
                            </div>
                        </div>

                        {assets.length > 0 && totalValue > 0 ? (
                            <div className="space-y-4">
                                <div className="h-6 w-full rounded-2xl flex overflow-hidden border border-slate-100 bg-slate-50 p-0.5 shadow-inner">
                                    {groupedAssets.sort((a,b) => (prices[b.symbol]*b.totalQuantity) - (prices[a.symbol]*a.totalQuantity)).map((group, idx) => {
                                        const marketValue = (prices[group.symbol] || group.avgCost) * group.totalQuantity;
                                        if (marketValue <= 0) return null;
                                        const weight = (marketValue / totalValue) * 100;
                                        const colors = ["bg-[#00008B]", "bg-sky-500", "bg-indigo-600", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
                                        return (
                                            <div 
                                                key={group.symbol} 
                                                className={`h-full ${colors[idx % colors.length]} flex items-center justify-center relative first:rounded-l-xl last:rounded-r-xl transition-all duration-300`}
                                                style={{ width: `${weight}%` }}
                                                title={`${group.symbol}: %${weight.toFixed(1)}`}
                                            >
                                                {weight > 6 && <span className="text-white font-bold text-[10px] truncate px-1">{group.symbol}</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    {groupedAssets.map((group, idx) => {
                                        const marketValue = (prices[group.symbol] || group.avgCost) * group.totalQuantity;
                                        const weight = totalValue > 0 ? (marketValue / totalValue) * 100 : 0;
                                        const colors = ["bg-[#00008B]", "bg-sky-500", "bg-indigo-600", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
                                        return (
                                            <div key={group.symbol} className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                                                    <span className="font-bold text-[#00008B] text-xs">{group.symbol}</span>
                                                </div>
                                                <span className="font-black text-slate-500 text-xs">%{weight.toFixed(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center font-medium">Grafik için varlık verisi bekleniyor.</p>
                        )}
                    </div>
                );

            case 'extremes':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-[#00008B]/5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#00008B]" />
                                <h3 className="text-sm font-bold text-[#00008B] uppercase tracking-wider">Fiyat Analizi (52H)</h3>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-hidden">
                            {extremesEntries.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center font-medium">Analiz verisi bekleniyor...</p>
                            ) : (
                                displayedExtremes.map(([sym, ext]) => {
                                    const pos = Math.min(100, Math.max(0, ((ext.current - ext.low) / (ext.high - ext.low || 1)) * 100));
                                    return (
                                        <div key={sym} className="space-y-2 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-[#00008B] font-black">{sym}</span>
                                                <span className="text-[#00008B] bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded-lg text-xs">
                                                    {formatCurrency(ext.current)}
                                                </span>
                                            </div>
                                            
                                            <div className="relative py-1">
                                                <div className="h-2 bg-slate-200/80 rounded-full w-full overflow-hidden flex">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 relative transition-all duration-1000"
                                                        style={{ width: `${pos}%` }}
                                                    />
                                                </div>
                                                <div 
                                                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#00008B] rounded-full border-2 border-white shadow-md z-10 transition-all duration-1000"
                                                    style={{ left: `calc(${pos}% - 7px)` }}
                                                />
                                            </div>

                                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                <span>DÜŞÜK: {formatCurrency(ext.low)}</span>
                                                <span>YÜKSEK: {formatCurrency(ext.high)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );

            case 'correlation':
                return (
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-[#00008B]/5 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#00008B] text-xs font-bold border border-blue-200/50">
                                <Activity className="w-3.5 h-3.5" />
                                Yapay Zeka Destekli Risk Dengesi
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-3xl">
                                <h3 className="text-2xl md:text-3xl font-black text-[#00008B] tracking-tight">
                                    Korelasyon Analizi
                                </h3>
                                <p className="text-sm font-medium text-[#00008B]/60 leading-relaxed">
                                    Portföyünüzdeki varlıkların birbirleriyle olan etkileşimini ve risk yığılmalarını analiz edin. Yapay zeka algoritmamızla yatırımlarınız arasındaki ilişkileri inceleyerek portföy dengenizi optimize edin.
                                </p>
                            </div>

                            <Link 
                                href="/dashboard/portfolio/correlation" 
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl text-xs tracking-wider uppercase shadow-lg shadow-[#00008B]/20 transition-all shrink-0 active:scale-95"
                            >
                                <span>Korelasyon Analizini Başlat</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 min-h-full bg-white text-slate-800 rounded-[2.5rem] shadow-xl shadow-[#00008B]/5 pb-24 relative isolate m-2 xl:m-4 border border-slate-100 overflow-hidden font-sans">
            
            {/* Ambient Soft Blue Light Leaks */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-50/70 blur-[130px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-slate-50/90 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Notification Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={cn(
                            "fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl font-bold text-sm tracking-tight",
                            feedback.type === 'success' 
                                ? 'bg-white/95 border-emerald-200 text-emerald-700 shadow-emerald-900/5' 
                                : 'bg-white/95 border-rose-200 text-rose-700 shadow-rose-900/5'
                        )}
                    >
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                        <span>{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/80 border border-blue-200/50 text-[#00008B] text-xs font-bold mb-2 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00008B]"></span>
                        </span>
                        Akıllı Portföy Yönetimi
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#00008B] tracking-tight flex items-center gap-3">
                        Portföyüm
                        {focusedWidget && (
                            <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={iosSpring065Config}
                                className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Odak Modu
                            </motion.span>
                        )}
                    </h1>
                    <p className="text-sm font-medium text-[#00008B]/60 mt-1">
                        BIST hisseleriniz ve TEFAS fonlarınızın canlı analizlerini tek bir ekrandan yönetin.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {focusedWidget && (
                        <button
                            onClick={() => setFocusedWidget(null)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl border border-rose-200/60 text-xs transition-all active:scale-95 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Odak Modundan Çık
                        </button>
                    )}
                    <button
                        onClick={fetchPortfolioData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#00008B] font-bold rounded-2xl border border-slate-200 text-xs transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-[#00008B]", loading && "animate-spin")} />
                        Yenile
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl text-xs shadow-lg shadow-[#00008B]/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        İşlem Ekle
                    </button>
                </div>
            </div>

            {/* UNIFIED DIRECT CLICK FOCUS MODE LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {focusedWidget === null ? (
                    /* 1. BAŞLANGIÇ DURUMU (DEFAULT 65/35 GRID) */
                    <>
                        {/* SOL SÜTUN (%65 - 8/12 Cols) */}
                        <div className="xl:col-span-8 space-y-8">
                            {renderWidgetCard('table')}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderWidgetCard('earnings')}
                                {renderWidgetCard('dividends')}
                            </div>
                        </div>

                        {/* SAĞ SÜTUN (%35 - 4/12 Cols) */}
                        <div className="xl:col-span-4 space-y-8">
                            {renderWidgetCard('summary')}
                            {renderWidgetCard('distribution')}
                            {renderWidgetCard('extremes')}
                        </div>

                        {/* ALT ALAN: KORELASYON ANALİZİ MODÜLÜ */}
                        <div className="xl:col-span-12">
                            {renderWidgetCard('correlation')}
                        </div>
                    </>
                ) : (
                    /* 2. ODAK MODU DURUMU (DOĞRUDAN WIDGET TIKLAMASIYLA YALIN ODAK) */
                    <>
                        {/* SOL TARAFA YAYILAN ODAKLANILAN WIDGET ALANI (%65 - 8/12 Cols) */}
                        <div className="xl:col-span-8 space-y-4">
                            {/* ODAKLANILAN WIDGET CARD */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={focusedWidget}
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                                    transition={iosSpring065Config}
                                    className="w-full"
                                >
                                    {renderWidgetCard(focusedWidget, true)}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* SAĞ TARAFTA SÜREKLİ EN ÜSTTE SABİT TOPLAM VARLIK & NET KÂR/ZARAR + DİKEY SIKIŞTIRILMIŞ DİĞER ŞERİTLER (%35 - 4/12 Cols) */}
                        <div className="xl:col-span-4 space-y-5">
                            
                            {/* TOPLAM VARLIK DEĞERİ VE NET KÂR/ZARAR ÖZET KARTI - SÜREKLİ SAĞ ÜSTTE SABİT */}
                            {focusedWidget !== 'summary' && (
                                <div className="w-full">
                                    {renderWidgetCard('summary')}
                                </div>
                            )}

                            {/* DİĞER MODÜLLER SIKIŞTIRILMIŞ ŞERİTLER */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-100">
                                    <span className="text-xs font-black text-[#00008B] uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-[#00008B]" />
                                        Diğer Modüller
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">Tıkla Odağa Al</span>
                                </div>

                                <div className="space-y-2 overflow-hidden">
                                    <AnimatePresence initial={false}>
                                        {widgetDefinitions
                                            .filter(w => w.id !== focusedWidget && w.id !== 'summary')
                                            .map((widget) => {
                                                const WidgetIcon = widget.icon;
                                                return (
                                                    <motion.div
                                                        key={widget.id}
                                                        layout="position"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={iosSpring065Config}
                                                        onClick={() => setFocusedWidget(widget.id)}
                                                        className="bg-white hover:bg-blue-50/70 border border-slate-100 hover:border-blue-300 rounded-2xl p-3 shadow-md hover:shadow-xl cursor-pointer transition-all flex items-center justify-between group overflow-hidden"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#00008B] group-hover:bg-[#00008B] group-hover:text-white transition-colors shrink-0">
                                                                <WidgetIcon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-[#00008B] text-xs group-hover:text-blue-600 transition-colors leading-tight">
                                                                    {widget.name}
                                                                </h4>
                                                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                                                    {widget.desc}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 text-[10px] font-black text-[#00008B] bg-slate-50 group-hover:bg-[#00008B] group-hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all shrink-0">
                                                            <span>Sola Taşı</span>
                                                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>

            {/* AI Analysis Modal */}
            <AnimatePresence>
                {analysisModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-100 rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl text-[#00008B]">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-black flex items-center gap-3 text-[#00008B]"><Brain className="w-5 h-5 text-blue-600" />{analysisModal.title}</h2>
                                <button onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#00008B] transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            {analysisModal.loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#00008B]" />
                                    <span className="text-sm font-bold text-slate-400">Yapay Zeka Analizi Hazırlanıyor...</span>
                                </div>
                            ) : (
                                <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-sm">{analysisModal.content}</div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDeleteConfirm({ isOpen: false, assetId: null, assetSymbol: "", isTransaction: false })} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-100 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-[#00008B]">
                            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                <Trash2 className="w-7 h-7 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-black text-[#00008B]">Silmeyi Onayla</h3>
                            <p className="text-xs text-slate-500 font-medium my-3">{deleteConfirm.assetSymbol} varlığı silinecektir. Emin misiniz?</p>
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors" onClick={() => setDeleteConfirm({ isOpen: false, assetId: null, assetSymbol: "", isTransaction: false })}>
                                    Vazgeç
                                </button>
                                <button className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/20 transition-all" onClick={handleDelete}>
                                    Sil
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-100 rounded-3xl p-8 w-full max-w-md shadow-2xl text-[#00008B]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-[#00008B]">İşlem Ekle</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#00008B] transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAddAsset} className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-[#00008B]/60 uppercase tracking-wider mb-2 block">Varlık Tipi</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { type: "STOCK", label: "Hisse" },
                                            { type: "FUND", label: "Fon" },
                                            { type: "GOLD", label: "Altın" },
                                            { type: "CRYPTO", label: "Kripto" }
                                        ].map(item => (
                                            <button 
                                                key={item.type} 
                                                type="button" 
                                                onClick={() => setNewItemType(item.type as any)} 
                                                className={cn(
                                                    "py-2.5 text-xs font-bold rounded-xl transition-all border",
                                                    newItemType === item.type 
                                                        ? "bg-[#00008B] text-white border-[#00008B] shadow-md" 
                                                        : "bg-slate-50 text-[#00008B] border-slate-200 hover:bg-slate-100"
                                                )}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="text-[11px] font-bold text-[#00008B]/60 uppercase tracking-wider mb-2 block">Sembol veya Varlık Adı</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Örn: THYAO, MAC..." 
                                            className="w-full bg-slate-50 border border-slate-200 text-[#00008B] font-bold placeholder:text-[#00008B]/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all text-sm" 
                                            value={searchQuery} 
                                            onChange={e => { setSearchQuery(e.target.value); setNewItemValues({...newItemValues, symbol: e.target.value.toUpperCase()}); setIsAssetSelected(false); }} 
                                            onFocus={() => setShowDropdown(true)} 
                                            required
                                        />
                                        {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B] animate-spin" />}
                                    </div>

                                    {/* Smart Search Dropdown */}
                                    {showDropdown && searchResults.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                            {searchResults.map((res, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => {
                                                        setNewItemValues({ ...newItemValues, symbol: res.symbol });
                                                        setSearchQuery(res.symbol);
                                                        setShowDropdown(false);
                                                        setIsAssetSelected(true);
                                                    }}
                                                    className="px-4 py-3 hover:bg-blue-50/60 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-[#00008B] text-sm">{res.symbol}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{res.shortname}</span>
                                                    </div>
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/50 uppercase">{res.typeDisp || newItemType}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#00008B]/60 uppercase tracking-wider mb-2 block">Adet</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            placeholder="100" 
                                            className="w-full bg-slate-50 border border-slate-200 text-[#00008B] font-bold placeholder:text-[#00008B]/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all text-sm" 
                                            value={newItemValues.quantity} 
                                            onChange={e => setNewItemValues({...newItemValues, quantity: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[#00008B]/60 uppercase tracking-wider mb-2 block">Toplam Maliyet (₺)</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            placeholder="2500" 
                                            className="w-full bg-slate-50 border border-slate-200 text-[#00008B] font-bold placeholder:text-[#00008B]/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00008B]/10 focus:border-[#00008B] transition-all text-sm" 
                                            value={newItemValues.avgCost} 
                                            onChange={e => setNewItemValues({...newItemValues, avgCost: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-3.5 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl shadow-[#00008B]/20 transition-all text-sm mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "İşlem Kaydet"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
