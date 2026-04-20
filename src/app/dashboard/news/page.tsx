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
    const { user } = useUser();
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
                // 1. Fetch User Portfolio
                const { data: portfolioData, error: portfolioError } = await supabase
                    .from('user_portfolios')
                    .select('symbol, asset_type')
                    .eq('user_id', user.id);

                if (portfolioError) throw portfolioError;

                const userAssets = new Set(portfolioData?.map(p => p.symbol.toUpperCase()) || []);

                // 2. Fetch News
                const res = await fetch('/api/news');
                const data = await res.json();

                if (data.success && Array.isArray(data.news)) {
                    // 3. Match News with Portfolio
                    const processedNews: NewsItem[] = data.news.map((item: any) => {
                        let relatedAssetString = '';
                        const isRelevant = Array.from(userAssets).some(asset => {
                            const regex = new RegExp(`\\b${asset}\\b`, 'i');
                            if (regex.test(item.title) || regex.test(item.description)) {
                                relatedAssetString = asset;
                                return true;
                            }
                            return false;
                        });

                        return {
                            ...item,
                            isRelevant,
                            relatedAsset: relatedAssetString
                        };
                    });

                    setNews(processedNews);
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

    const smartNews = news.filter(n => n.isRelevant);
    const generalNews = news.filter(n => !n.isRelevant);

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
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <AlertCircle className="w-16 h-16 text-red-500 opacity-20" />
                                        <h3 className="text-xl font-bold text-slate-800">Analiz Tamamlanamadı</h3>
                                        <p className="text-slate-500 max-w-md">{analysisError}</p>
                                        <a href={analyzingUrl} target="_blank" className="px-6 py-2 bg-[#00008B] text-white rounded-xl font-bold">Orijinal Kaynağa Git</a>
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
            <div>
                <h1 className="text-3xl font-black text-[#00008B] flex items-center gap-3 tracking-tighter">
                    <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white">
                        <Newspaper className="w-6 h-6" />
                    </div>
                    Piyasa Gündemi
                </h1>
                <p className="text-[#00008B]/50 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Borsa ve finans dünyasına dair yapay zeka destekli haber merkezi.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-10 h-10 text-[#00008B] animate-spin" />
                    <p className="text-[#00008B] font-bold opacity-40">Haberler derleniyor...</p>
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
                <div className="space-y-12">

                    {/* ✅ SMART RECOMMENDATIONS */}
                    {smartNews.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Target className="w-6 h-6 text-yellow-500" />
                                    <h2 className="text-xl font-black text-[#00008B]">Sizin İçin Önemli</h2>
                                </div>
                                <span className="text-[10px] font-black text-[#00008B] bg-[#00008B]/5 px-3 py-1 rounded-full uppercase tracking-widest">
                                    {smartNews.length} KRİTİK HABER
                                </span>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {smartNews.map((item, idx) => (
                                    <motion.div
                                        key={`smart-${idx}`}
                                        whileHover={{ y: -5 }}
                                        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-[#00008B]/10 transition-all group relative overflow-hidden flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[9px] font-black text-[#00008B]/40 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                                                {item.source}
                                            </span>
                                            {item.relatedAsset && (
                                                <div className="px-3 py-1 bg-yellow-400 text-yellow-900 text-[9px] font-black rounded-full flex items-center gap-1">
                                                    <Target className="w-3 h-3" />
                                                    {item.relatedAsset}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-black text-[#00008B] mb-4 leading-snug group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.description }} />

                                        <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(item.pubDate)}
                                            </span>
                                            <button 
                                                onClick={() => handleAnalyze(item.link)}
                                                className="px-5 py-2.5 bg-[#00008B] text-white text-xs font-black rounded-xl shadow-lg shadow-[#00008B]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Brain className="w-4 h-4" />
                                                AI İle Oku
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* 🌍 GENERAL NEWS */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-[#00008B]/40" />
                            <h2 className="text-xl font-black text-[#00008B]">Genel Finans Gündemi</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {generalNews.map((item, idx) => (
                                <motion.div
                                    key={`gen-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-[#00008B]/20 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {item.source}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                            {formatDate(item.pubDate)}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-[#00008B] mb-3 line-clamp-3 group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm text-slate-400 font-medium line-clamp-3 mb-6" dangerouslySetInnerHTML={{ __html: item.description }} />

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <button 
                                            onClick={() => handleAnalyze(item.link)}
                                            className="text-[10px] font-black text-[#00008B] hover:underline flex items-center gap-1"
                                        >
                                            <Brain className="w-3 h-3" /> AI ANALİZİ
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
