const https = require('https');

function fetchFoneria(code) {
    console.log("Start fetch...");
    const options = {
        hostname: 'foneria.com.tr',
        path: `/yatirim-fonu/${code.toLowerCase()}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('BODY LENGTH:', data.length);
            // Look for specific data patterns
            // Example: "Hisse Senedi" or percentages
            if (data.includes('Varlık Dağılımı')) {
                console.log('Found "Varlık Dağılımı"!');
                // Try to extract some data near it
                const index = data.indexOf('Varlık Dağılımı');
                console.log(data.substring(index, index + 500));
            } else {
                console.log('"Varlık Dağılımı" not found.');
                console.log('Preview:', data.substring(0, 500));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.end();
}

fetchFoneria('YLE');
