import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

const SOURCES = [
  {
    name: 'Google News Ekonomi',
    url: 'https://news.google.com/rss/search?q=ekonomi+OR+finans+OR+borsa+OR+dolar+OR+enflasyon&hl=tr&gl=TR&ceid=TR:tr',
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source ? (typeof item.source === 'string' ? item.source : item.source['#text']) : 'Google News',
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
    name: 'Investing.com TR', // investing.com bazen blocklayabilir, dikkatli olalım. Alternatif: TradingView veya Foreks
    url: 'https://tr.investing.com/rss/news_25.rss', // Hisse Senedi Haberleri
    parser: (item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: 'Investing.com',
      description: item.description || ''
    })
  }
];

export async function GET() {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const allNews: NewsItem[] = [];
    const seenLinks = new Set<string>();

    // Fetch all sources in parallel
    const results = await Promise.allSettled(
      SOURCES.map(async (source) => {
        try {
          const response = await fetch(source.url, { next: { revalidate: 300 } }); // 5 min cache
          if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
          const xmlData = await response.text();
          const parsed = parser.parse(xmlData);
          const items = parsed.rss?.channel?.item || [];

          // Normalize single item to array if needed
          const itemList = Array.isArray(items) ? items : [items];

          return itemList.map(source.parser);
        } catch (err) {
          console.error(`Error fetching ${source.name}:`, err);
          return [];
        }
      })
    );

    // Aggregate results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const item of result.value) {
          // Basic deduplication
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            allNews.push(item);
          }
        }
      }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({ success: true, news: allNews.slice(0, 30) });

  } catch (error) {
    console.error("News aggregator error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
