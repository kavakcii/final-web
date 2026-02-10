import yahooFinance from 'yahoo-finance2';

async function testNews() {
  try {
    const symbol = 'THYAO.IS';
    console.log(`Fetching news for ${symbol}...`);
    
    // Try search first as it often contains news
    const searchResult = await yahooFinance.search(symbol, { newsCount: 5 });
    console.log('Search News:', JSON.stringify(searchResult.news, null, 2));

    // Try quoteSummary with news
    // Note: 'news' might not be a valid module for all symbols or might be deprecated/moved.
    // Common modules: 'price', 'summaryDetail', 'financialData'.
    // Let's stick to search for news or 'recommendationTrend'.
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testNews();
