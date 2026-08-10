import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface EnrichedNewsItem {
    id: string;
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

// Memory Cache with 3 minutes TTL for blazing fast response
let cachedNews: { timestamp: number; items: EnrichedNewsItem[]; userId?: string | null } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000;

// Known BIST and global stock symbols for automatic regex extraction
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
        'güçlendi', 'güçlü', 'arttı', 'sıçradı', 'fırsat', 'beklentiyi aştı'
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

function generateSmartAiSummary(title: string, desc: string, tickers: string[], sentiment: string): string {
    const cleanDesc = desc.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    const tickerText = tickers.length > 0 ? `[${tickers.join(', ')}] ` : '';
    
    if (cleanDesc.length > 40 && !cleanDesc.includes('...')) {
        return `${tickerText}${cleanDesc.slice(0, 180)}...`;
    }

    if (sentiment === 'bullish') {
        return `${tickerText}${title} gelişmesi, ilgili sektörde ve piyasalarda yukarı yönlü pozitif fiyatlama beklentisini artırdı.`;
    } else if (sentiment === 'bearish') {
        return `${tickerText}${title} haberi, piyasalarda temkinli duruşu ve ilgili varlıklarda satış baskısını beraberinde getirebilir.`;
    }

    return `${tickerText}${title} gelişmesi analistler tarafından yakından izleniyor ve piyasa dengeleri üzerinde nötr etki bırakması bekleniyor.`;
}

function extractImageFromHtml(htmlSnippet: string): string | undefined {
    try {
        const $ = cheerio.load(htmlSnippet);
        const src = $('img').first().attr('src');
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
            return src.startsWith('//') ? `https:${src}` : src;
        }
    } catch {
        // ignore
    }
    return undefined;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const categoryParam = searchParams.get('category') || 'all';
        const searchQuery = searchParams.get('search') || '';
        const limitParam = parseInt(searchParams.get('limit') || '40', 10);
        const forceRefresh = searchParams.get('refresh') === 'true';

        // Check in-memory cache
        const now = Date.now();
        if (!forceRefresh && cachedNews && (now - cachedNews.timestamp < CACHE_TTL_MS) && (!userId || cachedNews.userId === userId)) {
            let filtered = filterNews(cachedNews.items, categoryParam, searchQuery);
            return NextResponse.json({
                success: true,
                data: filtered.slice(0, limitParam),
                total: filtered.length,
                cached: true,
                sentimentDistribution: calculateSentimentDistribution(cachedNews.items)
            });
        }

        // 1. Fetch User Portfolio symbols if userId present
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

        type QueryCategory = 'all' | 'portfolio' | 'kap' | 'bist' | 'macro' | 'commodity' | 'global' | 'crypto';

        // 2. Multi-channel Search Query Configurations
        const queries: { category: QueryCategory; label: string; query: string }[] = [
            // BIST & KAP
            { category: 'kap', label: 'KAP Bildirimleri', query: 'KAP+Kamuyu+Aydınlatma+Platformu+OR+Özel+Durum+Açıklaması+bloomberg' },
            { category: 'bist', label: 'Borsa İstanbul', query: 'Borsa+İstanbul+BIST100+hisse+haberleri+bloomberght' },
            
            // Macro Economy
            { category: 'macro', label: 'Makro Ekonomi', query: 'TCMB+faiz+enflasyon+Merkez+Bankası+ekonomi+bloomberg+ht' },
            
            // Commodities (Gold / Energy)
            { category: 'commodity', label: 'Altın & Emtia', query: 'gram+altın+fiyatları+ons+petrol+brent+bloomberg' },
            
            // Global Markets
            { category: 'global', label: 'Küresel Piyasalar', query: 'Fed+faiz+Wall+Street+Nasdaq+Dow+Jones+kuresel+piyasalar' },
            
            // Crypto
            { category: 'crypto', label: 'Kripto', query: 'Bitcoin+Ethereum+kripto+para+piyasasi+haberleri' }
        ];

        // Add user-specific portfolio queries if available
        if (userSymbols.length > 0) {
            const topSymbols = userSymbols.slice(0, 4);
            topSymbols.forEach(sym => {
                queries.push({
                    category: 'portfolio',
                    label: 'Portföyüm',
                    query: `${sym}+hisse+haber+borsa`
                });
            });
        } else {
            queries.push({
                category: 'portfolio',
                label: 'Portföyüm',
                query: 'THYAO+ASELS+EREGL+TUPRS+hisse'
            });
        }

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        const seenUrls = new Set<string>();
        const allItems: EnrichedNewsItem[] = [];

        // Fetch RSS in parallel
        const results = await Promise.allSettled(
            queries.map(async (q) => {
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q.query)}&hl=tr&gl=TR&ceid=TR:tr`;
                const res = await fetch(rssUrl, {
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

                return rawItems.map((item: any, idx: number) => {
                    const rawTitle = (item.title || '').trim();
                    const link = (item.link || '').trim();
                    const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
                    const rawDesc = (item.description || '').trim();

                    // Split publisher from title (Google News format: "Title - Publisher")
                    let title = rawTitle;
                    let source = 'FinAi Haber';
                    if (rawTitle.includes(' - ')) {
                        const parts = rawTitle.split(' - ');
                        source = parts.pop() || source;
                        title = parts.join(' - ');
                    } else if (item.source) {
                        source = typeof item.source === 'object' ? item.source['#text'] || 'FinAi Haber' : item.source;
                    }

                    const cleanDesc = rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    const tickers = extractTickers(`${title} ${cleanDesc}`);
                    const sentiment = detectSentiment(title, cleanDesc);
                    const isHot = idx === 0 || sentiment !== 'neutral' || q.category === 'kap';
                    const impact: 'critical' | 'high' | 'medium' = (q.category === 'kap' || sentiment !== 'neutral') ? 'high' : 'medium';
                    const imageUrl = extractImageFromHtml(rawDesc);

                    // Check if ticker matches user's portfolio
                    let finalCategory = q.category;
                    let finalCategoryLabel = q.label;
                    if (userSymbols.length > 0 && tickers.some(t => userSymbols.includes(t))) {
                        finalCategory = 'portfolio';
                        finalCategoryLabel = 'Portföyüm';
                    }

                    const aiSummary = generateSmartAiSummary(title, cleanDesc, tickers, sentiment);

                    const enriched: EnrichedNewsItem = {
                        id: Buffer.from(link || title).toString('base64').slice(0, 24),
                        title,
                        link,
                        pubDate,
                        source,
                        description: cleanDesc || title,
                        category: finalCategory,
                        categoryLabel: finalCategoryLabel,
                        sentiment,
                        impact,
                        tickers,
                        aiSummary,
                        imageUrl,
                        readTime: '2 dk okuma',
                        isHot
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

        // Sort by publish date descending
        allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        // Update Cache
        cachedNews = {
            timestamp: now,
            items: allItems,
            userId
        };

        const filtered = filterNews(allItems, categoryParam, searchQuery);

        return NextResponse.json({
            success: true,
            data: filtered.slice(0, limitParam),
            total: filtered.length,
            cached: false,
            sentimentDistribution: calculateSentimentDistribution(allItems)
        });

    } catch (error: any) {
        console.error("News API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Haberler yüklenirken bir sorun oluştu.",
            data: []
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
    if (!items || items.length === 0) return { bullish: 50, bearish: 25, neutral: 25, total: 0 };
    
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
