
const YahooFinance = require('yahoo-finance2').default; // Note capitalization if it matters, or check export
const yahooFinance = new YahooFinance();

async function testNews() {
    console.log("Testing Yahoo Finance News Fetching...");
    try {
        const query = 'XU100.IS';
        console.log(`Searching news for: ${query}`);
        const result = await yahooFinance.search(query, { newsCount: 3 });
        
        if (result.news && result.news.length > 0) {
            console.log("Success! Found news items:");
            result.news.forEach((n, i) => {
                console.log(`${i+1}. ${n.title} (${n.providerPublishTime})`);
            });
        } else {
            console.log("No news found.");
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

testNews();
