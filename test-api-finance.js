async function testFinanceApi() {
    const symbols = "IPJ,TP2,ALC,YLE,IRT,GGK,GMC";
    const url = `http://localhost:3511/api/finance?symbols=${symbols}`;

    console.log(`Fetching from: ${url}`);
    try {
        const start = Date.now();
        const res = await fetch(url);
        const json = await res.json();
        const end = Date.now();

        console.log(`Status: ${res.status} (${end - start}ms)`);
        if (json.results) {
            console.log(`Found ${json.results.length} results.`);
            json.results.forEach(r => {
                console.log(`${r.symbol}: ${r.regularMarketPrice} (${r.shortName})`);
            });
        } else {
            console.log("No results in response:", json);
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testFinanceApi();
