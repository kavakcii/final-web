import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET() {
  try {
    // Google News RSS Feed for "Ekonomi" (Economy) in Turkey
    // You can customize the query (q=) to be more specific if needed, e.g., "finans", "borsa"
    const RSS_URL = "https://news.google.com/rss/search?q=ekonomi+OR+finans+OR+piyasa&hl=tr&gl=TR&ceid=TR:tr";

    const response = await fetch(RSS_URL);
    const xmlData = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const parsedData = parser.parse(xmlData);
    
    // Navigate to the items in the RSS feed
    // RSS structure: rss -> channel -> item[]
    const items = parsedData.rss?.channel?.item || [];

    // Limit to 10-15 latest news
    const newsItems = items.slice(0, 15).map((item: any) => {
      // Extract source if available (Google News often puts source in <source> tag or title)
      let source = 'Google News';
      if (item.source) {
          if (typeof item.source === 'string') {
              source = item.source;
          } else if (item.source['#text']) {
              source = item.source['#text'];
          }
      }
      
      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate, // e.g., "Tue, 10 Feb 2026 14:30:00 GMT"
        source: source,
        description: item.description
      };
    });

    return NextResponse.json({ success: true, news: newsItems });
    
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
