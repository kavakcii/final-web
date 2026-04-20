import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { summarizeNewsWithAI } from '@/lib/ai-portfolio-analyzer';

export const dynamic = 'force-dynamic';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// In-memory cache for AI summaries
const summaryCache: Record<string, { summary: string, timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const SOURCES = [
  {
    name: 'Mynet Finans',
    url: 'https://www.mynet.com/finans/rss/',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Mynet Finans',
      description: item.description || ''
    })
  },
  {
    name: 'Bloomberg HT',
    url: 'https://www.bloomberght.com/rss',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Bloomberg HT',
      description: item.description || ''
    })
  },
  {
    name: 'Investing.com TR',
    url: 'https://tr.investing.com/rss/news_25.rss',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Investing.com',
      description: item.description || ''
    })
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const searchSources = query ? [
      {
        name: 'Google News Search',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+OR+${encodeURIComponent(query)}+borsa&hl=tr&gl=TR&ceid=TR:tr`,
        parser: (item: any) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: item.source ? (typeof item.source === 'string' ? item.source : item.source['#text']) : 'Google News',
          description: item.description || ''
        })
      }
    ] : SOURCES;

    const allNews: NewsItem[] = [];
    const seenLinks = new Set<string>();

    const results = await Promise.allSettled(
      searchSources.map(async (source) => {
        try {
          const response = await fetch(source.url, { next: { revalidate: 300 } });
          if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
          const xmlData = await response.text();
          const parsed = parser.parse(xmlData);
          const items = parsed.rss?.channel?.item || [];
          const itemList = Array.isArray(items) ? items : [items];
          return itemList.map(source.parser);
        } catch (err) {
          return [];
        }
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

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const topNews = allNews.slice(0, 10);
    
    // AI Summarization with caching - Optimized to only summarize TOP 1 to save quota
    const summarizedNews = await Promise.all(
      topNews.map(async (item, index) => {
        // Only summarize the very first news item to be extremely light on API quota
        if (index < 1) {
          // Check cache
          const cached = summaryCache[item.link];
          if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return { ...item, aiSummary: cached.summary };
          }

          try {
            const summary = await summarizeNewsWithAI(item.title, item.description);
            summaryCache[item.link] = { summary, timestamp: Date.now() };
            return { ...item, aiSummary: summary };
          } catch (e) {
            console.error("AI Summary Quota/Error:", e);
            return item; // Fallback to original
          }
        }
        return item;
      })
    );

    return NextResponse.json({ success: true, news: summarizedNews });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}
