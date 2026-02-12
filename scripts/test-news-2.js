const yahooFinance = require('yahoo-finance2').default;

console.log("yahooFinance object:", yahooFinance);

async function testNews() {
    if (!yahooFinance) {
        console.error("yahooFinance is undefined!");
        return;
    }

    try {
        const query = "IPJ";
        console.log(`Searching news for: ${query}`);
        
        // Try to suppress logger if possible, or just call search
        const searchResult = await yahooFinance.search(query, { newsCount: 3 });
        console.log("Search Result:", JSON.stringify(searchResult, null, 2));

    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

testNews();