import * as cheerio from 'cheerio';

export async function scrapeEconomicCalendar() {
    try {
        // Investing.com often blocks scrapers, but we can try scraping a Turkish alternative or a more scraping-friendly site.
        // Let's try tradingeconomics.com or a similar public page.
        // For simplicity and Turkish context, let's try scraping a static structure if possible, 
        // but since these sites are dynamic, a simple fetch might fail due to anti-bot.
        // Instead, we will use a "simulated" real data approach or a very permissive source.
        
        // Strategy: Use a known public JSON endpoint if available, or fallback to a better mock generator.
        // Since the user wants "another source", and scraping is flaky without puppeteer (which is heavy),
        // I will try to fetch from a public investing.com calendar widget or similar if possible.
        
        // Actually, let's try to scrape 'investing.com' with custom headers.
        const response = await fetch('https://tr.investing.com/economic-calendar/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch investing.com');
        
        const html = await response.text();
        const $ = cheerio.load(html);
        const events: any[] = [];
        
        // Investing.com table structure (subject to change)
        $('#economicCalendarData tbody tr').each((i, el) => {
            const $el = $(el);
            if ($el.hasClass('overviewDay')) return; // Date header
            
            const time = $el.find('.time').text().trim();
            const country = $el.find('.flagCur').text().trim().split(' ')[0]; // TR, USD etc.
            const importance = $el.find('.sentiment').filter((i, s) => $(s).hasClass('grayFull') || $(s).hasClass('bullMode')).length;
            const event = $el.find('.event').text().trim();
            const actual = $el.find('.act').text().trim();
            const previous = $el.find('.prev').text().trim();
            
            if (time && event) {
                events.push({
                    time,
                    country,
                    event,
                    actual,
                    previous,
                    impact: importance === 3 ? 'high' : importance === 2 ? 'medium' : 'low'
                });
            }
        });
        
        return events.slice(0, 10); // Return first 10 events
    } catch (error) {
        console.error("Scraping failed:", error);
        return [];
    }
}
