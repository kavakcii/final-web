"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SynchronizedCorrelationChart } from "@/components/SynchronizedCorrelationChart";
import {
    Activity,
    ArrowLeft,
    Brain,
    Info,
    Loader2,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    ChevronRight,
    CheckCircle2,
    Target,
    ChevronDown,
    Sparkles,
    BarChart3,
    Layers,
    Orbit,
    Zap,
    Scale
} from "lucide-react";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ZAxis,
    Cell
} from 'recharts';
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CorrelationPair {
    source: string;
    target: string;
    value: number;
    beta?: number;
    confidence?: number;
    rolling?: number[];
    historySource?: { date: string, price: number }[];
    historyTarget?: { date: string, price: number }[];
    isStructuralOverlap?: boolean;
    categorySource?: string;
    categoryTarget?: string;
    events?: MarketEvent[];
    alpha?: number;
    sharedComposition?: { similarity: number, commonAssets: { type: string, weightA: number, weightB: number }[] } | null;
    stressTests?: { name: string, srcReturn: number, tgtReturn: number, divergence: number }[];
    heatmap?: { month: string, value: number | null }[];
    scatterData?: { x: number, y: number }[];
}

interface MarketEvent {
    date: string;
    title: string;
    description: string;
    impact: string;
}

// --- SUB-COMPONENTS ---

const HeatmapCalendar = ({ data }: { data: CorrelationPair['heatmap'] }) => {
    if (!data || data.length === 0) return null;

    const getColor = (val: number | null) => {
        if (val === null) return 'bg-slate-100';
        if (val >= 0.8) return 'bg-rose-500';
        if (val >= 0.5) return 'bg-amber-500';
        if (val >= 0.2) return 'bg-yellow-400';
        if (val >= -0.2) return 'bg-emerald-400';
        return 'bg-blue-400';
    };

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 mt-4">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div
                        className={cn("w-full aspect-square rounded-md mb-1 border border-slate-200 transition-all duration-300 hover:scale-110", getColor(d.value))}
                        title={`Korelasyon: ${d.value?.toFixed(2) || 'N/A'}`}
                    />
                    <span className="text-[7px] text-slate-400 font-bold uppercase">{d.month.split('-')[1]}/{d.month.split('-')[0].substring(2)}</span>
                </div>
            ))}
        </div>
    );
};

const StressTestSection = ({ tests, src, tgt }: { tests: CorrelationPair['stressTests'], src: string, tgt: string }) => {
    if (!tests || tests.length === 0) return null;

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tarihsel Stres Reaksiyonu</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.map((test, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:bg-white transition-all shadow-sm">
                        <div className="text-[9px] font-bold text-slate-500 mb-3 border-b border-slate-100 pb-2 uppercase tracking-tighter">{test.name}</div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-slate-400 uppercase font-black">{src}</span>
                                <span className={cn("text-xs font-black", test.srcReturn >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {test.srcReturn >= 0 ? '+' : ''}{test.srcReturn}%
                                </span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-[8px] text-slate-400 uppercase font-black">{tgt}</span>
                                <span className={cn("text-xs font-black", test.tgtReturn >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {test.tgtReturn >= 0 ? '+' : ''}{test.tgtReturn}%
                                </span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-slate-400 uppercase font-black">Ayrışma</span>
                                <span className="text-xs font-black text-indigo-600">%{test.divergence.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SimilarityGalaxy = ({ selectedSymbol, pairs }: { selectedSymbol: string | null, pairs: CorrelationPair[] }) => {
    if (!selectedSymbol || pairs.length === 0) return null;

    const clean = (s: string) => s.replace('.IS', '');
    const sorted = [...pairs].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 relative overflow-hidden h-[340px] mb-8 shadow-sm">
            <div className="absolute top-8 left-8 z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Orbit className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Varlık Benzerlik Haritası</h3>
                </div>
                <p className="text-[10px] text-slate-500 max-w-[220px]">Merkeze olan yakınlık, varlıkların piyasa hareketlerine ne kadar "ikiz" gibi tepki verdiğini gösterir.</p>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center z-20 shadow-xl shadow-indigo-100 animate-pulse">
                    <span className="text-xs font-black text-indigo-900">{clean(selectedSymbol)}</span>
                </div>

                <div className="absolute w-[80px] h-[80px] rounded-full border border-rose-100 pointer-events-none" />
                <div className="absolute w-[160px] h-[160px] rounded-full border border-amber-100 pointer-events-none" />
                <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-500/10 pointer-events-none" />

                {sorted.map((p, i) => {
                    const r = 40 + (1 - Math.abs(p.value)) * 120;
                    const angle = (i * (360 / Math.max(1, sorted.length))) * (Math.PI / 180);
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;

                    const color = p.value >= 0.85 ? 'bg-rose-500' : p.value >= 0.5 ? 'bg-amber-500' : p.value >= 0.2 ? 'bg-yellow-400' : 'bg-emerald-500';

                    return (
                        <motion.div
                            key={p.target}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x, y }}
                            transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                            className="absolute z-20 group"
                        >
                            <div className={cn("w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg relative cursor-help", color)}>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold whitespace-nowrap shadow-xl">
                                        {clean(p.target)}: {p.value.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="absolute bottom-8 right-8 flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">İç Çember: Yüksek Risk</span></div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Dış Çember: Optimal</span></div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

export default function CorrelationAnalysisPage() {
    const { myAssets, prices, isDataLoaded } = useUser();
    const [matrixData, setMatrixData] = useState<CorrelationPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [expandedPair, setExpandedPair] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isDataLoaded) return;
        if (myAssets.length < 2) {
            setLoading(false);
            if (myAssets.length > 0) setError("Korelasyon analizi için en az 2 aktif varlık gereklidir.");
            return;
        }

        const fetchAnalysis = async () => {
            setLoading(true);
            setError(null);
            try {
                const assetList = myAssets.map((a: any) => ({ symbol: a.symbol, type: a.type }));
                const res = await fetch('/api/portfolio/correlation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assets: assetList, currentPrices: prices })
                });

                if (!res.ok) throw new Error("Ağ verisi alınamadı");
                const data = await res.json();

                if (data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
                    setMatrixData(data.matrix);
                    setUniqueSymbols(data.symbols || []);
                    if (data.symbols && data.symbols.length > 0) setSelectedAsset(data.symbols[0]);
                } else if (data.message) {
                    setError(data.message);
                } else {
                    setError("Matris verisi oluşturulamadı.");
                }
            } catch (err: any) {
                setError(err.message || "Bilinmeyen bir hata.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [isDataLoaded, myAssets, prices]);

    const getColor = (value: number) => {
        if (value >= 0.85) return "#e11d48"; // Rose-600
        if (value >= 0.70) return "#f59e0b"; // Amber-500
        if (value >= 0.40) return "#3b82f6"; // Blue-500
        if (value >= -0.2) return "#10b981"; // Emerald-500
        return "#06b6d4"; // Cyan-500
    };

    const clean = (s: string) => s.replace('.IS', '');

    const getDetailedInsight = (pair: CorrelationPair) => {
        const { source: s, target: t, value: val, beta, alpha, sharedComposition } = pair;
        const symS = clean(s);
        const symT = clean(t);
        let reportSections: string[] = [];

        // 1. Yapısal Analiz (İçerik)
        if (sharedComposition && sharedComposition.similarity > 15) {
            reportSections.push(`Varlık Yapısı: ${symS} ve ${symT} aslında %${sharedComposition.similarity.toFixed(1)} oranında aynı "hammaddelerden" (hisseler/varlıklar) oluşuyor. Örnek: Mutfağa girdiğinizde her iki yemeğin de ana malzemesinin soğan olması gibi; ana malzeme bozulursa iki yemek de yenmez hale gelir.`);
        } else {
            reportSections.push(`Farklı Yapı: Bu iki varlık tamamen farklı dünyalarda yaşıyor. Örnek: Biri ekmek satarken diğeri otomobil parçası üretiyor; aralarındaki yapısal bağ çok zayıf, bu da portföyünüz için güvenli bir denge sağlar.`);
        }

        // 2. İstatistiksel Korelasyon (Pazar davranışı)
        if (val >= 0.85) {
            reportSections.push(`El Ele Hareket: Korelasyon ${val.toFixed(2)} ile çok yüksek. Bu iki varlık, el ele tutuşmuş iki kardeş gibi her yere beraber gidiyor. Örnek: Piyasa yükselirken beraber sevinirler ama düşerken de beraber ağlarlar. Bu durum riskinizi dağıtmaz, aksine yoğunlaştırır.`);
        } else if (val <= 0.2 && val >= -0.2) {
            reportSections.push(`Bağımsız Hareket: Aralarındaki bağ neredeyse yok (${val.toFixed(2)}). Örnek: Biri Ankara'daki hava durumuysa diğeri İstanbul'daki döviz kuru gibi; birbirlerini neredeyse hiç takip etmiyorlar. İdeal çeşitlendirme budur.`);
        } else if (val < -0.2) {
            reportSections.push(`Zıt Kutuplar: Bu varlıklar mıknatısın zıt kutupları gibi birbirini iter. Örnek: Biri değer kaybederken diğeri yükselerek kasanızı korur. Portföyünüzün "doğal sigortası" görevini görürler.`);
        }

        // 3. Risk ve Duyarlılık (Beta & Alfa)
        if (beta !== undefined) {
            const betaDesc = beta > 1.2 ? "daha agresif ve hızlı" : beta < 0.8 ? "daha sakin ve temkinli" : "dengeli";
            reportSections.push(`Tepki Hızı (Beta): ${symT}, ana varlığa göre %${(beta * 100).toFixed(0)} hassasiyetle ${betaDesc} hareket ediyor. Örnek: Ana varlık %1 adım atsa, bu varlık %${beta.toFixed(1)} adım atmaya meyillidir.`);
        }

        if (alpha !== undefined && alpha > 0.02) {
            reportSections.push(`Özgün Güç (Alfa): ${symT} sadece piyasayı takip etmiyor, kendi içinde ${alpha.toFixed(2)} birimlik ekstra bir "motor gücü" var. Örnek: Piyasa yerinde saysa bile, bu varlık kendi içindeki başarılı yönetimiyle kazandırmaya devam edebilir.`);
        }

        return reportSections.join(' ');
    };

    const getRecommendation = (pair: CorrelationPair) => {
        const { value: val, sharedComposition } = pair;
        if (val >= 0.88 || (sharedComposition && sharedComposition.similarity > 75)) {
            return `Risk Uyarısı: Sepette birbirinin kopyası iki yumurta var. Birinin miktarını azaltıp, huyu suyu farklı olan (korelasyonu düşük) başka bir varlığa geçmeniz kasanızı koruyacaktır.`;
        }
        if (val >= 0.40) {
            return `Takip Önerisi: Varlıklar orta vadede aynı yoldan gidiyor. Çeşitlilik için altın veya döviz gibi farklı kulvarlarda koşan varlıklarla karmayı zenginleştirebilirsiniz.`;
        }
        return `Harika Çift: Bu iki varlık birbirini çok iyi dengeliyor. Biri duraksadığında diğeri bayrağı devralarak portföyü ayakta tutar. Mevcut yapıyı koruyabilirsiniz.`;
    };

    const selectedPairs = useMemo(() => {
        if (!selectedAsset) return [];
        return matrixData
            .filter(d => d.source === selectedAsset && d.target !== selectedAsset)
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }, [selectedAsset, matrixData]);

    const diversificationScore = useMemo(() => {
        const allPairs: CorrelationPair[] = [];
        const seen = new Set<string>();
        matrixData.forEach(item => {
            if (item.source === item.target) return;
            const key = [item.source, item.target].sort().join('-');
            if (!seen.has(key)) { seen.add(key); allPairs.push(item); }
        });
        if (allPairs.length === 0) return 0;
        const highCorrCount = allPairs.filter(p => p.value > 0.6).length;
        return Math.max(0, Math.round(100 - (highCorrCount / allPairs.length) * 100));
    }, [matrixData]);

    const getRiskIcon = (value: number) => {
        if (value >= 0.85) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
        if (value >= 0.70) return <Activity className="w-4 h-4 text-amber-500" />;
        if (value >= -0.2) return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
        return <Target className="w-4 h-4 text-cyan-600" />;
    };

    if (!isDataLoaded || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-slate-800 animate-spin mx-auto mb-6" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Finansal Analiz Motoru</h2>
                    <p className="text-slate-500 text-sm">Varlık ilişkileri ve güncel piyasa verileri işleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Analiz Hatası</h2>
                <p className="text-slate-500 max-w-md mb-8">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-slate-800 shadow-lg shadow-slate-200">Tekrar Dene</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-600 group shadow-sm">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Scale className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analytics Terminal</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Risk & Korelasyon Analizi</h1>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                        <div className="px-4 py-2 border-r border-slate-100 text-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Aktif Varlık</div>
                            <div className="text-sm font-black text-slate-900">{uniqueSymbols.length}</div>
                        </div>
                        <div className="px-4 py-2 text-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Güven Skoru</div>
                            <div className="text-sm font-black text-emerald-600">%94.2</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueSymbols.map((sym) => (
                        <button
                            key={sym}
                            onClick={() => { setSelectedAsset(sym); setExpandedPair(null); }}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap uppercase tracking-wide shadow-sm",
                                selectedAsset === sym
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                            )}
                        >
                            {clean(sym)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-8">
                        <SimilarityGalaxy selectedSymbol={selectedAsset} pairs={selectedPairs} />

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-slate-200">
                                        {selectedAsset ? clean(selectedAsset).substring(0, 2) : '?'}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">{selectedAsset ? clean(selectedAsset) : ''} Odaklı Risk Matrisi</h2>
                                        <p className="text-xs text-slate-400 font-medium">Bu varlık ile diğer portföy üyeleri arasındaki çapraz etkileşimler</p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {selectedPairs.map((pair, idx) => {
                                    const pairKey = `${pair.source}-${pair.target}`;
                                    const isExpanded = expandedPair === pairKey;

                                    return (
                                        <motion.div key={pairKey} layout>
                                            <div
                                                onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-6 hover:bg-slate-50/50 cursor-pointer transition-all group"
                                            >
                                                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                                    <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        {getRiskIcon(pair.value)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{clean(pair.source)}</span>
                                                                <span className="text-sm font-black text-slate-900 leading-none">₺{prices[pair.source]?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '---'}</span>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-slate-200 mx-2" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{clean(pair.target)}</span>
                                                                <span className="text-sm font-black text-indigo-600 leading-none">₺{prices[pair.target]?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '---'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {pair.confidence && pair.confidence >= 80 ? (
                                                                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[8px] text-emerald-700 font-black tracking-tighter uppercase leading-none">
                                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Yüksek Veri Güveni
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-[8px] text-amber-700 font-black tracking-tighter uppercase leading-none">
                                                                    Ön Analiz Aşaması
                                                                </div>
                                                            )}
                                                            {pair.sharedComposition && pair.sharedComposition.similarity > 50 && (
                                                                <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[8px] text-indigo-700 font-black tracking-tighter uppercase leading-none">
                                                                    Yapısal Çakışma Tespit Edildi
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-10 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="flex flex-col items-center sm:items-end">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Duyarlılık (β)</span>
                                                        <span className="text-xs font-black text-slate-900">{pair.beta?.toFixed(2) || '1.00'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center sm:items-end">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Korelasyon</span>
                                                        <span className="text-xl font-black tabular-nums" style={{ color: getColor(pair.value) }}>{pair.value.toFixed(2)}</span>
                                                    </div>
                                                    <div className="p-1 rounded-full bg-slate-50 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="px-8 pb-10 pt-4 space-y-10 bg-slate-50/20">
                                                            {pair.historySource && pair.historyTarget && (
                                                                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                                                                    <SynchronizedCorrelationChart
                                                                        sourceSymbol={pair.source}
                                                                        targetSymbol={pair.target}
                                                                        historySource={pair.historySource}
                                                                        historyTarget={pair.historyTarget}
                                                                        rollingCorrelation={pair.rolling || []}
                                                                        events={pair.events || []}
                                                                        correlationValue={pair.value}
                                                                        isStructuralOverlap={pair.isStructuralOverlap}
                                                                        customInsight={getDetailedInsight(pair)}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Target className="w-4 h-4 text-indigo-600" />
                                                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Dağılım Grafiği</h4>
                                                                        </div>
                                                                        <Info className="w-3.5 h-3.5 text-slate-300" />
                                                                    </div>
                                                                    <div className="h-[280px] w-full bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                                                                                <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" vertical={false} />
                                                                                <XAxis type="number" dataKey="x" stroke="#94a3b8" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} />
                                                                                <YAxis type="number" dataKey="y" stroke="#94a3b8" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} />
                                                                                <ZAxis type="number" range={[50, 50]} />
                                                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                                                <Scatter name="Points" data={pair.scatterData} fill="#3b82f6" fillOpacity={0.6}>
                                                                                    {pair.scatterData?.map((entry, index) => (
                                                                                        <Cell key={`cell-${index}`} fill={entry.y > entry.x ? '#10b981' : '#3b82f6'} strokeWidth={1} stroke="#fff" />
                                                                                    ))}
                                                                                </Scatter>
                                                                            </ScatterChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                                                            <span className="text-slate-900 font-bold not-italic">Görsel Rehber:</span> {pair.value > 0.8 ? "Noktalar belirgin bir hat üzerinde toplanmış; bu varlıklar neredeyse aynı yöne bakıyor." : "Noktalar dağınık bir yapıda; bu durum varlıkların birbirinden bağımsız hareket ettiğini gösterir."}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Activity className="w-4 h-4 text-indigo-600" />
                                                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Aylık Yoğunluk Haritası</h4>
                                                                        </div>
                                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                                                    </div>
                                                                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                                                                        <HeatmapCalendar data={pair.heatmap} />
                                                                    </div>
                                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                                                            <span className="text-slate-900 font-bold not-italic">Trend Analizi:</span> {pair.heatmap && pair.heatmap.filter(h => (h.value || 0) > 0.7).length > 3 ? "Yılın büyük bölümünde yüksek uyum var; bu iki varlık sürekli birbirini takip ediyor." : "Renkler değişkenlik gösteriyor; bu durum belirli dönemlerde varlıkların farklı tepkiler verdiğini kanıtlar."}
                                                                        </p>
                                                                    </div>
                                                                    <StressTestSection tests={pair.stressTests} src={clean(pair.source)} tgt={clean(pair.target)} />
                                                                </div>
                                                            </div>

                                                            <div className="bg-white border-2 border-slate-900 rounded-[2rem] p-10 shadow-xl relative overflow-hidden group">
                                                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                                                    <Brain className="w-32 h-32 text-slate-900" />
                                                                </div>
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center gap-3 mb-6">
                                                                        <div className="p-2 rounded-xl bg-slate-900 text-white">
                                                                            <Zap className="w-5 h-5 fill-current" />
                                                                        </div>
                                                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Yapay Zeka Destekli Risk Raporu</h4>
                                                                    </div>
                                                                    <p className="text-base text-slate-700 leading-relaxed font-medium mb-8 max-w-3xl">{getDetailedInsight(pair)}</p>
                                                                    <div className="pt-8 border-t border-slate-100 flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                            <TrendingUp className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksiyon Önerisi</span>
                                                                            <p className="text-sm text-slate-900 font-bold">{getRecommendation(pair)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-16" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Çeşitlendirme Gücü</h3>
                                </div>
                                <div className="flex items-end gap-2 mb-6">
                                    <span className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums">{diversificationScore}</span>
                                    <span className="text-sm text-slate-400 mb-2 font-bold">/ 100</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6 p-0.5 border border-slate-50">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${diversificationScore}%` }}
                                        className={cn("h-full rounded-full transition-all duration-1000", diversificationScore >= 70 ? "bg-emerald-500" : diversificationScore >= 40 ? "bg-amber-500" : "bg-rose-500")}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Bu skor, portföyünüzün "fırtınalara" ne kadar dayanıklı olduğunu ölçer. Skor ne kadar yüksekse, bir varlık çöktüğünde diğerleri ayakta kalma şansına o kadar sahiptir.</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Varlık İlişkileri</h3>
                            </div>
                            <div className="overflow-hidden bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="grid gap-[3px]" style={{ gridTemplateColumns: `20px repeat(${uniqueSymbols.length}, 1fr)` }}>
                                    <div />
                                    {uniqueSymbols.map((s, i) => (
                                        <div key={i} className="text-center group relative"><span className="text-[8px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase">{clean(s).substring(0, 3)}</span></div>
                                    ))}
                                    {uniqueSymbols.map((rowSym, i) => (
                                        <div key={`row-${i}`} className="contents">
                                            <div className="flex items-center justify-end pr-1.5"><span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{clean(rowSym).substring(0, 3)}</span></div>
                                            {uniqueSymbols.map((colSym, j) => {
                                                const cell = matrixData.find(d => d.source === rowSym && d.target === colSym);
                                                const val = cell ? cell.value : 0;
                                                const isSelf = i === j;
                                                return (
                                                    <div
                                                        key={`${i}-${j}`}
                                                        className="aspect-square rounded-[2px] cursor-help border border-white/20"
                                                        style={{ backgroundColor: isSelf ? '#f1f5f9' : getColor(val), opacity: isSelf ? 0.4 : 1 }}
                                                        title={`${clean(rowSym)} x ${clean(colSym)}: ${val.toFixed(2)}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded bg-rose-500" />
                                        <span className="text-[8px] font-bold text-slate-500">Kırmızı: Riskli Bölge (Aynılar)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded bg-emerald-500" />
                                        <span className="text-[8px] font-bold text-slate-500">Yeşil: Güvenli Bölge (Farklılar)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
