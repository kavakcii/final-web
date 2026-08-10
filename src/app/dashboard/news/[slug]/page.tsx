"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    Share2, 
    ExternalLink, 
    Check, 
    Loader2, 
    AlertCircle, 
    FileText, 
    Sparkles, 
    Zap,
    TrendingUp,
    ChevronRight,
    Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { EnrichedNewsItem } from "@/app/api/news/route";

interface ArticleDetail {
    title: string;
    image?: string | null;
    paragraphs: string[];
    sourceUrl: string;
}

export default function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    const [newsItem, setNewsItem] = useState<EnrichedNewsItem | null>(null);
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [criticalNews, setCriticalNews] = useState<EnrichedNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchArticleData = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Önce haber listesinden bu slug'a ait haberi bul
                const newsRes = await fetch('/api/news');
                const newsJson = await newsRes.json();
                
                let currentItem: EnrichedNewsItem | undefined;
                let otherItems: EnrichedNewsItem[] = [];

                if (newsJson.success && Array.isArray(newsJson.data)) {
                    currentItem = newsJson.data.find((item: EnrichedNewsItem) => item.slug === slug || item.id === slug);
                    otherItems = newsJson.data.filter((item: EnrichedNewsItem) => item.slug !== slug).slice(0, 5);
                    setCriticalNews(otherItems);
                }

                if (!currentItem) {
                    setError("Haber bulunamadı veya yayından kaldırılmış.");
                    setLoading(false);
                    return;
                }

                setNewsItem(currentItem);

                // 2. Haberin tam ham metnini kaynak siteden çek
                const articleRes = await fetch(`/api/news/article?url=${encodeURIComponent(currentItem.link)}`);
                const articleJson = await articleRes.json();

                if (articleJson.success && articleJson.data) {
                    setArticle(articleJson.data);
                } else {
                    // Fallback
                    setArticle({
                        title: currentItem.title,
                        paragraphs: [currentItem.description],
                        sourceUrl: currentItem.link
                    });
                }

            } catch (err: any) {
                console.error("News detail fetch error:", err);
                setError("Haber içeriği yüklenirken bir sorun oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchArticleData();
    }, [slug]);

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Bugün';
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const assets = newsItem?.affectedAssets && newsItem.affectedAssets.length > 0
        ? newsItem.affectedAssets
        : (newsItem?.tickers || []);

    const specificAssets = assets.filter(a => 
        a.toLowerCase() !== newsItem?.categoryLabel.toLowerCase() &&
        !newsItem?.categoryLabel.toLowerCase().includes(a.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 text-[#00008B] pb-24">
            {/* Top Navigation Bar */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-16 z-30 px-4 sm:px-8 py-3.5">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <Link
                        href="/dashboard/news"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00008B] text-white font-bold text-xs shadow-md shadow-[#00008B]/20 hover:bg-[#0808a3] transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Tüm Haberlere Dön
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 text-slate-500 hover:text-[#00008B] hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Haberi Paylaş"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Paylaş'}</span>
                        </button>
                        {article?.sourceUrl && (
                            <a
                                href={article.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-500 hover:text-[#00008B] hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                                title="Orijinal Kaynak"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">Kaynak</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Page Grid (%60 Sol Ana Metin, %35 Sağ Özet + Kritik Gelişmeler) */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-8">
                {loading ? (
                    <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-16 text-center space-y-4 shadow-sm">
                        <div className="relative w-12 h-12 mx-auto">
                            <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                            <FileText className="w-5 h-5 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <h3 className="text-base font-black text-[#00008B]">FinAi Özel Yayını Yükleniyor</h3>
                        <p className="text-xs text-slate-400 font-bold">Haberin tam metni ve veriler derleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-[2.5rem] flex items-center gap-4">
                        <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <h3 className="font-black text-base">Haber Yüklenemedi</h3>
                            <p className="text-xs text-red-600 mt-1">{error}</p>
                            <Link href="/dashboard/news" className="inline-block mt-4 text-xs font-black underline">
                                Haberler Sayfasına Geri Dön
                            </Link>
                        </div>
                    </div>
                ) : newsItem && article ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* SOL TARAF: %60 - 65 GENİŞLİK (Ana Ham Haber Metni) */}
                        <motion.article
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-sm space-y-8"
                        >
                            {/* Badges & Meta */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3.5 py-1.5 bg-[#00008B] text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                        FinAi Özel Yayın
                                    </span>
                                    <span className="px-3 py-1 bg-slate-100 text-[#00008B] text-[10px] font-bold rounded-full uppercase tracking-wider">
                                        {newsItem.categoryLabel}
                                    </span>
                                    {specificAssets.map((asset, idx) => (
                                        <span key={idx} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-200">
                                            {asset}
                                        </span>
                                    ))}
                                </div>

                                {/* Main Headline */}
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#00008B] leading-tight tracking-tight">
                                    {article.title || newsItem.title}
                                </h1>

                                {/* Editorial Author & Time Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-slate-100 text-xs text-slate-500 font-bold">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#00008B] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#00008B]/20">
                                            F
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#00008B]">FinAi Ekonomi Masası</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Piyasa & Finans İstihbaratı</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(newsItem.pubDate)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {newsItem.readTime || '3 dk okuma'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ana Ham Haber Metni (100 Boyutunda Paragraflar) */}
                            <div className="space-y-6 text-slate-700 leading-relaxed text-base sm:text-lg">
                                {article.paragraphs.map((paragraph, idx) => (
                                    <p key={idx} className="leading-relaxed font-medium text-slate-700">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            {/* Kaynak Referansı */}
                            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kaynak Referansı</span>
                                    <p className="text-xs font-bold text-[#00008B] mt-0.5">
                                        Bu içerik <span className="font-black">{newsItem.source}</span> bülteninden FinAi okuyucuları için derlenmiştir.
                                    </p>
                                </div>
                                <a
                                    href={article.sourceUrl || newsItem.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-[#00008B] hover:bg-slate-100 transition-colors flex items-center gap-2 shrink-0"
                                >
                                    Orijinal Kaynak <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </motion.article>

                        {/* SAĞ TARAF: %35 - 40 GENİŞLİK (Özet Widget'ı + Kritik Gelişmeler) */}
                        <div className="lg:col-span-4 space-y-6 sticky top-24">
                            
                            {/* WIDGET 1: FinAi Yönetici Özeti (Sol metne göre %60 Kompakt Boyut) */}
                            <div className="bg-gradient-to-br from-[#00008B] via-[#000066] to-[#0a1e3d] text-white rounded-3xl p-6 shadow-xl shadow-[#00008B]/20 border border-white/10 relative overflow-hidden space-y-4">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

                                <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-yellow-400 text-yellow-950 flex items-center justify-center font-black shadow-md shadow-yellow-400/20">
                                            <Sparkles className="w-4 h-4 fill-current" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                FinAi Yönetici Özeti
                                            </h3>
                                            <p className="text-[10px] text-blue-200 font-bold">30 Saniyede Önemli Noktalar</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Özet Çıkarım Maddeleri (%60 Boyutunda Kompakt Yazı) */}
                                <div className="relative z-10 space-y-3 text-xs text-blue-100/90 leading-relaxed font-medium">
                                    <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
                                        <p className="text-xs leading-normal">
                                            {newsItem.description.slice(0, 160)}...
                                        </p>
                                    </div>

                                    {specificAssets.length > 0 && (
                                        <div className="flex items-center justify-between text-[11px] font-bold bg-white/5 p-2.5 px-3 rounded-xl">
                                            <span className="text-slate-300">İlgili Varlıklar:</span>
                                            <span className="text-yellow-300 font-black">{specificAssets.join(', ')}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-1">
                                        <span>Piyasa Algısı:</span>
                                        <span className="text-emerald-300 font-black flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> {newsItem.sentiment === 'bullish' ? 'Pozitif Beklenti' : newsItem.sentiment === 'bearish' ? 'Temkinli / Satış' : 'Dengeli Görünüm'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* WIDGET 2: Kritik Gelişmeler (Diğer Önemli Haber Başlıkları) */}
                            {criticalNews.length > 0 && (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                            <h3 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
                                                Kritik Gelişmeler
                                            </h3>
                                        </div>
                                        <Link href="/dashboard/news" className="text-[11px] font-black text-blue-600 hover:underline">
                                            Tümü →
                                        </Link>
                                    </div>

                                    <div className="divide-y divide-slate-100 space-y-1">
                                        {criticalNews.map((item, idx) => (
                                            <Link
                                                key={idx}
                                                href={`/dashboard/news/${item.slug}`}
                                                className="py-3 block group hover:bg-slate-50 rounded-xl px-2 transition-all"
                                            >
                                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                    <span className="text-[#00008B] font-black bg-blue-50 px-2 py-0.5 rounded-md">
                                                        {item.categoryLabel}
                                                    </span>
                                                    <span>{item.source}</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-[#00008B] leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h4>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                ) : null}
            </div>
        </div>
    );
}
