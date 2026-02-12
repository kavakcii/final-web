const yahooFinance = require('yahoo-finance2').default;

async function testNews() {
    try {
        const query = "IPJ";
        console.log(`Searching news for: ${query}`);
        
        // Try symbol search first
        const searchResult = await yahooFinance.search(query);
        console.log("Search Result Quotes:", searchResult.quotes.length);
        console.log("Search Result News:", searchResult.news.length);

        if (searchResult.news && searchResult.news.length > 0) {
            console.log("First news item:", searchResult.news[0].title);
        } else {
            console.log("No news found in search.");
        }

    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

testNews();