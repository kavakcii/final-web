import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { summarizeNewsWithAI } from '@/lib/ai-portfolio-analyzer';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function scrapeFullContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });
    if (!response.ok) return '';
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, ads').remove();
    let content = $('article').text() || $('main').text() || $('body').text();
    return content.replace(/\s+/g, ' ').trim().slice(0, 3000);
  } catch (e) {
    return '';
  }
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  category?: string;
}

const summaryCache: Record<string, { summary: string, timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

    // 1. Fetch User Portfolio for Personalization
    let userAssets: string[] = [];
    if (userId) {
      const { data } = await supabase.from('user_portfolios').select('symbol').eq('user_id', userId);
      userAssets = data?.map(a => a.symbol.replace('.IS', '').replace('.is', '')) || [];
    }

    // 2. Define Feed Sources (Bloomberg Focused)
    const categoryFeeds = [
      { name: 'Altın', query: 'altın+fiyatları+bloomberg' },
      { name: 'Enerji', query: 'enerji+petrol+bloomberg' },
      ...userAssets.slice(0, 3).map(asset => ({ name: 'Portföy', query: `${asset}+bloomberg+ht` }))
    ];

    // Standard Fallback if no assets or for general mix
    if (categoryFeeds.length < 5) {
      categoryFeeds.push({ name: 'Genel', query: 'ekonomi+bloomberg+ht' });
    }

    const allNews: NewsItem[] = [];
    const seenLinks = new Set<string>();

    // 3. Fetch News from Google News (searching Bloomberg sources)
    const results = await Promise.allSettled(
      categoryFeeds.map(async (cat) => {
        try {
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=tr&gl=TR&ceid=TR:tr`;
          const response = await fetch(url, { next: { revalidate: 600 } });
          const xmlData = await response.text();
          const parsed = parser.parse(xmlData);
          const items = parsed.rss?.channel?.item || [];
          const itemList = Array.isArray(items) ? items : [items];
          
          return itemList.map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: 'Bloomberg HT / Market',
            description: item.description || '',
            category: cat.name
          }));
        } catch (err) { return []; }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const item of result.value) {
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            allNews.push(item);
          }
        }
      }
    }

    // 4. Personalized Selection Logic (Daily 10)
    // Always include: 2 Gold, 2 Energy, 6 Portfolio/General
    const goldNews = allNews.filter(n => n.category === 'Altın').slice(0, 2);
    const energyNews = allNews.filter(n => n.category === 'Enerji').slice(0, 2);
    const otherNews = allNews.filter(n => n.category !== 'Altın' && n.category !== 'Enerji')
                             .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
                             .slice(0, 6);

    const personalizedSelection = [...goldNews, ...energyNews, ...otherNews].slice(0, 10);

    // 5. AI Summarization for all 10 (with Cache)
    const summarizedNews = await Promise.all(
      personalizedSelection.map(async (item) => {
        const cacheKey = item.link + item.title;
        const cached = summaryCache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          return { ...item, aiSummary: cached.summary };
        }

        try {
          const fullContent = await scrapeFullContent(item.link);
          const summary = await summarizeNewsWithAI(item.title, fullContent || item.description);
          summaryCache[cacheKey] = { summary, timestamp: Date.now() };
          return { ...item, aiSummary: summary };
        } catch (e) {
          return item;
        }
      })
    );

    return NextResponse.json({ success: true, news: summarizedNews });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch personalized news" }, { status: 500 });
  }
}
