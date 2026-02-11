import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Force dynamic to ensure fresh data every time
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch news for multiple key market indicators
        // We'll search for broad terms to get market-wide news
        const queries = ['XU100.IS', 'TRY=X', 'GC=F', 'AAPL', 'BTC-USD'];

        const allNews = [];

        // Fetch news for each query in parallel
        const newsPromises = queries.map(async (query) => {
            try {
                const result: any = await yahooFinance.search(query, { newsCount: 3 });
                return result.news || [];
            } catch (e) {
                console.error(`Failed to fetch news for ${query}`, e);
                return [];
            }
        });

        const results = await Promise.all(newsPromises);

        // Flatten and deduplicate news based on title or uuid
        const seenTitles = new Set();
        const uniqueNews = [];

        for (const group of results) {
            for (const item of group) {
                if (!seenTitles.has(item.title)) {
                    seenTitles.add(item.title);

                    // Map to our UI format
                    uniqueNews.push({
                        id: item.uuid || Math.random().toString(36).substr(2, 9),
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.providerPublishTime ? item.providerPublishTime * 1000 : Date.now()).toISOString(),
                        source: item.publisher || 'Yahoo Finance',
                        description: 'Piyasa haberi', // Yahoo search news often lacks description, we can use title
                        type: 'market',
                        relatedAssets: [item.relatedTickers?.[0] || 'General']
                    });
                }
            }
        }

        // Sort by date (newest first)
        uniqueNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        return NextResponse.json({
            success: true,
            data: uniqueNews.slice(0, 10) // Return top 10 news
        });

    } catch (error) {
        console.error('Market news fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch market news'
        }, { status: 500 });
    }
}
