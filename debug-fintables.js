const https = require('https');

async function run() {
    const url = 'https://fintables.com/fonlar/MAC';
    console.log(`Fetching ${url}...`);
    
    const req = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            if (data.includes('THYAO') || data.includes('TUPRS')) {
                console.log('Found stock codes in response!');
                // Print a snippet around the found code
                const idx = data.indexOf('THYAO');
                console.log(data.substring(idx - 100, idx + 200));
            } else {
                console.log('Stock codes not found in simple HTML. Might be dynamic (React/Next.js).');
                // Check for JSON data in __NEXT_DATA__ or similar
                if (data.includes('__NEXT_DATA__')) {
                     console.log('Found __NEXT_DATA__, might be in props.');
                }
            }
        });
    });
    req.on('error', e => console.error(e));
}
run();
