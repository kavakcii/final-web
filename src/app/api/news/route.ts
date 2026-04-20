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
    
    // Readability-like simple extraction
    let bestContainer = $('article').length ? $('article') : $('main').length ? $('main') : $('body');
    let content = bestContainer.find('p').map((_, el) => $(el).text().trim()).get()
      .filter(p => p.length > 50)
      .join('\n\n');
      
    return content.slice(0, 15000);
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
  full_content?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

    // 1. Get User Portfolio
    let userAssets: string[] = [];
    if (userId) {
      const { data } = await supabase.from('user_portfolios').select('symbol').eq('user_id', userId);
      userAssets = data?.map(a => a.symbol.replace('.IS', '').replace('.is', '')) || [];
    }

    // 2. Sources
    const queries = [
      { name: 'Altın', query: 'altın+fiyatları+bloomberg' },
      { name: 'Enerji', query: 'enerji+petrol+bloomberg' },
      ...userAssets.slice(0, 3).map(asset => ({ name: 'Portföy', query: `${asset}+bloomberg+ht` }))
    ];

    if (queries.length < 5) queries.push({ name: 'Genel', query: 'ekonomi+bloomberg+ht' });

    const allNews: NewsItem[] = [];
    const seenLinks = new Set<string>();

    const fetchResults = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q.query)}&hl=tr&gl=TR&ceid=TR:tr`;
        const res = await fetch(url, { next: { revalidate: 600 } });
        const xml = await res.text();
        const parsed = parser.parse(xml);
        const items = Array.isArray(parsed.rss?.channel?.item) ? parsed.rss.channel.item : [parsed.rss?.channel?.item].filter(Boolean);
        
        return items.map((item: any) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: 'FinAi Ekonomi',
          description: item.description || '',
          category: q.name
        }));
      })
    );

    for (const res of fetchResults) {
      if (res.status === 'fulfilled') {
        for (const item of res.value) {
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            allNews.push(item);
          }
        }
      }
    }

    // 3. Select Daily 10
    const gold = allNews.filter(n => n.category === 'Altın').slice(0, 2);
    const energy = allNews.filter(n => n.category === 'Enerji').slice(0, 2);
    const others = allNews.filter(n => n.category !== 'Altın' && n.category !== 'Enerji').slice(0, 6);
    const selection = [...gold, ...energy, ...others].slice(0, 10);

    // 4. "UPLOAD" TO DATABASE (PERSIST CONTENT)
    const finalizedNews = await Promise.all(
      selection.map(async (item) => {
        const fullContent = await scrapeFullContent(item.link);
        
        const newsData = {
          title: item.title,
          link: item.link,
          description: item.description,
          full_content: fullContent,
          pub_date: new Date(item.pubDate).toISOString(),
          category: item.category,
          source: 'FinAi News'
        };

        // Try to save to Supabase news_articles table
        try {
          await supabase.from('news_articles').upsert(newsData, { onConflict: 'link' });
        } catch (e) {
          console.error("Database upload failed, continuing with memory-only", e);
        }

        return { ...item, full_content: fullContent };
      })
    );

    return NextResponse.json({ success: true, news: finalizedNews });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch and upload news" }, { status: 500 });
  }
}
