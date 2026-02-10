"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart, Info, Brain, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PortfolioService, Asset } from "@/lib/portfolio-service";

// Helper for currency formatting
const formatCurrency = (value: number, currency: string = "₺") => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value).replace('₺', '') + ' ' + currency;
};

export default function PortfolioPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItemValues, setNewItemValues] = useState<{ symbol: string, quantity: string, avgCost: string }>({ symbol: '', quantity: '', avgCost: '' });
    const [newItemType, setNewItemType] = useState<Asset["type"]>("STOCK");

    // Analysis Modal State
    const [analysisModal, setAnalysisModal] = useState<{ isOpen: boolean; loading: boolean; content: string; title: string }>({
        isOpen: false,
        loading: false,
        content: "",
        title: ""
    });

    // Fetch Data
    const fetchPortfolioData = async () => {
        setLoading(true);
        try {
            const storedAssets = await PortfolioService.getAssets();
            setAssets(storedAssets);

            if (storedAssets.length > 0) {
                const symbols = storedAssets.map(a => a.symbol).join(',');
                console.log("Fetching symbols:", symbols);
                try {
                    const res = await fetch(`/api/finance?symbols=${symbols}`);
                    const json = await res.json();

                    if (json.results) {
                        const priceMap: Record<string, number> = {};
                        json.results.forEach((r: any) => {
                            if (r.symbol && r.regularMarketPrice) {
                                priceMap[r.symbol] = r.regularMarketPrice;
                                priceMap[r.symbol.toUpperCase()] = r.regularMarketPrice;
                            }
                        });
                        setPrices(priceMap);
                    } else if (json.error) {
                        console.error("API Error:", json.error);
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

    // Handlers
    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemValues.symbol && newItemValues.quantity && newItemValues.avgCost) {
            try {
                await PortfolioService.addAsset({
                    symbol: newItemValues.symbol.toUpperCase(),
                    type: newItemType,
                    quantity: Number(newItemValues.quantity),
                    avgCost: Number(newItemValues.avgCost),
                    dateAdded: new Date().toISOString()
                });

                setIsModalOpen(false);
                setNewItemValues({ symbol: '', quantity: '', avgCost: '' });
                setNewItemType("STOCK");
                await fetchPortfolioData();
            } catch (error) {
                console.error("Failed to add asset", error);
                alert("Varlık eklenirken hata oluştu. Giriş yaptığınızdan emin olun.");
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bu varlığı silmek istediğinize emin misiniz?")) {
            try {
                await PortfolioService.removeAsset(id);
                await fetchPortfolioData();
            } catch (error) {
                console.error("Failed to delete asset", error);
            }
        }
    };

    const handleAnalyze = async (asset: Asset) => {
        setAnalysisModal({ isOpen: true, loading: true, content: "", title: `${asset.symbol} Analizi` });
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: JSON.stringify({ symbol: asset.symbol, type: asset.type }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setAnalysisModal(prev => ({ ...prev, loading: false, content: data.analysis }));
        } catch (error) {
            console.error("Analysis Error:", error);
            setAnalysisModal(prev => ({ ...prev, loading: false, content: "Analiz alınamadı. Lütfen daha sonra tekrar deneyin." }));
        }
    };

    // Calculations
    const totalValue = assets.reduce((acc, asset) => acc + (asset.quantity * (prices[asset.symbol] || asset.avgCost)), 0);
    const totalCost = assets.reduce((acc, asset) => acc + (asset.quantity * asset.avgCost), 0);
    const totalProfit = totalValue - totalCost;
    const profitRatio = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return (
        <div className="p-6 md:p-8 space-y-6 h-full overflow-y-auto pb-24">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Total Value - Large Card */}
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 rounded-3xl relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-32 h-32 text-blue-500 transform rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="text-slate-400 font-medium">Toplam Varlık</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-4">
                            {formatCurrency(totalValue)}
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm">Güncel piyasa değerlerine göre</p>
                    </div>
                </div>

                {/* Net Profit - Medium Card */}
                <div className="md:col-span-1 bg-slate-900/50 border border-white/10 p-6 rounded-3xl flex flex-col justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <span className="text-slate-400 text-sm font-medium">Net Kar/Zarar</span>
                        <div className={`mt-2 flex items-baseline gap-2 ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            <span className="text-2xl font-bold">
                                {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${totalProfit >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {totalProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>%{profitRatio.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Add Asset - Action Card */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="md:col-span-1 bg-blue-600 hover:bg-blue-500 border border-blue-400/20 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-white transition-all shadow-lg shadow-blue-500/20 group"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">Varlık Ekle</span>
                </button>
            </div>

            {/* Assets Table Section */}
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            Portföy Varlıkları
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Sahip olduğunuz tüm varlıkların detaylı listesi</p>
                    </div>
                    
                    {/* Quick Stats or Filters could go here */}
                    <div className="text-xs text-slate-500 font-mono">
                        {assets.length} VARLIK
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-5">Varlık</th>
                                <th className="p-5">Maliyet / Adet</th>
                                <th className="p-5">Anlık Değer</th>
                                <th className="p-5">Toplam Bakiye</th>
                                <th className="p-5">Kar/Zarar</th>
                                <th className="p-5 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 animate-pulse">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                                        Veriler güncelleniyor...
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                                <Wallet className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <p>Henüz bir varlık eklemediniz.</p>
                                            <button onClick={() => setIsModalOpen(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                                + İlk Varlığını Ekle
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => {
                                    const currentPrice = prices[asset.symbol] || 0;
                                    const marketValue = currentPrice * asset.quantity;
                                    const costValue = asset.avgCost * asset.quantity;
                                    const profit = marketValue - costValue;
                                    const profitPercent = costValue > 0 ? (profit / costValue) * 100 : 0;
                                    const isProfit = profit >= 0;

                                    return (
                                        <tr key={asset.id} className="text-slate-300 hover:bg-white/5 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-lg">
                                                        {asset.symbol.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{asset.symbol}</p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                                                            {asset.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-xs">Adet: <span className="text-slate-300">{asset.quantity}</span></span>
                                                    <span className="text-slate-400 text-xs">Maliyet: <span className="text-slate-300">{formatCurrency(asset.avgCost)}</span></span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                 {(() => {
                                                    const price = prices[asset.symbol] || prices[`${asset.symbol}.IS`] || prices[`${asset.symbol}.is`] || 0;
                                                    return price > 0 ? (
                                                        <span className="font-medium text-white">{formatCurrency(price)}</span>
                                                    ) : (
                                                        loading ? <span className="text-xs text-slate-500 animate-pulse">...</span> : <span className="text-xs text-red-400">Veri Yok</span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5">
                                                {(() => {
                                                    const price = prices[asset.symbol] || prices[`${asset.symbol}.IS`] || prices[`${asset.symbol}.is`] || 0;
                                                    return price > 0 ? (
                                                        <span className="font-bold text-white text-lg">{formatCurrency(price * asset.quantity)}</span>
                                                    ) : "-";
                                                })()}
                                            </td>
                                            <td className="p-5">
                                                {(() => {
                                                    const price = prices[asset.symbol] || prices[`${asset.symbol}.IS`] || prices[`${asset.symbol}.is`] || 0;
                                                    if (price <= 0) return "-";
                                                    
                                                    const marketValue = price * asset.quantity;
                                                    const costValue = asset.avgCost * asset.quantity;
                                                    const profit = marketValue - costValue;
                                                    const profitPercent = costValue > 0 ? (profit / costValue) * 100 : 0;
                                                    const isProfit = profit >= 0;
                                                    
                                                    return (
                                                        <div className={`flex flex-col items-start ${isProfit ? "text-green-400" : "text-red-400"}`}>
                                                            <span className="font-bold">{isProfit ? "+" : ""}{formatCurrency(profit)}</span>
                                                            <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded">
                                                                %{profitPercent.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleAnalyze(asset)}
                                                        className="p-2 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition-colors"
                                                        title="AI Analiz"
                                                    >
                                                        <Brain className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(asset.id)} 
                                                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analysis Modal - Same logic, slightly updated style */}
            <AnimatePresence>
                {analysisModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-xl">
                                            <Brain className="w-6 h-6 text-purple-500" />
                                        </div>
                                        {analysisModal.title}
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-2 ml-1">Yapay zeka tabanlı portföy analizi</p>
                                </div>
                                <button onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {analysisModal.loading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                                        <Loader2 className="w-12 h-12 animate-spin relative z-10 text-purple-500" />
                                    </div>
                                    <p className="mt-4 font-medium animate-pulse">Analiz hazırlanıyor...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisModal.content}
                                    </div>
                                    <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                        <Info className="w-4 h-4 text-blue-400" />
                                        Bu analiz AI tarafından oluşturulmuştur. Yatırım tavsiyesi değildir.
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Asset Modal - Same logic */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Yeni Varlık Ekle</h2>
                            <form onSubmit={handleAddAsset} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Varlık Tipi</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["STOCK", "FUND", "GOLD", "CRYPTO"].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewItemType(type as any)}
                                                className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${newItemType === type ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700"}`}
                                            >
                                                {type === "STOCK" ? "HİSSE" : type === "FUND" ? "FON" : type === "GOLD" ? "ALTIN" : "KRİPTO"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Sembol / Kod</label>
                                    <input
                                        type="text"
                                        placeholder={newItemType === "STOCK" ? "Örn: THYAO.IS" : "Örn: BTC-USD"}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:text-slate-600"
                                        value={newItemValues.symbol}
                                        onChange={e => setNewItemValues({ ...newItemValues, symbol: e.target.value.toUpperCase() })}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                                        <Info className="w-3 h-3" /> Yahoo Finance kodunu giriniz (BIST için .IS ekleyin)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Adet</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            value={newItemValues.quantity}
                                            onChange={e => setNewItemValues({ ...newItemValues, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Maliyet (₺)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            value={newItemValues.avgCost}
                                            onChange={e => setNewItemValues({ ...newItemValues, avgCost: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 mt-2 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {loading ? "Ekleniyor..." : "Portföye Ekle"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
