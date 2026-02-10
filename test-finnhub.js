const API_KEY = 'd65j5ahr01qiisgvtrugd65j5ahr01qiisgvtrv0';

async function testFinnhub() {
    console.log('Testing Finnhub API Key with Economic Calendar Endpoint...');
    const today = new Date().toISOString().split('T')[0];
    // Correct endpoint hypothesis: /calendar/economic
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${today}&to=${today}&token=${API_KEY}`;
    
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log('Response Preview:', text.substring(0, 200));
        
        try {
            const data = JSON.parse(text);
            console.log('JSON Parse Success!');
            console.log(data);
        } catch (e) {
            console.error('Not JSON!');
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

testFinnhub();
