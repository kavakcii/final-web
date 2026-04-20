"use client";

import { useState, useEffect, Suspense } from "react";
import { Newspaper, Calendar, ExternalLink, Loader2, Target, TrendingUp, AlertCircle, Brain, X, Info, BarChart3, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/providers/UserProvider";
import { useSearchParams, useRouter } from "next/navigation";

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
    isRelevant?: boolean; // Portföyle ilgili mi?
    relatedAsset?: string;
}

interface AnalysisResult {
    summary: string;
    keyPoints: string[];
    marketImpact: string;
    score: number;
    sentiment: string;
}

function NewsContent() {
    const { user, globalNews } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // AI Analysis states
    const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam) {
            handleAnalyze(urlParam);
        }
    }, [searchParams]);

    const handleAnalyze = async (url: string) => {
        setAnalyzingUrl(url);
        setAnalysisLoading(true);
        setAnalysisError(null);
        setAnalysisData(null);
        
        try {
            const res = await fetch(`/api/news/analyze?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            
            if (data.success) {
                setAnalysisData(data.analysis);
            } else {
                setAnalysisError(data.error || "Haber analiz edilemedi.");
            }
        } catch (err) {
            setAnalysisError("Bağlantı hatası oluştu.");
        } finally {
            setAnalysisLoading(false);
        }
    };

    const closeAnalysis = () => {
        setAnalyzingUrl(null);
        setAnalysisData(null);
        setAnalysisError(null);
        // Clear URL param without refreshing
        const params = new URLSearchParams(searchParams);
        params.delete('url');
        router.replace(`/dashboard/news`);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch personalized news (Daily 10)
                const res = await fetch(`/api/news?userId=${user.id}`);
                const data = await res.json();

                if (data.success && Array.isArray(data.news)) {
                    setNews(data.news);
                } else {
                    setError("Haberler alınamadı.");
                }

            } catch (err: any) {
                console.error("News page error:", err);
                setError(err.message || "Bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const strategicNews = news.filter(n => n.category === 'Altın' || n.category === 'Enerji');
    const portfolioNews = news.filter(n => n.category !== 'Altın' && n.category !== 'Enerji');

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-full pb-20 max-w-7xl mx-auto relative">
            
            {/* AI Analysis Modal Overlay */}
            <AnimatePresence>
                {analyzingUrl && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#00008B]/5 border border-[#00008B]/20 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white shadow-2xl shadow-[#00008B]/20"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-lg shadow-[#00008B]/20">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#00008B]">FinAi Zeki Okuyucu</h2>
                                        <p className="text-[10px] font-bold text-[#00008B]/40 uppercase tracking-widest">Yapay Zeka Derin Analiz Raporu</p>
                                    </div>
                                </div>
                                <button onClick={closeAnalysis} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-[#00008B]">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                                {analysisLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="relative">
                                            <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                                            <Brain className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                                        </div>
                                        <p className="text-[#00008B] font-bold animate-pulse">Haber yapay zeka tarafından okunuyor ve analiz ediliyor...</p>
                                    </div>
                                ) : analysisError ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-700">
                                            <Info className="w-5 h-5" />
                                            <p className="text-xs font-bold uppercase tracking-tight">FinAi Standart Okuyucu Devrede (AI Kotası Dolu)</p>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-[#00008B] font-black uppercase text-xs tracking-widest">Haber Özeti</h3>
                                            <p className="text-slate-700 leading-relaxed font-medium">Haber içeriği yapay zeka limitleri nedeniyle standart formatta sunuluyor. Orijinal kaynaktan tüm detayları okuyabilirsiniz.</p>
                                        </div>
                                        <a href={analyzingUrl} target="_blank" className="inline-block px-6 py-3 bg-[#00008B] text-white rounded-2xl font-black text-sm">Haberi Orijinal Sitede Oku</a>
                                    </div>
                                ) : analysisData ? (
                                    <div className="space-y-8">
                                        {/* Score & Sentiment */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                                                        <Star className="w-5 h-5 fill-yellow-600" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">Önem Derecesi</span>
                                                </div>
                                                <span className="text-2xl font-black text-[#00008B]">{analysisData.score}/10</span>
                                            </div>
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${analysisData.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        <TrendingUp className={`w-5 h-5 ${analysisData.sentiment === 'negative' ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">Piyasa Duyarlılığı</span>
                                                </div>
                                                <span className={`text-sm font-black uppercase tracking-widest ${analysisData.sentiment === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {analysisData.sentiment === 'positive' ? 'POZİTİF' : analysisData.sentiment === 'negative' ? 'NEGATİF' : 'NÖTR'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="space-y-3">
                                            <h3 className="flex items-center gap-2 text-[#00008B] font-black uppercase text-xs tracking-widest">
                                                <Info className="w-4 h-4" /> FinAi Özeti
                                            </h3>
                                            <p className="text-slate-700 leading-relaxed text-lg font-medium">
                                                {analysisData.summary}
                                            </p>
                                        </div>

                                        {/* Key Points */}
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-[#00008B] font-black uppercase text-xs tracking-widest">
                                                <Target className="w-4 h-4" /> Kritik Notlar
                                            </h3>
                                            <div className="grid gap-3">
                                                {analysisData.keyPoints.map((point, i) => (
                                                    <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="w-6 h-6 rounded-full bg-[#00008B] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                                                        <p className="text-sm font-bold text-slate-700">{point}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Market Impact */}
                                        <div className="p-6 bg-[#00008B] rounded-[2rem] text-white shadow-xl shadow-[#00008B]/20 relative overflow-hidden">
                                            <div className="absolute right-[-20px] top-[-20px] opacity-10">
                                                <BarChart3 className="w-48 h-48" />
                                            </div>
                                            <div className="relative z-10 space-y-3">
                                                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Piyasa ve Portföy Etkisi</h3>
                                                <p className="text-lg font-bold leading-relaxed">
                                                    {analysisData.marketImpact}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-white flex justify-center">
                                <a href={analyzingUrl} target="_blank" className="text-[10px] font-bold text-[#00008B]/40 hover:text-[#00008B] transition-colors uppercase tracking-widest flex items-center gap-1">
                                    Orijinal Kaynağı Görüntüle <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-[#00008B] text-white text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">Canlı Analiz</span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">Kişiselleştirilmiş Akış</span>
                    </div>
                    <h1 className="text-4xl font-black text-[#00008B] tracking-tighter">
                        Günün 10 Kritik Gelişmesi
                    </h1>
                    <p className="text-[#00008B]/50 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">
                        Portföyünüz ve stratejik piyasalar için Bloomberg HT destekli derin analizler.
                    </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Güncelleme</p>
                        <p className="text-sm font-black text-[#00008B]">Her Gün 08:00</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00008B]">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                        <Brain className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-[#00008B] font-bold opacity-40">Size özel finansal raporlar hazırlanıyor...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 opacity-40" />
                    <div>
                        <p className="font-bold">Haberler yüklenemedi</p>
                        <p className="text-sm opacity-70">{error}</p>
                                   <div className="space-y-16">

                    {/* 🚀 STRATEGIC FOCUS (Gold & Energy) */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-lg shadow-yellow-400/20">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#00008B]">Stratejik Piyasa Odağı</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altın ve Enerji Piyasaları</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {strategicNews.map((item, idx) => (
                                <motion.div
                                    key={`strategic-${idx}`}
                                    whileHover={{ y: -5 }}
                                    className="bg-[#00008B] text-white rounded-[2.5rem] p-8 shadow-xl shadow-[#00008B]/20 transition-all group relative overflow-hidden flex flex-col"
                                >
                                    <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                                        <Target className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                                {item.category} Raporu
                                            </span>
                                            <span className="text-[9px] font-black bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full uppercase tracking-widest">
                                                Önemli
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-black mb-4 leading-snug">
                                            {item.title}
                                        </h3>

                                        <p className="text-white/70 text-sm font-medium mb-8 line-clamp-3 leading-relaxed">
                                            {item.aiSummary || item.description.replace(/<[^>]*>/g, '')}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/10">
                                            <span className="text-[10px] font-bold opacity-40 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(item.pubDate)}
                                            </span>
                                            <button 
                                                onClick={() => handleAnalyze(item.link)}
                                                className="px-6 py-3 bg-white text-[#00008B] text-xs font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Brain className="w-4 h-4" />
                                                Derin Analiz
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* 📊 PORTFOLIO MATCHED NEWS */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 flex items-center justify-center text-[#00008B]">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#00008B]">Sizin İçin Seçilenler</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portföyünüzle Uyumlu Haberler</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {portfolioNews.map((item, idx) => (
                                <motion.div
                                    key={`portfolio-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-[#00008B]/20 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[9px] font-black text-[#00008B] bg-[#00008B]/5 px-3 py-1 rounded-full uppercase tracking-widest">
                                            {item.category === 'Portföy' ? 'Portföy Uyumu' : item.source}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                            {formatDate(item.pubDate)}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-[#00008B] mb-3 line-clamp-3 group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm text-slate-400 font-medium line-clamp-3 mb-6">
                                        {item.aiSummary || item.description.replace(/<[^>]*>/g, '')}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <button 
                                            onClick={() => handleAnalyze(item.link)}
                                            className="text-[10px] font-black text-[#00008B] hover:underline flex items-center gap-1"
                                        >
                                            <Brain className="w-3 h-3" /> ANALİZİ OKU
                                        </button>
                                        <a href={item.link} target="_blank" className="text-slate-300 hover:text-[#00008B] transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}


export default function NewsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>}>
            <NewsContent />
        </Suspense>
    );
}
