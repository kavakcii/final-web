"use client";

import { useState, useEffect, Suspense } from "react";
import { Newspaper, Calendar, ExternalLink, Loader2, Target, TrendingUp, AlertCircle, Brain, X, Info, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/providers/UserProvider";
import { useSearchParams, useRouter } from "next/navigation";

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
    category?: string;
    aiSummary?: string;
}

interface FullArticle {
    title: string;
    body: string;
    sourceUrl: string;
}

function NewsContent() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Article states
    const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
    const [articleData, setArticleData] = useState<FullArticle | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam) {
            handleOpenArticle(urlParam);
        }
    }, [searchParams]);

    const handleOpenArticle = async (url: string) => {
        setAnalyzingUrl(url);
        setAnalysisLoading(true);
        setAnalysisError(null);
        setArticleData(null);
        
        try {
            const res = await fetch(`/api/news/analyze?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            
            if (data.success) {
                setArticleData(data.content);
            } else {
                setAnalysisError(data.error || "İçerik yüklenemedi.");
            }
        } catch (err) {
            setAnalysisError("Bağlantı hatası oluştu.");
        } finally {
            setAnalysisLoading(false);
        }
    };

    const closeArticle = () => {
        setAnalyzingUrl(null);
        setArticleData(null);
        setAnalysisError(null);
        const params = new URLSearchParams(searchParams);
        params.delete('url');
        router.replace(`/dashboard/news`);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
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
            
            {/* Full Article Modal Overlay */}
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
                            className="bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#00008B]">FinAi Özel Yayın</h2>
                                        <p className="text-[10px] font-bold text-[#00008B]/40 uppercase tracking-widest text-emerald-600">Tam Metin Görünümü</p>
                                    </div>
                                </div>
                                <button onClick={closeArticle} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-[#00008B]">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-slate-200">
                                {analysisLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="relative">
                                            <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                                            <Brain className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                                        </div>
                                        <p className="text-[#00008B] font-bold animate-pulse">Haber içeriği hazırlanıyor...</p>
                                    </div>
                                ) : analysisError ? (
                                    <div className="flex flex-col items-center justify-center text-center py-20">
                                        <AlertCircle className="w-16 h-16 text-red-100 mb-4" />
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Haber Yüklenemedi</h3>
                                        <p className="text-slate-400 mb-8 max-w-md">{analysisError}</p>
                                        <a href={analyzingUrl} target="_blank" className="px-8 py-4 bg-[#00008B] text-white rounded-2xl font-black shadow-lg">Haberi Kaynağında Oku</a>
                                    </div>
                                ) : articleData ? (
                                    <article className="max-w-3xl mx-auto space-y-8">
                                        <h1 className="text-3xl md:text-4xl font-black text-[#00008B] leading-tight tracking-tighter">
                                            {articleData.title}
                                        </h1>
                                        
                                        <div className="flex items-center gap-4 py-6 border-y border-slate-50">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#00008B] font-black text-xl">
                                                F
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#00008B]">FinAi Ekonomi Masası</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Özel İçerik</p>
                                            </div>
                                        </div>

                                        <div className="prose prose-slate max-w-none">
                                            {articleData.body.split('\n\n').map((para, i) => (
                                                <p key={i} className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium mb-6">
                                                    {para}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 pb-10">
                                            <div className="text-center md:text-left">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Kaynak</p>
                                                <a href={articleData.sourceUrl} target="_blank" className="text-sm font-bold text-[#00008B] hover:underline flex items-center gap-1">
                                                    Haberin Orijinal Kaynağı <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <button onClick={closeArticle} className="px-8 py-4 bg-slate-50 text-[#00008B] rounded-2xl font-black text-sm hover:bg-slate-100 transition-colors">
                                                Kapat
                                            </button>
                                        </div>
                                    </article>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-[#00008B] text-white text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">Yayında</span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">Kişiselleştirilmiş Akış</span>
                    </div>
                    <h1 className="text-4xl font-black text-[#00008B] tracking-tighter">
                        Günün 10 Kritik Gelişmesi
                    </h1>
                    <p className="text-[#00008B]/50 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">
                        Portföyünüz ve stratejik piyasalar için FinAi Ekonomi Masası'ndan özel içerikler.
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
                    </div>
                </div>
            ) : (
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
                                                onClick={() => handleOpenArticle(item.link)}
                                                className="px-6 py-3 bg-white text-[#00008B] text-xs font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Devamını Oku
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
                                            onClick={() => handleOpenArticle(item.link)}
                                            className="text-[10px] font-black text-[#00008B] hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="w-3 h-3" /> DEVAMINI OKU
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
