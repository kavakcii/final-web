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
    name: 'Google Haberler (Ekonomi)',
    url: 'https://news.google.com/rss/search?q=ekonomi+OR+borsa+OR+finans&hl=tr&gl=TR&ceid=TR:tr',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Google News',
      description: item.description || ''
    })
  },
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
    name: 'Foreks Haber',
    url: 'https://www.foreks.com/rss',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Foreks',
      description: item.description || ''
    })
  },
  {
    name: 'Anadolu Ajansı',
    url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'AA',
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
          source: 'Google News',
          description: item.description || ''
        })
      }
    ] : SOURCES;

    const allNews: NewsItem[] = [];
    const seenLinks = new Set<string>();
    const seenTitles = new Set<string>(); // Tekilleştirme için başlık kontrolü

    const results = await Promise.allSettled(
      searchSources.map(async (source) => {
        try {
          const response = await fetch(source.url, { 
            next: { revalidate: 300 },
            headers: { 'User-Agent': 'Mozilla/5.0' } 
          });
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
          // Gelişmiş Tekilleştirme: Hem link hem de benzer başlık kontrolü
          const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, '').slice(0, 50);
          if (!seenLinks.has(item.link) && !seenTitles.has(normalizedTitle)) {
            seenLinks.add(item.link);
            seenTitles.add(normalizedTitle);
            allNews.push(item);
          }
        }
      }
    }

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // En güncel 12 haberi al
    const topNews = allNews.slice(0, 12);
    
    // AI Summarization with caching - Optimized to only summarize TOP 1 to save quota
    const summarizedNews = await Promise.all(
      topNews.map(async (item, index) => {
        if (index < 1) {
          const cached = summaryCache[item.link];
          if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return { ...item, aiSummary: cached.summary };
          }

          try {
            const summary = await summarizeNewsWithAI(item.title, item.description);
            summaryCache[item.link] = { summary, timestamp: Date.now() };
            return { ...item, aiSummary: summary };
          } catch (e) {
            return item;
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
