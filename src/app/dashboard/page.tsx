"use client";

import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp, Activity, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

import TradingViewWidget from "@/components/TradingViewWidget";
import { TefasChart } from "@/components/TefasChart";
import { PortfolioService, Asset } from "@/lib/portfolio-service";

export default function Dashboard() {
    const { email: userEmail, userName, isAuthenticated } = useUser();
    const [myAssets, setMyAssets] = useState<Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string>("FOREKS:XU100");
    const [isTefas, setIsTefas] = useState(false);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const assets = await PortfolioService.getAssets();
                setMyAssets(assets);
                // If user has assets, maybe select the first one?
                // For now, let's keep XU100 as default but allow selection.
            } catch (e) {
                console.error("Failed to load assets for dashboard", e);
            }
        };
        if (isAuthenticated) loadAssets();
    }, [isAuthenticated]);

    const handleAssetSelect = (symbol: string, type: string) => {
        if (type === 'FUND') {
            setSelectedAsset(symbol);
            setIsTefas(true);
        } else {
            // For stocks, TradingView needs BIST: prefix usually
            const cleanSymbol = symbol.replace('.IS', '').replace('.is', '');
            setSelectedAsset(`BIST:${cleanSymbol}`);
            setIsTefas(false);
        }
    };

    // DASHBOARD CONTENT
    const stats = [
        {
            title: "Toplam Portföy",
            value: "₺124,500.00",
            change: "+%12.5",
            isPositive: true,
            icon: Wallet,
            gradient: "from-blue-500/20 to-purple-500/20",
            border: "border-blue-500/20"
        },
        {
            title: "Günlük Kar/Zarar",
            value: "₺1,250.00",
            change: "+%2.1",
            isPositive: true,
            icon: Activity,
            gradient: "from-green-500/20 to-emerald-500/20",
            border: "border-green-500/20"
        },
        {
            title: "Açık Pozisyonlar",
            value: myAssets.length.toString(),
            change: "Aktif",
            isPositive: true,
            icon: BarChart2,
            gradient: "from-orange-500/20 to-red-500/20",
            border: "border-orange-500/20"
        }
    ];

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hoşgeldin, {userName || userEmail?.split('@')[0]} 👋</h1>
                    <p className="text-slate-400">Piyasa verileri ve portföyün güncel.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Yeni İşlem
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                        Rapor Al
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-slate-900/50 backdrop-blur-sm border ${stat.border} rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-900/80 transition-all duration-300`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-slate-300 group-hover:text-white transition-colors">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${stat.isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.change}
                                </div>
                            </div>

                            <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.title}</h3>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Interactive Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Piyasa Analizi</h2>
                            <p className="text-xs text-slate-500 mt-1">Görüntülenen: <span className="text-blue-400 font-bold">{selectedAsset}</span></p>
                        </div>
                        <div className="flex gap-2">
                            {['1G', '1H', '1A', '1Y'].map((period) => (
                                <button key={period} className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-white/5">
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        {isTefas ? (
                            <TefasChart fundCode={selectedAsset} height={400} />
                        ) : (
                            <TradingViewWidget symbol={selectedAsset} height={400} />
                        )}
                    </div>
                </div>

                {/* Asset Quick Select (from Portfolio) */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-6">Varlıklarım</h2>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {myAssets.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-sm text-slate-500">Henüz varlık eklemediniz.</p>
                                <button
                                    onClick={() => setSelectedAsset("FOREKS:XU100")}
                                    className="text-xs text-blue-400 mt-2 hover:underline"
                                >
                                    Endeksi Göster
                                </button>
                            </div>
                        ) : (
                            myAssets.map((asset, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleAssetSelect(asset.symbol, asset.type)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border",
                                        selectedAsset.includes(asset.symbol.replace('.IS', ''))
                                            ? "bg-blue-600/20 border-blue-500/50"
                                            : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-white/5">
                                            {asset.symbol.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{asset.symbol}</p>
                                            <p className="text-[10px] text-slate-500">{asset.type === 'STOCK' ? 'Hisse' : 'Fon'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <ArrowUpRight className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Default selection if no assets or to go back to index */}
                        <div
                            onClick={() => { setSelectedAsset("FOREKS:XU100"); setIsTefas(false); }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border mt-4 opacity-60 hover:opacity-100",
                                selectedAsset === "FOREKS:XU100" ? "bg-slate-800 border-white/20" : "bg-transparent border-dashed border-white/10"
                            )}
                        >
                            <span className="text-xs font-medium text-slate-400">BIST 100 Endeksi</span>
                            <Activity className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


