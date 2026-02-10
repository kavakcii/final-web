const https = require('https');
const fs = require('fs');

const code = 'MAC';
const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${code}`;

console.log(`Fetching ${url}...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('tefas-dump.html', data);
        console.log('Saved to tefas-dump.html');
        
        // Check for common stock names
        const stocks = ['THYAO', 'MGROS', 'TUPRS', 'AKBNK'];
        stocks.forEach(s => {
            if (data.includes(s)) console.log(`Found stock: ${s}`);
            else console.log(`Not found: ${s}`);
        });

        // Check for "Portföy Dağılımı"
        if (data.includes('Portföy Dağılımı')) console.log('Found "Portföy Dağılımı" section');
    });
}).on('error', (e) => {
    console.error(e);
});
