const http = require('http');
const fs = require('fs');

http.get('http://localhost:3001/api/tefas/list', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.success || !json.data) throw new Error("No data");

            const funds = json.data.map(f => ({
                symbol: f.code,
                name: f.title,
                type: "Fon"
            }));

            console.log(`Fetched ${funds.length} funds.`);

            const content = `\nexport const TEFAS_CATALOG = ${JSON.stringify(funds, null, 2)};\n`;
            
            // Append to asset-catalog.ts
            fs.appendFileSync('./src/lib/asset-catalog.ts', content);
            console.log("Successfully appended TEFAS_CATALOG");
        } catch (e) {
            console.error("Error parsing/fetching:", e);
        }
    });
}).on('error', e => console.error("HTTP Error:", e));
