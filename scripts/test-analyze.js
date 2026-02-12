
async function testAnalyze() {
    try {
        const response = await fetch('http://localhost:3004/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetName: 'ALC',
                assetContext: {
                    symbol: 'ALC',
                    longname: 'ALBARAKA PORTFÖY KATILIM FONU',
                    quoteType: 'MUTUALFUND',
                    exchange: 'TEFAS'
                }
            })
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testAnalyze();
