const https = require('https');

const code = process.argv[2] || 'MAC';
const url = `https://www.kap.org.tr/tr/fon-bilgileri/ozet/${code}`;

console.log(`Checking ${url}...`);

https.get(url, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.headers.location) {
        console.log(`Redirect to: ${res.headers.location}`);
    }
    console.log('Headers:', res.headers);
}).on('error', (e) => {
    console.error(e);
});
