'use client';

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart, Info, Brain, X, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, History as HistoryIcon, Calendar, RefreshCw, Activity, ExternalLink, BarChart3, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { BIST_CATALOG, TEFAS_CATALOG } from "@/lib/asset-catalog";
import { GlowCard } from "@/components/ui/spotlight-card";
import { getKapUrl } from "@/lib/kap-member-map";

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
    const [dividendData, setDividendData] = useState<Record<string, { date: number, amount: number, isEstimate?: boolean }>>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItemValues, setNewItemValues] = useState<{ symbol: string, quantity: string, avgCost: string }>({ symbol: '', quantity: '', avgCost: '' });
    const [newItemType, setNewItemType] = useState<Asset["type"]>("STOCK");

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

    // Fetch Data
    const fetchPortfolioData = async () => {
        setLoading(true);
        try {
            const storedAssets = await PortfolioService.getAssets();
            setAssets(storedAssets);

            if (storedAssets.length > 0) {
                const uniqueSymbols = Array.from(new Set(storedAssets.map(a => a.symbol))).join(',');
                try {
                    const res = await fetch(`/api/finance?symbols=${uniqueSymbols}`);
                    const json = await res.json();
                    
                    let divResponse: any = null;
                    try {
                        divResponse = await fetch(`/api/dividends?symbols=${uniqueSymbols}`);
                    } catch (e) { console.error(e); }

                    if (json.results) {
                        const priceMap: Record<string, number> = {};
                        const extremesMap: Record<string, {low: number, high: number, current: number, target?: number, rating?: string}> = {};
                        const earningsMap: Record<string, number> = {};
                        const dividendMap: Record<string, { date: number, amount: number, isEstimate?: boolean }> = {};

                        json.results.forEach((r: any) => {
                            if (r.symbol && r.regularMarketPrice) {
                                const symbol = r.symbol.toUpperCase();
                                priceMap[symbol] = r.regularMarketPrice;
                                if (symbol.endsWith('.IS')) { priceMap[symbol.replace('.IS', '')] = r.regularMarketPrice; }

                                const baseSymbol = symbol.replace('.IS', '');
                                
                                // Priority: 52-Week Data for long-term perspective
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
                                if (r.dividendDate) { dividendMap[baseSymbol] = { date: r.dividendDate * 1000, amount: 0 }; }
                            }
                        });
                        // Gelişmiş Gerçek Temettü API'si (Fintables/Yahoo)
                        if (divResponse && divResponse.ok) {
                            const divJson = await divResponse.json();
                            // divJson is an object { THYAO: { date: number, amount: number }, ... }
                            if (divJson && !divJson.error) {
                                Object.entries(divJson).forEach(([sym, data]: [string, any]) => {
                                    if (data && data.amount > 0) {
                                        dividendMap[sym] = { date: data.date, amount: data.amount, isEstimate: data.isEstimate };
                                    }
                                });
                            }
                        }

                        setPrices(priceMap);
                        setPriceExtremes(extremesMap);
                        setEarningsDates(earningsMap);
                        setDividendData(dividendMap);
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Search Autocomplete (BIST_CATALOG Optimization)
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

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-full bg-gradient-to-br from-white via-indigo-50/30 to-slate-900 rounded-[2.5rem] shadow-xl pb-24 relative isolate m-2 xl:m-4 border border-white/20">
            {/* Reduced blur size for better performance */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 blur-[40px] rounded-full pointer-events-none" />
            
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} backdrop-blur-xl`}
                    >
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-bold text-sm tracking-tight">{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bento Grid Layout - White & Navy Contrast */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlowCard customSize glowColor="primary" className="md:col-span-2 h-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="bg-white border border-slate-200 p-8 h-full relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Toplam Varlık Değeri</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mt-4">{formatCurrency(totalValue)}</h2>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-slate-400 text-[10px] tracking-wide uppercase font-semibold">Canlı Piyasa Değerlemesi</p>
                            </div>
                        </div>
                    </div>
                </GlowCard>

                <GlowCard customSize glowColor="navy" className="md:col-span-1 h-auto shadow-xl shadow-black/20">
                    <div className="bg-slate-900/80 border border-slate-800 p-6 h-full flex flex-col justify-between group transition-all hover:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2">
                                {totalProfit >= 0 ? <TrendingUp className="w-4 h-4 text-slate-400" /> : <TrendingDown className="w-4 h-4 text-slate-400" />}
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Net Kâr / Zarar</span>
                            </div>
                            <div className={`mt-4 flex flex-col gap-1 ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                <span className="text-2xl font-black tracking-tight">{totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}</span>
                            </div>
                        </div>
                        <div className="mt-4 border-t border-slate-800 pt-4 flex gap-2 items-center">
                            <div className={`px-2 py-1 rounded-md text-[10px] font-black ${totalProfit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                %{profitRatio.toFixed(2)}
                            </div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">Getiri</span>
                        </div>
                    </div>
                </GlowCard>

                <GlowCard customSize glowColor="blue" className="md:col-span-1 h-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-full bg-slate-900/30 hover:bg-blue-600 border border-slate-800 border-dashed hover:border-blue-500 p-6 flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white transition-all group"
                    >
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-hover:bg-blue-500 transition-colors">
                            <Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest group-hover:drop-shadow-md">İşlem Ekle</span>
                    </button>
                </GlowCard>
            </div>

            {/* Risk Haritası */}
            {assets.length > 0 && totalValue > 0 && (
                <GlowCard customSize glowColor="blue" className="h-auto shadow-xl shadow-black/20">
                    <div className="bg-slate-900/80 border border-slate-800 p-6 group hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-blue-400" />
                                <h3 className="font-bold text-white text-sm">Risk & Yığılma Haritası</h3>
                            </div>
                        </div>
                        <div className="h-6 w-full rounded flex overflow-hidden border border-slate-800 relative shadow-inner">
                            {groupedAssets.sort((a,b) => (prices[b.symbol]*b.totalQuantity) - (prices[a.symbol]*a.totalQuantity)).map((group, idx) => {
                                const marketValue = (prices[group.symbol] || group.avgCost) * group.totalQuantity;
                                if (marketValue <= 0) return null;
                                const weight = (marketValue / totalValue) * 100;
                                const colors = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600"];
                                return (
                                    <motion.div key={group.symbol} initial={{ width: 0 }} animate={{ width: `${weight}%` }} className={`h-full ${colors[idx % colors.length]} flex items-center justify-center relative`}>
                                        {weight > 5 && <span className="text-white/90 font-bold text-[10px] truncate">{group.symbol}</span>}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </GlowCard>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
                {/* Main Table Section */}
                <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden relative">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-end">
                        <h3 className="text-xl font-black text-white">Portföy Tablosu</h3>
                        <div className="text-[10px] text-slate-400 font-bold border border-slate-700 bg-slate-800 px-2 py-1 rounded">
                            {groupedAssets.length} FARKLI VARLIK
                        </div>
                    </div>

                    <div className="overflow-x-auto p-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
                                    <th className="py-4 px-1">Varlık</th>
                                    <th className="py-4 px-1">Maliyet / Adet</th>
                                    <th className="py-4 px-1">Anlık</th>
                                    <th className="py-4 px-1">Bakiye</th>
                                    <th className="py-4 px-1">Kâr/Zarar</th>
                                    <th className="py-4 px-1 text-right">#</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                                {groupedAssets.map((group) => {
                                    const currentPrice = prices[group.symbol] || 0;
                                    const marketValue = currentPrice * group.totalQuantity;
                                    const profit = marketValue - group.totalCost;
                                    const isProfit = profit >= 0;
                                    const isExpanded = expandedSymbol === group.symbol;

                                    return (
                                        <React.Fragment key={group.symbol}>
                                            <motion.tr 
                                                initial={false}
                                                whileHover="hover"
                                                className="group cursor-pointer border-b border-white/5 relative overflow-hidden transition-colors" 
                                                onClick={() => setExpandedSymbol(isExpanded ? null : group.symbol)}
                                                onMouseMove={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const x = e.clientX - rect.left;
                                                    const y = e.clientY - rect.top;
                                                    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                                                    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                                                }}
                                            >
                                                {/* Advanced Spotlight Glow */}
                                                <div 
                                                    className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{
                                                        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.08), transparent 40%)`
                                                    }}
                                                />
                                                <td className="py-4 px-1 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-200">{group.symbol}</span>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 uppercase tracking-tighter">{group.type}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-1 relative z-10">
                                                    <div className="flex flex-col text-xs">
                                                        <span className="text-slate-200">{group.totalQuantity} adet</span>
                                                        <span className="text-slate-500 font-medium">{formatCurrency(group.avgCost)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-1 relative z-10 font-medium text-slate-300">
                                                    {currentPrice > 0 ? formatCurrency(currentPrice) : "-"}
                                                </td>
                                                <td className="py-4 px-1 relative z-10 font-black text-white">{formatCurrency(marketValue)}</td>
                                                <td className="py-4 px-1 relative z-10">
                                                    <div className={cn("inline-flex items-center px-2 py-1 rounded-lg font-bold text-xs", isProfit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                                                        {isProfit ? "+" : ""}{formatCurrency(profit)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-1 text-right relative z-10">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAnalyze(group.symbol, group.type); }} 
                                                            className="p-1.5 hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 rounded-lg transition-colors"
                                                            title="AI Analizi"
                                                        >
                                                            <Brain className="w-4 h-4" />
                                                        </button>
                                                        <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-transform", isExpanded && "rotate-90")} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="bg-black/20 p-4">
                                                        <div className="space-y-2">
                                                            {group.transactions.map(tx => (
                                                                <div key={tx.id} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0 items-center">
                                                                    <span className="text-slate-500">{formatDate(tx.dateAdded)}</span>
                                                                    <span className="text-slate-300">{tx.quantity} adet @ {formatCurrency(tx.avgCost)}</span>
                                                                    <button onClick={() => confirmDelete(tx.id, group.symbol, true)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Takvim Widget */}
                    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                            <Calendar className="w-4 h-4 text-blue-400" /><h3 className="text-sm font-bold text-white">Takvim</h3>
                        </div>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(earningsDates).map(([sym, time]) => {
                                const days = Math.ceil((time - Date.now()) / (86400000));
                                if (days < -30) return null;
                                const isReported = days <= 0;
                                // KAP özet sayfası genellikle en doğru bilanço bilgilerine erişim sağlar
                                const kapUrl = isReported ? `/api/kap-link?symbol=${sym}` : null;

                                return (
                                    <div key={sym} className="flex flex-col py-2 border-b border-white/5 text-xs gap-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-200">{sym}</span>
                                                <span className="text-[9px] text-slate-500 uppercase">Bilanço Dönemi</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={days > 0 ? "text-blue-400 font-medium" : "text-emerald-400 font-bold"}>
                                                    {days > 0 ? `${days} GÜN KALDI` : "AÇIKLANDI"}
                                                </span>
                                            </div>
                                        </div>
                                        {kapUrl && (
                                            <a 
                                                href={kapUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded w-fit mt-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Bilançoya ulaşmak için tıklayınız
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fiyat Analizi Widget */}
                    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                            <Activity className="w-4 h-4 text-blue-400" /><h3 className="text-sm font-bold text-white">Fiyat Analizi</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(priceExtremes).map(([sym, ext]) => {
                                const pos = Math.min(100, Math.max(0, ((ext.current - ext.low) / (ext.high - ext.low || 1)) * 100));
                                return (
                                    <div key={sym} className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-300">{sym}</span>
                                            <span className="text-white bg-blue-500/20 px-2 py-0.5 rounded text-[10px]">
                                                {formatCurrency(ext.current)}
                                            </span>
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="h-1.5 bg-slate-800 rounded-full w-full overflow-hidden flex">
                                                {/* Premium Renk Geçişli Yatay Çubuk (Kırmızı -> Sarı -> Yeşil) */}
                                                <div 
                                                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 relative transition-all duration-1000"
                                                    style={{ width: `${pos}%` }}
                                                />
                                            </div>
                                            {/* Dot on current price */}
                                            <div 
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-700 shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10 transition-all duration-1000 ring-2 ring-black/50"
                                                style={{ left: `calc(${pos}% - 6px)` }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                            <span>52H DÜŞÜK: {formatCurrency(ext.low)}</span>
                                            <span>52H YÜKSEK: {formatCurrency(ext.high)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Nakit Akışı Widget */}
                    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                            <Wallet className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-bold text-white">Nakit Akışı</h3>
                        </div>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(dividendData)
                                .filter(([_, data]) => data.amount > 0)
                                .sort((a, b) => b[1].date - a[1].date) // En yakından en uzağa (veya tersi)
                                .map(([sym, data]) => {
                                const days = Math.ceil((data.date - Date.now()) / (86400000));
                                const isPast = days < 0;
                                const isEstimate = data.isEstimate;
                                const portfolioItem = groupedAssets.find(a => a.symbol === sym);
                                const quantity = portfolioItem?.totalQuantity || 0;
                                const totalGross = quantity * data.amount;

                                return (
                                    <div key={sym} className={cn("flex flex-col gap-2 p-3 rounded-xl border mb-2", isPast && !isEstimate ? "bg-slate-800/30 border-slate-700/50" : isEstimate ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/10")}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-100">{sym}</span>
                                                <span className={cn("text-[10px] font-bold uppercase", isEstimate ? "text-amber-400" : isPast ? "text-slate-400" : "text-emerald-500")}>
                                                    {isEstimate ? "BEKLENEN TEMETTÜ" : isPast ? "ÖDENMİŞ TEMETTÜ" : "KESİNLEŞEN TEMETTÜ"}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-emerald-400 font-black block">{formatCurrency(totalGross)}</span>
                                                <span className="text-[9px] text-slate-500 font-bold">BRÜT TUTAR</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] mt-1 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(new Date(data.date).toISOString())}</span>
                                            </div>
                                            <div className="text-slate-500">
                                                {formatCurrency(data.amount)} / Pay
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2">
                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[9px] text-amber-200/80 leading-tight">
                                <b>Bilgilendirme:</b> Yukarıda hesaplanan tutarlar Brüt (Brüt) değerlerdir. BIST hisselerinde %10 yasal stopaj kesintisi uygulama sırasında aracı kurumunuz tarafından otomatik olarak düşülecektir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals & AnimatePresence Blocks ... */}
            <AnimatePresence>
                {analysisModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between mb-8 border-b border-slate-800 pb-4">
                                <h2 className="text-xl font-bold flex items-center gap-3"><Brain className="w-5 h-5 text-blue-400" />{analysisModal.title}</h2>
                                <button onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))}><X /></button>
                            </div>
                            {analysisModal.loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> : <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{analysisModal.content}</div>}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ isOpen: false, assetId: null, assetSymbol: "", isTransaction: false })} />
                        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm text-center">
                            <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold">Silmeyi Onayla</h3>
                            <p className="text-sm text-slate-400 my-4">{deleteConfirm.assetSymbol} silinecek. Emin misiniz?</p>
                            <div className="grid grid-cols-2 gap-4"><button className="py-2 bg-slate-800 rounded" onClick={() => setDeleteConfirm({ isOpen: false, assetId: null, assetSymbol: "", isTransaction: false })}>Vazgeç</button><button className="py-2 bg-rose-600 rounded" onClick={handleDelete}>Sil</button></div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-6">İşlem Ekle</h2>
                            <form onSubmit={handleAddAsset} className="space-y-4">
                                <div className="grid grid-cols-4 gap-2">
                                    {["STOCK", "FUND", "GOLD", "CRYPTO"].map(type => (
                                        <button key={type} type="button" onClick={() => setNewItemType(type as any)} className={`py-2 text-[10px] font-bold rounded ${newItemType === type ? "bg-white text-slate-950" : "bg-slate-800 text-slate-400"}`}>{type}</button>
                                    ))}
                                </div>
                                <input type="text" placeholder="Sembol..." className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-2" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setNewItemValues({...newItemValues, symbol: e.target.value.toUpperCase()}); setIsAssetSelected(false); }} onFocus={() => setShowDropdown(true)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" placeholder="Adet" className="bg-slate-950 border border-slate-800 rounded px-4 py-2" value={newItemValues.quantity} onChange={e => setNewItemValues({...newItemValues, quantity: e.target.value})} required />
                                    <input type="number" placeholder="Maliyet" className="bg-slate-950 border border-slate-800 rounded px-4 py-2" value={newItemValues.avgCost} onChange={e => setNewItemValues({...newItemValues, avgCost: e.target.value})} required />
                                </div>
                                <button type="submit" className="w-full py-3 bg-white text-slate-950 font-bold rounded">Kaydet</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
