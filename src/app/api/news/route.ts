import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
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
    aiSummary?: string;
    imageUrl?: string;
    readTime?: string;
    isHot?: boolean;
}

// Memory Cache with 3 minutes TTL for high-speed response
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
    'VAKBN', 'SOKM', 'AEFES', 'TABGD', 'REEDR', 'EUPWR', 'CWENE', 'ALFAS', 'BTC', 'ETH', 'ALTIN', 'BRENT'
];

function extractTickers(text: string): string[] {
    const found = new Set<string>();
    const upper = text.toUpperCase();

    KNOWN_TICKERS.forEach(ticker => {
        const regex = new RegExp(`\\b${ticker}\\b`, 'i');
        if (regex.test(upper) || upper.includes(`(${ticker})`) || upper.includes(`[${ticker}]`)) {
            found.add(ticker);
        }
    });

    return Array.from(found).slice(0, 3);
}

function detectSentiment(title: string, desc: string): 'bullish' | 'bearish' | 'neutral' {
    const text = `${title} ${desc}`.toLowerCase();
    
    const bullishWords = [
        'rekor', 'yükseliş', 'artış', 'kar açıkladı', 'büyüme', 'kazanç', 'anlaşma', 'ihale',
        'zirve', 'fırladı', 'tırmandı', 'olumlu', 'temettü', 'hedef yükseltti', 'ralli', 'al tavsiyesi',
        'güçlendi', 'güçlü', 'arttı', 'sıçradı', 'fırsat', 'beklentiyi aştı', 'halka arz'
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

function categorizeNews(title: string, desc: string, source: string): { category: EnrichedNewsItem['category']; label: string } {
    const text = `${title} ${desc}`.toLowerCase();

    if (text.includes('kap ') || text.includes('bildirim') || text.includes('halka arz') || text.includes('pay alım') || text.includes('özel durum')) {
        return { category: 'kap', label: 'KAP Bildirimleri' };
    }
    if (text.includes('altın') || text.includes('petrol') || text.includes('brent') || text.includes('gümüş') || text.includes('emtia') || text.includes('ons')) {
        return { category: 'commodity', label: 'Altın & Emtia' };
    }
    if (text.includes('fed ') || text.includes('wall street') || text.includes('nasdaq') || text.includes('s&p') || text.includes('ecb') || text.includes('küresel')) {
        return { category: 'global', label: 'Küresel Piyasalar' };
    }
    if (text.includes('bitcoin') || text.includes('kripto') || text.includes('ethereum') || text.includes('btc')) {
        return { category: 'crypto', label: 'Kripto' };
    }
    if (text.includes('tcmb') || text.includes('faiz') || text.includes('enflasyon') || text.includes('tüfe') || text.includes('cari açık') || text.includes('bütçe')) {
        return { category: 'macro', label: 'Makro Ekonomi' };
    }

    return { category: 'bist', label: 'Borsa İstanbul' };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const categoryParam = searchParams.get('category') || 'all';
        const searchQuery = searchParams.get('search') || '';
        const limitParam = parseInt(searchParams.get('limit') || '50', 10);
        const forceRefresh = searchParams.get('refresh') === 'true';

        // Check in-memory cache
        const now = Date.now();
        if (!forceRefresh && cachedNews && (now - cachedNews.timestamp < CACHE_TTL_MS) && (!userId || cachedNews.userId === userId)) {
            let filtered = filterNews(cachedNews.items, categoryParam, searchQuery);
            const sliced = filtered.slice(0, limitParam);
            return NextResponse.json({
                success: true,
                data: sliced,
                news: sliced,
                total: filtered.length,
                cached: true,
                sentimentDistribution: calculateSentimentDistribution(cachedNews.items)
            });
        }

        // 1. Fetch User Portfolio symbols
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

        // 2. 3 SAYGIN & RESMİ HABER KAYNAĞI:
        // 1: Bloomberg HT (Türkiye'nin 1 numaralı ekonomi kanalı)
        // 2: AA Finans / Ekonomi (Anadolu Ajansı Resmi Ekonomi & Şirket Servisi)
        // 3: Ekonomim / Dünya Gazetesi (Türkiye'nin köklü ekonomi gazetesi)
        const primaryFeeds = [
            { source: 'Bloomberg HT', url: 'https://www.bloomberght.com/rss' },
            { source: 'AA Finans', url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi' },
            { source: 'Ekonomim', url: 'https://www.ekonomim.com/rss' }
        ];

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        const seenUrls = new Set<string>();
        const seenSlugs = new Set<string>();
        const allItems: EnrichedNewsItem[] = [];

        const results = await Promise.allSettled(
            primaryFeeds.map(async (feed) => {
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

                    const tickers = extractTickers(`${rawTitle} ${cleanDesc}`);
                    const sentiment = detectSentiment(rawTitle, cleanDesc);
                    const catInfo = categorizeNews(rawTitle, cleanDesc, feed.source);

                    let finalCategory = catInfo.category;
                    let finalCategoryLabel = catInfo.label;

                    if (userSymbols.length > 0 && tickers.some(t => userSymbols.includes(t))) {
                        finalCategory = 'portfolio';
                        finalCategoryLabel = 'Portföyüm';
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
                        category: finalCategory,
                        categoryLabel: finalCategoryLabel,
                        sentiment: sentiment,
                        impact: (finalCategory === 'kap' || sentiment !== 'neutral') ? 'high' : 'medium',
                        tickers: tickers,
                        readTime: '3 dk okuma',
                        isHot: sentiment !== 'neutral' || finalCategory === 'kap'
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

        // Sort by date newest first
        allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        // Update Cache
        cachedNews = {
            timestamp: now,
            items: allItems,
            userId
        };

        const filtered = filterNews(allItems, categoryParam, searchQuery);
        const sliced = filtered.slice(0, limitParam);

        return NextResponse.json({
            success: true,
            data: sliced,
            news: sliced,
            total: filtered.length,
            cached: false,
            sentimentDistribution: calculateSentimentDistribution(allItems)
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

function filterNews(items: EnrichedNewsItem[], category: string, search: string): EnrichedNewsItem[] {
    let result = items;

    if (category && category !== 'all') {
        result = result.filter(item => item.category === category);
    }

    if (search && search.trim().length > 0) {
        const s = search.toLowerCase().trim();
        result = result.filter(item => 
            item.title.toLowerCase().includes(s) ||
            item.description.toLowerCase().includes(s) ||
            item.tickers.some(t => t.toLowerCase().includes(s)) ||
            item.source.toLowerCase().includes(s)
        );
    }

    return result;
}

function calculateSentimentDistribution(items: EnrichedNewsItem[]) {
    if (!items || items.length === 0) return { bullish: 55, bearish: 25, neutral: 20, total: 0 };
    
    let bull = 0;
    let bear = 0;
    let neut = 0;

    items.forEach(item => {
        if (item.sentiment === 'bullish') bull++;
        else if (item.sentiment === 'bearish') bear++;
        else neut++;
    });

    const total = items.length;
    return {
        bullish: Math.round((bull / total) * 100),
        bearish: Math.round((bear / total) * 100),
        neutral: Math.round((neut / total) * 100),
        total
    };
}
