const yahooFinance = require('yahoo-finance2').default;

async function testSearch(query) {
    console.log(`\n--- Searching for: ${query} ---`);
    try {
        const yahoo = new yahooFinance(); // Correct instantiation
        const result = await yahoo.search(query, {
            newsCount: 0,
            quotesCount: 10
        });
        console.log(`Raw results count: ${result.quotes.length}`);
        result.quotes.forEach(q => console.log(`- Symbol: ${q.symbol}, Name: ${q.shortname || q.longname}, Type: ${q.quoteType}, Exch: ${q.exchange}`));
    } catch (e) { console.log("Search error:", e.message); }
}

(async () => {
    await testSearch("ALC.IS");
    await testSearch("ALC");
})();