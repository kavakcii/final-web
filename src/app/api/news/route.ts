import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface EnrichedNewsItem {
    id: string;
    slug: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
    category: 'all' | 'portfolio' | 'kap' | 'bist' | 'macro' | 'commodity' | 'global' | 'crypto';
    categoryLabel: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: 'critical' | 'high' | 'medium';
    tickers: string[];
    affectedAssets: string[];
    readTime?: string;
    isHot?: boolean;
}

// Memory Cache with 3 minutes TTL
let cachedNews: { timestamp: number; items: EnrichedNewsItem[]; userId?: string | null } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000;

function slugify(text: string): string {
    const trMap: Record<string, string> = {
        'çÇ': 'c',
        'ğĞ': 'g',
        'şŞ': 's',
        'üÜ': 'u',
        'ıİ': 'i',
        'öÖ': 'o'
    };

    let slug = text;
    for (const key of Object.keys(trMap)) {
        slug = slug.replace(new RegExp(`[${key}]`, 'g'), trMap[key]);
    }

    return slug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 100);
}

const KNOWN_TICKERS = [
    'THYAO', 'ASELS', 'EREGL', 'TUPRS', 'FROTO', 'SISE', 'BIMAS', 'AKBNK', 'GARAN',
    'ISCTR', 'YKBNK', 'KCHOL', 'SAHOL', 'PETKM', 'EKGYO', 'ENKAI', 'HEKTS', 'SASA',
    'TTKOM', 'TCELL', 'TOASO', 'ARCLK', 'VESTL', 'KOZAL', 'KOZAA', 'ASTOR', 'KONTUR',
    'ALARK', 'ODAS', 'PGSUS', 'DOAS', 'GUBRF', 'MGROS', 'CIMSA', 'ISGYO', 'HALKB',
    'VAKBN', 'SOKM', 'AEFES', 'TABGD', 'REEDR', 'EUPWR', 'CWENE', 'ALFAS', 'MIATK', 'KAPEKS'
];

function extractAffectedAssets(title: string, desc: string, category: string): string[] {
    const found = new Set<string>();
    const text = `${title} ${desc}`.toLowerCase();
    const upper = `${title} ${desc}`.toUpperCase();

    // 1. Doğrudan hisse kodlarını tespit et (Hashtag'siz temiz kod)
    KNOWN_TICKERS.forEach(ticker => {
        const regex = new RegExp(`\\b${ticker}\\b`, 'i');
        if (regex.test(upper) || upper.includes(`(${ticker})`) || upper.includes(`[${ticker}]`)) {
            found.add(ticker);
        }
    });

    // 2. Varlık veya piyasa türünü belirle (Hashtag'siz profesyonel Türkçe etiketler)
    if (text.includes('altın') || text.includes('gram altın') || text.includes('çeyrek')) found.add('Altın');
    if (text.includes('ons ') || text.includes('ons altın')) found.add('Ons Altın');
    if (text.includes('petrol') || text.includes('brent')) found.add('Brent Petrol');
    if (text.includes('gümüş')) found.add('Gümüş');
    if (text.includes('dolar') || text.includes('usd') || text.includes('döviz')) found.add('Dolar/TL');
    if (text.includes('euro') || text.includes('eur')) found.add('Euro/TL');
    if (text.includes('bitcoin') || text.includes('btc')) found.add('Bitcoin');
    if (text.includes('ethereum') || text.includes('eth')) found.add('Ethereum');
    if (text.includes('bist 100') || text.includes('bist100') || text.includes('borsa istanbul')) found.add('BIST 100');
    if (text.includes('tcmb') || text.includes('faiz') || text.includes('enflasyon')) found.add('TCMB / Faiz');
    if (text.includes('fed ') || text.includes('wall street') || text.includes('nasdaq')) found.add('Fed / Wall Street');

    if (found.size === 0) {
        if (category === 'bist') found.add('Borsa İstanbul');
        else if (category === 'commodity') found.add('Altın & Emtia');
        else if (category === 'crypto') found.add('Kripto Piyasası');
        else if (category === 'macro') found.add('Makro Ekonomi');
        else if (category === 'global') found.add('Küresel Çapta');
        else found.add('Genel Piyasa');
    }

    return Array.from(found).slice(0, 2);
}

function detectSentiment(title: string, desc: string): 'bullish' | 'bearish' | 'neutral' {
    const text = `${title} ${desc}`.toLowerCase();
    
    const bullishWords = [
        'rekor', 'yükseliş', 'artış', 'kar açıkladı', 'büyüme', 'kazanç', 'anlaşma', 'ihale',
        'zirve', 'fırladı', 'tırmandı', 'olumlu', 'temettü', 'hedef yükseltti', 'ralli', 'al tavsiyesi',
        'güçlendi', 'güçlü', 'arttı', 'sıçradı', 'fırsat', 'beklentiyi aştı', 'halka arz', 'sözleşme imzaladı'
    ];
    
    const bearishWords = [
        'düşüş', 'çöküş', 'geriledi', 'zarar', 'kayıp', 'enflasyon arttı', 'satış baskısı',
        'kriz', 'endişe', 'savaş', 'yaptırım', 'taban', 'çakıldı', 'olumsuz', 'risk', 'faiz artışı',
        'düştü', 'kaybetti', 'tehlike', 'durgunluk', 'resesyon', 'hedef indirdi'
    ];

    let bullScore = 0;
    let bearScore = 0;

    bullishWords.forEach(w => { if (text.includes(w)) bullScore++; });
    bearishWords.forEach(w => { if (text.includes(w)) bearScore++; });

    if (bullScore > bearScore) return 'bullish';
    if (bearScore > bullScore) return 'bearish';
    return 'neutral';
}

function categorizeNews(title: string, desc: string, defaultCategory: EnrichedNewsItem['category'], defaultLabel: string): { category: EnrichedNewsItem['category']; label: string } {
    const text = `${title} ${desc}`.toLowerCase();

    if (text.includes('bitcoin') || text.includes('kripto') || text.includes('ethereum') || text.includes('btc') || text.includes('altcoin')) {
        return { category: 'crypto', label: 'Kripto Varlıklar' };
    }
    if (text.includes('altın') || text.includes('petrol') || text.includes('brent') || text.includes('gümüş') || text.includes('emtia') || text.includes('ons')) {
        return { category: 'commodity', label: 'Altın & Emtia' };
    }
    if (text.includes('fed ') || text.includes('wall street') || text.includes('nasdaq') || text.includes('s&p') || text.includes('ecb') || text.includes('küresel') || text.includes('lübnan') || text.includes('israil') || text.includes('gazze') || text.includes('abd ')) {
        return { category: 'global', label: 'Küresel Piyasalar' };
    }
    if (text.includes('kap ') || text.includes('bildirim') || text.includes('halka arz') || text.includes('pay alım') || text.includes('özel durum')) {
        return { category: 'kap', label: 'KAP & Şirketler' };
    }
    if (text.includes('tcmb') || text.includes('faiz') || text.includes('enflasyon') || text.includes('tüfe') || text.includes('cari açık') || text.includes('bütçe') || text.includes('bakan şimşek')) {
        return { category: 'macro', label: 'Makro Ekonomi' };
    }

    return { category: defaultCategory, label: defaultLabel };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const categoryParam = searchParams.get('category') || 'all';
        const limitParam = parseInt(searchParams.get('limit') || '50', 10);
        const forceRefresh = searchParams.get('refresh') === 'true';

        // Check in-memory cache
        const now = Date.now();
        if (!forceRefresh && cachedNews && (now - cachedNews.timestamp < CACHE_TTL_MS) && (!userId || cachedNews.userId === userId)) {
            let filtered = filterNews(cachedNews.items, categoryParam);
            const sliced = filtered.slice(0, limitParam);
            return NextResponse.json({
                success: true,
                data: sliced,
                news: sliced,
                total: filtered.length,
                cached: true
            });
        }

        // 1. Kullanıcının Portföyündeki Hisse ve Varlıkları Çek
        let userSymbols: string[] = [];
        if (userId) {
            try {
                const { data } = await supabase
                    .from('user_portfolios')
                    .select('symbol')
                    .eq('user_id', userId);
                if (data && data.length > 0) {
                    userSymbols = data.map(a => a.symbol.replace('.IS', '').replace('.is', '').trim().toUpperCase()).filter(Boolean);
                }
            } catch (e) {
                console.error("User portfolio symbols error:", e);
            }
        }

        // 2. KATEGORİ BAZLI DOĞRULANMIŞ HABER KAYNAKLARI
        const verifiedFeeds: { source: string; category: EnrichedNewsItem['category']; label: string; url: string }[] = [
            // Borsa İstanbul & Şirketler
            { source: 'AA Finans', category: 'bist', label: 'Borsa İstanbul', url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi' },
            { source: 'Ekonomim', category: 'bist', label: 'Borsa İstanbul', url: 'https://www.ekonomim.com/rss' },
            { source: 'Dünya Gazetesi', category: 'bist', label: 'Borsa İstanbul', url: 'https://www.dunya.com/rss' },

            // Makro Ekonomi & Para Politikası
            { source: 'Bloomberg HT', category: 'macro', label: 'Makro Ekonomi', url: 'https://www.bloomberght.com/rss' },
            { source: 'AA Ekonomi', category: 'macro', label: 'Makro Ekonomi', url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi' },
            { source: 'Ekonomim', category: 'macro', label: 'Makro Ekonomi', url: 'https://www.ekonomim.com/rss' },

            // Küresel Piyasalar
            { source: 'AA Dünya', category: 'global', label: 'Küresel Piyasalar', url: 'https://www.aa.com.tr/tr/rss/default?cat=dunya' },
            { source: 'Dünya Gazetesi', category: 'global', label: 'Küresel Piyasalar', url: 'https://www.dunya.com/rss' },
            { source: 'Bloomberg HT', category: 'global', label: 'Küresel Piyasalar', url: 'https://www.bloomberght.com/rss' },

            // Kripto Varlıklar
            { source: 'BTCHaber', category: 'crypto', label: 'Kripto Varlıklar', url: 'https://www.btchaber.com/feed/' },
            { source: 'Uzmancoin', category: 'crypto', label: 'Kripto Varlıklar', url: 'https://uzmancoin.com/feed/' },
            { source: 'Koin Bülteni', category: 'crypto', label: 'Kripto Varlıklar', url: 'https://koinbulteni.com/feed/' }
        ];

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        const seenUrls = new Set<string>();
        const seenSlugs = new Set<string>();
        const allItems: EnrichedNewsItem[] = [];

        const results = await Promise.allSettled(
            verifiedFeeds.map(async (feed) => {
                const res = await fetch(feed.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    next: { revalidate: 300 }
                });

                if (!res.ok) return [];
                const xmlText = await res.text();
                const parsed = parser.parse(xmlText);
                const rawItems = Array.isArray(parsed.rss?.channel?.item)
                    ? parsed.rss.channel.item
                    : [parsed.rss?.channel?.item].filter(Boolean);

                return rawItems.map((item: any) => {
                    const rawTitle = (item.title || '').trim();
                    const link = (item.link || '').trim();
                    const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
                    const rawDesc = (item.description || '').trim();
                    const cleanDesc = rawDesc.replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

                    const catInfo = categorizeNews(rawTitle, cleanDesc, feed.category, feed.label);
                    const affected = extractAffectedAssets(rawTitle, cleanDesc, catInfo.category);
                    const sentiment = detectSentiment(rawTitle, cleanDesc);

                    // Portföy eşleşmesi
                    let isPortfolioMatch = false;
                    if (userSymbols.length > 0 && affected.some(t => userSymbols.includes(t.toUpperCase()))) {
                        isPortfolioMatch = true;
                    }

                    let baseSlug = slugify(rawTitle);
                    let uniqueSlug = baseSlug;
                    let counter = 1;
                    while (seenSlugs.has(uniqueSlug)) {
                        uniqueSlug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    seenSlugs.add(uniqueSlug);

                    const enriched: EnrichedNewsItem = {
                        id: uniqueSlug,
                        slug: uniqueSlug,
                        title: rawTitle,
                        link: link,
                        pubDate: pubDate,
                        source: feed.source,
                        description: cleanDesc || rawTitle,
                        category: isPortfolioMatch ? 'portfolio' : catInfo.category,
                        categoryLabel: isPortfolioMatch ? 'Portföyüm' : catInfo.label,
                        sentiment: sentiment,
                        impact: (catInfo.category === 'kap' || isPortfolioMatch || sentiment !== 'neutral') ? 'high' : 'medium',
                        tickers: affected,
                        affectedAssets: affected,
                        readTime: '3 dk okuma',
                        isHot: isPortfolioMatch || sentiment !== 'neutral'
                    };

                    return enriched;
                });
            })
        );

        for (const res of results) {
            if (res.status === 'fulfilled') {
                for (const item of res.value) {
                    if (item && item.link && !seenUrls.has(item.link)) {
                        seenUrls.add(item.link);
                        allItems.push(item);
                    }
                }
            }
        }

        // Sort chronologically (En güncel haber en üstte)
        allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        // Update Cache
        cachedNews = {
            timestamp: now,
            items: allItems,
            userId
        };

        const filtered = filterNews(allItems, categoryParam);
        const sliced = filtered.slice(0, limitParam);

        return NextResponse.json({
            success: true,
            data: sliced,
            news: sliced,
            total: filtered.length,
            cached: false
        });

    } catch (error: any) {
        console.error("News API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Haberler yüklenirken bir sorun oluştu.",
            data: [],
            news: []
        }, { status: 500 });
    }
}

function filterNews(items: EnrichedNewsItem[], category: string): EnrichedNewsItem[] {
    if (!category || category === 'all') return items;
    return items.filter(item => item.category === category);
}
