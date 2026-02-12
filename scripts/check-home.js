const https = require('https');

function fetchHome() {
    const options = {
        hostname: 'foneria.com.tr',
        path: '/',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Home length:', data.length);
            // Check for fund links regex
            const links = data.match(/href=["']\/[^"']*fon[^"']*["']/g);
            if (links) {
                console.log('Found fund related links:', links.slice(0, 10));
            } else {
                console.log('No fund links found.');
            }
        });
    });
    req.end();
}

fetchHome();
