const https = require('https');

async function run() {
    const url = 'https://fintables.com/fonlar/MAC';
    console.log(`Fetching ${url}...`);
    
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8'
        }
    };

    const req = https.get(url, options, (res) => {
        console.log('Status:', res.statusCode);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log('Data length:', data.length);
            if (data.includes('__NEXT_DATA__')) {
                console.log('Found __NEXT_DATA__!');
                const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
                if (match) {
                    try {
                        const json = JSON.parse(match[1]);
                        console.log('Parsed Next Data Keys:', Object.keys(json));
                        // Dig into props
                        if (json.props && json.props.pageProps) {
                             console.log('PageProps Keys:', Object.keys(json.props.pageProps));
                             const fundData = json.props.pageProps.fund; // Guessing key
                             if (fundData) {
                                 console.log('Fund Data found:', Object.keys(fundData));
                             }
                        }
                    } catch (e) {
                        console.error('JSON Parse Error', e);
                    }
                }
            } else {
                console.log('__NEXT_DATA__ not found. Preview:', data.substring(0, 200));
            }
        });
    });
    
    req.on('error', (e) => {
        console.error('Request Error:', e);
    });
}
run();
