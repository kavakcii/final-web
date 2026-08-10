"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    Share2, 
    Bookmark, 
    ExternalLink, 
    Check, 
    Loader2, 
    AlertCircle, 
    FileText, 
    Sparkles, 
    TrendingUp, 
    Globe,
    Building2
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
    const [relatedNews, setRelatedNews] = useState<EnrichedNewsItem[]>([]);
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
                    otherItems = newsJson.data.filter((item: EnrichedNewsItem) => item.slug !== slug).slice(0, 3);
                    setRelatedNews(otherItems);
                }

                if (!currentItem) {
                    setError("Haber bulunamadı veya süresi dolmuş.");
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
                    // Fallback to description paragraphs
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

    return (
        <div className="min-h-screen bg-slate-50/40 text-[#00008B] pb-24">
            {/* Top Sticky Bar */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-16 z-30 px-4 sm:px-8 py-3.5">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
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

            {/* Main Article Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-8 space-y-8">
                {loading ? (
                    <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-16 text-center space-y-4 shadow-sm">
                        <div className="relative w-12 h-12 mx-auto">
                            <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                            <FileText className="w-5 h-5 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <h3 className="text-base font-black text-[#00008B]">FinAi Özel Yayını Yükleniyor</h3>
                        <p className="text-xs text-slate-400 font-bold">Haberin tam metni derleniyor...</p>
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
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 md:p-14 shadow-xl shadow-slate-200/50 space-y-8"
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
                                {newsItem.tickers && newsItem.tickers.map((t, idx) => (
                                    <span key={idx} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-200">
                                        #{t}
                                    </span>
                                ))}
                            </div>

                            {/* Headline */}
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
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Piyasa & Şirket İstihbaratı</p>
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

                        {/* Article Full Raw Body */}
                        <div className="space-y-6 text-slate-700 font-normal leading-relaxed text-base sm:text-lg">
                            {article.paragraphs.map((paragraph, idx) => (
                                <p key={idx} className="leading-relaxed font-medium text-slate-700">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* Source Attribution Box */}
                        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl">
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
                                Haberin Orijinal Kaynağı <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </motion.article>
                ) : null}

                {/* Related Other Stories */}
                {relatedNews.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600" /> Günün Diğer Kritik Gelişmeleri
                            </h3>
                            <Link href="/dashboard/news" className="text-xs font-black text-blue-600 hover:underline">
                                Tümünü Gör →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedNews.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={`/dashboard/news/${item.slug}`}
                                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-[#00008B]/40 hover:shadow-lg transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <span className="text-[9px] font-black text-[#00008B] bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                                            {item.categoryLabel}
                                        </span>
                                        <h4 className="text-xs font-bold text-[#00008B] group-hover:text-blue-700 transition-colors line-clamp-2 mt-2 leading-snug">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-4 block">
                                        {item.source}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
