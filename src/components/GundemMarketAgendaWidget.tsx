"use client";

import Link from "next/link";
import { Newspaper, ArrowRight, Clock, Sparkles } from "lucide-react";

interface GundemMarketAgendaWidgetProps {
    news: any[];
}

function calculateNewsScore(item: any): number {
    let score = 0;

    // 1. Impact Priority
    if (item.impact === 'critical') score += 100;
    else if (item.impact === 'high') score += 60;
    else if (item.impact === 'medium') score += 30;

    if (item.isHot) score += 40;

    // 2. Category Priority
    if (item.category === 'portfolio') score += 50;
    else if (item.category === 'macro') score += 40;
    else if (item.category === 'bist') score += 35;
    else if (item.category === 'commodity') score += 20;

    // 3. Recency
    try {
        const pubTime = new Date(item.pubDate).getTime();
        const now = Date.now();
        const diffHours = (now - pubTime) / (1000 * 60 * 60);
        if (diffHours < 2) score += 30;
        else if (diffHours < 6) score += 15;
    } catch {}

    // 4. Headline Keyword Priority
    const titleUpper = (item.title || '').toUpperCase();
    if (/(?:OVP|ENFLASYON|TÜFE|FED|FAİZ|TCMB|BİST|KAP|MERKEZ BANKASI|CUMHURBAŞKANI)/.test(titleUpper)) {
        score += 25;
    }

    return score;
}

function getCategoryRegionText(item: any): string {
    const titleUpper = (item.title || '').toUpperCase();
    const descUpper = (item.description || '').toUpperCase();

    // Determine Region
    let region = 'Global';
    if (
        item.category === 'bist' || 
        item.category === 'portfolio' ||
        /(?:TÜRKİYE|TCMB|BİST|THYAO|OVP|TL|ANKARA|İSTANBUL|CUMHURBAŞKANI|TÜİK)/.test(titleUpper + descUpper)
    ) {
        region = 'Türkiye';
    } else if (/(?:ABD|FED|WALL STREET|S&P|NASDAQ|DOLAR)/.test(titleUpper + descUpper)) {
        region = 'ABD';
    } else if (/(?:AVRUPA|ECB|EURO)/.test(titleUpper + descUpper)) {
        region = 'Avrupa';
    } else if (item.category === 'crypto' || /(?:BITCOIN|CRYPTO|ETHEREUM)/.test(titleUpper)) {
        region = 'Global';
    }

    // Determine Category Label
    let cat = item.categoryLabel || 'Piyasalar';
    if (item.category === 'macro') cat = 'Makroekonomi';
    else if (item.category === 'bist') cat = 'Şirketler';
    else if (item.category === 'portfolio') cat = 'Portföy';
    else if (item.category === 'crypto') cat = 'Kripto';
    else if (item.category === 'commodity') cat = 'Emtia';

    return `${cat} · ${region}`;
}

function generateWhyItMatters(item: any): string | null {
    if (!item || !item.title) return null;

    const t = item.title.toUpperCase();

    if (t.includes('OVP') || t.includes('ORTA VADELİ PROGRAM')) {
        return "OVP hedefleri büyüme, enflasyon ve maliye politikası beklentileri açısından takip edilebilir.";
    }
    if (t.includes('ENFLASYON') || t.includes('TÜFE') || t.includes('ÜFE')) {
        return "Enflasyon verileri merkez bankası faiz patikası ve piyasa likiditesi açısından kritiktir.";
    }
    if (t.includes('FED') || t.includes('FAİZ') || t.includes('TCMB') || t.includes('POLİTİKA FAİZİ')) {
        return "Faiz kararları varlık fiyatlamalarını ve piyasa borçlanma maliyetlerini doğrudan etkiler.";
    }
    if (t.includes('TEMETTÜ') || t.includes('HAKEDİŞ') || t.includes('KAR PAYI')) {
        return "Temettü dağıtım haberleri nakit akışı ve yatırımcı getirisi açısından öne çıkmaktadır.";
    }
    if (t.includes('KAP') || t.includes('BİLANÇO') || t.includes('GELİR') || t.includes('CİRO')) {
        return "Şirketin finansal sonuçları hisse değerlemesi ve sektör kârlılığı açısından önemlidir.";
    }
    if (t.includes('HALK ARZ') || t.includes('HALKARZ')) {
        return "Halka arz gelişmeleri piyasaya yeni likidite katılımı ve talep yoğunluğu açısından izlenir.";
    }
    if (t.includes('BİTCOİN') || t.includes('ETHEREUM') || t.includes('KRİPTO')) {
        return "Kripto varlık hareketleri küresel risk iştahı ve likidite akışını yansıtmaktadır.";
    }
    if (t.includes('PETROL') || t.includes('BRENT') || t.includes('ALTIN') || t.includes('ONS')) {
        return "Emtia fiyatlarındaki değişimler küresel enflasyon ve jeopolitik risk beklentilerini gösterir.";
    }

    if (item.category === 'macro') {
        return "Makroekonomik veriler genel piyasa yönü ve ekonomik görünüm açısından önem taşır.";
    }
    if (item.category === 'bist') {
        return "Şirket haberleri piyasa değerlemeleri ve hisse hareketlerini etkileyebilir.";
    }
    if (item.category === 'portfolio') {
        return "Portföyünüzdeki varlıklarla doğrudan ilişkili piyasa gelişmesi.";
    }

    return null;
}

function formatTime(pubDate: string): string {
    try {
        const d = new Date(pubDate);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '--:--';
    }
}

export function GundemMarketAgendaWidget({ news }: GundemMarketAgendaWidgetProps) {
    const newsList = Array.isArray(news) ? news : [];

    // Prioritize news items deterministically
    let featuredNews: any | null = null;
    let otherNews: any[] = [];

    if (newsList.length > 0) {
        const sorted = [...newsList].sort((a, b) => calculateNewsScore(b) - calculateNewsScore(a));
        featuredNews = sorted[0];
        otherNews = sorted.slice(1, 4);
    }

    const whyItMattersText = featuredNews ? generateWhyItMatters(featuredNews) : null;

    return (
        <div className="w-full h-full bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-xs flex flex-col justify-between overflow-hidden min-h-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00008B]">
                        <Newspaper className="w-3.5 h-3.5 text-[#00008B]" />
                    </div>
                    <h3 className="text-[11px] sm:text-xs font-black text-[#00008B] uppercase tracking-wider">
                        Piyasa Gündemi
                    </h3>
                </div>
                <Link 
                    href="/dashboard/news" 
                    className="inline-flex items-center gap-1 text-[10px] font-black text-[#00008B] hover:text-blue-600 transition-colors uppercase tracking-wider"
                >
                    TÜMÜ <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Content Body */}
            {newsList.length > 0 ? (
                <div className="flex flex-col justify-between flex-1 gap-2.5">
                    {/* ÖNE ÇIKAN HABER */}
                    {featuredNews && (
                        <Link
                            href={`/dashboard/news?url=${encodeURIComponent(featuredNews.link)}`}
                            className="group block p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-2xs"
                        >
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Öne Çıkan
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{formatTime(featuredNews.pubDate)}</span>
                                </div>
                            </div>

                            <h4 className="text-xs sm:text-[13px] font-black text-[#00008B] leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                                {featuredNews.title}
                            </h4>

                            <div className="text-[10px] font-bold text-slate-400 mb-1">
                                {getCategoryRegionText(featuredNews)}
                            </div>

                            {whyItMattersText && (
                                <div className="mt-1.5 p-2 rounded-xl bg-white border border-blue-100/80 text-[10px] leading-relaxed text-slate-600 font-medium shadow-2xs">
                                    <span className="font-black text-[#00008B] block mb-0.5">Neden önemli?</span>
                                    {whyItMattersText}
                                </div>
                            )}
                        </Link>
                    )}

                    {/* DİĞER HABERLER (MAX 3) */}
                    <div className="space-y-1.5">
                        {otherNews.map((item, idx) => (
                            <Link
                                key={item.id || idx}
                                href={`/dashboard/news?url=${encodeURIComponent(item.link)}`}
                                className="group flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                            >
                                <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 pt-0.5">
                                    {formatTime(item.pubDate)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h5 className="text-[11px] font-bold text-slate-700 leading-snug group-hover:text-[#00008B] transition-colors line-clamp-1">
                                        {item.title}
                                    </h5>
                                    <span className="text-[9px] font-semibold text-slate-400 block pt-0.5">
                                        {getCategoryRegionText(item)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Footer / Alt Kısım */}
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                        <Link
                            href="/dashboard/news"
                            className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-[#00008B] transition-colors uppercase tracking-wider"
                        >
                            Daha fazla gelişme <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                    Şu anda gösterilecek yeni gelişme bulunmuyor.
                </div>
            )}
        </div>
    );
}
