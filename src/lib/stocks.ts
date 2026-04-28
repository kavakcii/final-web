import https from 'https';

export interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    name?: string;
}

export async function fetchStockData(symbol: string): Promise<StockData | null> {
    // Yahoo Finance BIST symbols end with .IS
    const yahooSymbol = symbol.endsWith('.IS') ? symbol : `${symbol}.IS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

    return new Promise((resolve) => {
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const result = json.chart.result[0];
                    const meta = result.meta;
                    
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.previousClose;
                    const change = price - prevClose;
                    const changePercent = (change / prevClose) * 100;

                    resolve({
                        symbol: symbol,
                        price: price,
                        change: change,
                        changePercent: changePercent,
                        name: symbol // We can expand this with a name dictionary if needed
                    });
                } catch (e) {
                    console.error(`Error parsing stock data for ${symbol}:`, e);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error(`HTTP error for ${symbol}:`, err);
            resolve(null);
        });
    });
}

/**
 * Fetches multiple stocks in parallel
 */
export async function fetchMultipleStocks(symbols: string[]): Promise<StockData[]> {
    const promises = symbols.map(s => fetchStockData(s));
    const results = await Promise.all(promises);
    return results.filter((r): r is StockData => r !== null);
}
