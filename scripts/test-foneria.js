const https = require('https');

function fetchFoneria(code) {
    const url = `https://www.foneria.com.tr/yatirim-fonu/${code.toLowerCase()}`;
    console.log(`Fetching ${url}...`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Length:', data.length);
            // Print a snippet to see if we got HTML
            console.log('Preview:', data.substring(0, 500));
            
            // Try to find "Varlık Dağılımı" or similar
            if (data.includes('Varlık Dağılımı')) {
                console.log('Found "Varlık Dağılımı" in content!');
            } else {
                console.log('"Varlık Dağılımı" not found.');
            }
        });
    }).on('error', (err) => {
        console.error('Error:', err.message);
    });
}

fetchFoneria('YLE');
