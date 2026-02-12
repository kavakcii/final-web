
const fetch = require('node-fetch');

async function testAnalyze() {
    const assetName = "IPJ";
    const assetContext = {
        symbol: "IPJ",
        quoteType: "MUTUALFUND",
        exchange: "TEFAS",
        longname: "IS PORTFOY ELEKTRIKLI ARACLAR KARMA FON"
    };

    try {
        console.log("Testing API with:", assetName);
        const res = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetName,
                assetContext
            })
        });

        const data = await res.json();
        console.log("Response status:", res.status);
        if (data.success) {
            console.log("Data keys:", Object.keys(data.data));
            if (data.data.analysis) {
                console.log("Analysis items:", data.data.analysis.length);
                console.log("First item:", JSON.stringify(data.data.analysis[0], null, 2));
            } else {
                console.log("No analysis array found!");
                console.log("Full data:", JSON.stringify(data.data, null, 2));
            }
        } else {
            console.error("Error:", data.error);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testAnalyze();
