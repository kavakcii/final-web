"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Clock, AlertCircle } from "lucide-react";

export interface FeaturedNewsWidgetProps {
    news: any[];
}

function calculateNewsScore(item: any): number {
    let score = 0;
    if (item.impact === "critical") score += 100;
    else if (item.impact === "high") score += 60;
    else if (item.impact === "medium") score += 30;

    if (item.isHot) score += 40;

    if (item.category === "portfolio") score += 50;
    else if (item.category === "macro") score += 40;
    else if (item.category === "bist") score += 35;
    else if (item.category === "commodity") score += 20;

    try {
        const pubTime = new Date(item.pubDate).getTime();
        const now = Date.now();
        const diffHours = (now - pubTime) / (1000 * 60 * 60);
        if (diffHours < 2) score += 30;
        else if (diffHours < 6) score += 15;
    } catch {}

    const titleUpper = (item.title || "").toUpperCase();
    if (/(?:OVP|ENFLASYON|TÜFE|FED|FAİZ|TCMB|BİST|KAP|MERKEZ BANKASI|CUMHURBAŞKANI)/.test(titleUpper)) {
        score += 25;
    }

    return score;
}

function generateWhyItMatters(item: any): string | null {
    if (!item || !item.title) return null;
    const t = item.title.toUpperCase();

    if (t.includes("OVP") || t.includes("ORTA VADELİ PROGRAM")) {
        return "OVP hedefleri büyüme, enflasyon ve maliye politikası beklentileri açısından takip edilebilir.";
    }
    if (t.includes("ENFLASYON") || t.includes("TÜFE") || t.includes("ÜFE")) {
        return "Enflasyon verileri merkez bankası faiz patikası ve piyasa likiditesi açısından kritiktir.";
    }
    if (t.includes("FED") || t.includes("FAİZ") || t.includes("TCMB") || t.includes("POLİTİKA FAİZİ")) {
        return "Faiz kararları varlık fiyatlamalarını ve piyasa borçlanma maliyetlerini doğrudan etkiler.";
    }
    if (t.includes("TEMETTÜ") || t.includes("HAKEDİŞ") || t.includes("KAR PAYI")) {
        return "Temettü dağıtım haberleri nakit akışı ve yatırımcı getirisi açısından öne çıkmaktadır.";
    }
    if (t.includes("KAP") || t.includes("BİLANÇO") || t.includes("GELİR") || t.includes("CİRO")) {
        return "Şirketin finansal sonuçları hisse değerlemesi ve sektör kârlılığı açısından önemlidir.";
    }
    if (t.includes("HALK ARZ") || t.includes("HALKARZ")) {
        return "Halka arz gelişmeleri piyasaya yeni likidite katılımı ve talep yoğunluğu açısından izlenir.";
    }
    if (t.includes("BİTCOİN") || t.includes("ETHEREUM") || t.includes("KRİPTO")) {
        return "Kripto varlık hareketleri küresel risk iştahı ve likidite akışını yansıtmaktadır.";
    }
    if (t.includes("PETROL") || t.includes("BRENT") || t.includes("ALTIN") || t.includes("ONS")) {
        return "Emtia fiyatlarındaki değişimler küresel enflasyon ve jeopolitik risk beklentilerini gösterir.";
    }

    if (item.category === "macro") {
        return "Makroekonomik veriler genel piyasa yönü ve ekonomik görünüm açısından önem taşır.";
    }
    if (item.category === "bist") {
        return "Şirket haberleri piyasa değerlemeleri ve hisse hareketlerini etkileyebilir.";
    }
    if (item.category === "portfolio") {
        return "Portföyünüzdeki varlıklarla doğrudan ilişkili piyasa gelişmesi.";
    }

    return null;
}

function formatTimeAgo(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return `${Math.max(1, diffMin)} dk önce`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours} saat önce`;
        return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    } catch {
        return "Bugün";
    }
}

export function FeaturedNewsWidget({ news }: FeaturedNewsWidgetProps) {
    const newsList = Array.isArray(news) ? news : [];

    let mainFeatured: any | null = null;
    let secondaryFeatured: any[] = [];

    if (newsList.length > 0) {
        const sorted = [...newsList].sort((a, b) => calculateNewsScore(b) - calculateNewsScore(a));
        mainFeatured = sorted[0];
        secondaryFeatured = sorted.slice(1, 3);
    }

    const whyItMatters = mainFeatured ? generateWhyItMatters(mainFeatured) : null;

    const getMainHref = (item: any) =>
        item.slug
            ? `/dashboard/news/${item.slug}`
            : item.link
            ? `/dashboard/news?url=${encodeURIComponent(item.link)}`
            : "/dashboard/news";

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between h-full">
            {/* 1. Başlık Alanı */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 shrink-0 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            Öne Çıkanlar
                        </h3>
                    </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                    Günün Gelişmeleri
                </span>
            </div>

            {/* 2. İçerik Alanı */}
            {mainFeatured ? (
                <div className="flex-1 flex flex-col justify-between">
                    {/* Ana Öne Çıkan Gelişme Kartı */}
                    <Link
                        href={getMainHref(mainFeatured)}
                        className="group block p-3 rounded-xl bg-slate-50/70 border border-slate-100/90 hover:border-blue-200/80 hover:bg-blue-50/20 transition-all shadow-2xs mb-3"
                    >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Öne Çıkan
                                </span>
                                {mainFeatured.impact === "critical" && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.5 rounded">
                                        <AlertCircle className="w-2.5 h-2.5" /> Kritik
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                {formatTimeAgo(mainFeatured.pubDate)}
                            </span>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                                    {mainFeatured.title}
                                </h4>

                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span className="font-medium text-slate-500">{mainFeatured.source || "FinAi"}</span>
                                    {mainFeatured.categoryLabel && (
                                        <>
                                            <span>·</span>
                                            <span>{mainFeatured.categoryLabel}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {mainFeatured.imageUrl && (
                                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-100 relative">
                                    <img
                                        src={mainFeatured.imageUrl}
                                        alt={mainFeatured.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                        </div>

                        {whyItMatters && (
                            <div className="mt-2 p-2 rounded-lg bg-white border border-blue-100/70 text-[11px] text-slate-600 font-normal leading-relaxed shadow-2xs">
                                <span className="font-bold text-[#00008B] block text-[10px] mb-0.5">
                                    Neden önemli?
                                </span>
                                {whyItMatters}
                            </div>
                        )}
                    </Link>

                    {/* İkincil Öne Çıkanlar (Kompakt Liste) */}
                    {secondaryFeatured.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100/80">
                            {secondaryFeatured.map((item, idx) => (
                                <Link
                                    key={item.id || idx}
                                    href={getMainHref(item)}
                                    className="group flex items-start gap-2.5 p-1.5 -mx-1 rounded-lg hover:bg-slate-50/80 transition-colors"
                                >
                                    <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0 pt-0.5">
                                        {formatTimeAgo(item.pubDate)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h5 className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {item.title}
                                        </h5>
                                        <span className="text-[10px] text-slate-400 block pt-0.5">
                                            {item.source} · {item.categoryLabel || "Piyasa"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                    Öne çıkan gelişme bulunmuyor.
                </div>
            )}
        </div>
    );
}
