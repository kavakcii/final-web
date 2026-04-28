"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Search, 
  ChevronRight, 
  Layers, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ASSET_SECTORS } from "@/lib/constants/assets-mapping";

export default function AssetsPage() {
    const [selectedSector, setSelectedSector] = useState(Object.keys(ASSET_SECTORS)[0]);
    const [assetType, setAssetType] = useState<"hisse" | "fon">("hisse");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const sectors = Object.keys(ASSET_SECTORS);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/assets/market-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sector: selectedSector, type: assetType })
                });
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedSector, assetType]);

    const filteredData = data.filter(item => 
        (item.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC] space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full w-fit">
                        <Zap className="w-3 h-3 text-[#00008B]" />
                        <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">Pazar Terminali</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Varlıklar</h1>
                    <p className="text-slate-500 font-medium max-w-xl">
                        Sektörel bazda filtrelenmiş canlı borsa verileri ve yatırım fonları. Stratejinize en uygun enstrümanı burada bulun.
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                    <input 
                        type="text"
                        placeholder="Varlık ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#00008B]/5 focus:border-[#00008B] transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Sector Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none no-scrollbar">
                {sectors.map((sector) => (
                    <button
                        key={sector}
                        onClick={() => setSelectedSector(sector)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all border shrink-0 uppercase tracking-wider",
                            selectedSector === sector
                                ? "bg-[#00008B] border-[#00008B] text-white shadow-lg shadow-[#00008B]/20 scale-105"
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        {sector}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm min-h-[500px] flex flex-col">
                {/* Controls */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-[#00008B]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">{selectedSector} Grubu</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.length} Aktif Varlık</p>
                        </div>
                    </div>

                    {/* Asset Type Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setAssetType("hisse")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                assetType === "hisse" 
                                    ? "bg-white text-[#00008B] shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Hisse Senetleri
                        </button>
                        <button
                            onClick={() => setAssetType("fon")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                assetType === "fon" 
                                    ? "bg-white text-[#00008B] shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Yatırım Fonları
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 className="w-12 h-12 text-[#00008B] animate-spin mb-4" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Veriler Çekiliyor...</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {filteredData.map((item, idx) => (
                                <motion.div
                                    key={item.symbol}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-white border border-slate-100 rounded-3xl p-5 hover:border-[#00008B]/20 hover:shadow-2xl hover:shadow-[#00008B]/10 transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Abstract background shape */}
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-[#00008B]/5 transition-colors" />
                                    
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                                                    {item.symbol}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 group-hover:text-[#00008B] transition-colors line-clamp-1">{item.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {assetType === 'hisse' ? 'BIST Hisse' : item.category || 'Fon'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#00008B] transition-colors" />
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 flex items-end justify-between">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Anlık Fiyat</span>
                                                <div className="text-xl font-black text-slate-900 tracking-tight">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(item.price || 0)}
                                                </div>
                                            </div>
                                            {item.changePercent !== undefined && (
                                                <div className={cn(
                                                    "flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs shadow-sm",
                                                    item.changePercent >= 0 
                                                        ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/5" 
                                                        : "bg-red-50 text-red-600 shadow-red-500/5"
                                                )}>
                                                    {item.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    %{Math.abs(item.changePercent).toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Minimal Chart Placeholder / Footer */}
                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "70%" }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    item.changePercent >= 0 ? "bg-emerald-400" : "bg-red-400"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && filteredData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                        <LayoutGrid className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">Bu kategoride varlık bulunamadı.</p>
                    </div>
                )}
            </div>
            
            {/* Footer / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Veri Kaynağı</div>
                        <div className="text-sm font-black text-slate-900">BIST / TEFAS Canlı</div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Durum</div>
                        <div className="text-sm font-black text-slate-900">Doğrulanmış Veri</div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Güncelleme</div>
                        <div className="text-sm font-black text-slate-900">Her 60 Saniyede Bir</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
