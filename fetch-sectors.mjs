import fs from 'fs';

const indices = {
    'xusin': 'Sınai',
    'xbank': 'Banka',
    'xhold': 'Holding',
    'xuhiz': 'Hizmetler',
    'xutek': 'Teknoloji',
    'xmadn': 'Madencilik',
    'xmana': 'Metal Ana',
    'xulas': 'Ulaştırma',
    'xgida': 'Gıda',
    'xtcrt': 'Ticaret',
    'xtrzm': 'Turizm',
    'xinsa': 'İnşaat',
    'xelkt': 'Elektrik',
    'xblsm': 'Bilişim',
    'xteks': 'Tekstil',
    'xspor': 'Spor',
    'xiltm': 'İletişim'
};

async function fetchSectors() {
    const sectorMapping = {};
    
    for (const [code, name] of Object.entries(indices)) {
        console.log(`Fetching ${name} (${code})...`);
        try {
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const url = page === 1 
                    ? `https://halkarz.com/bist-endeks/${code}/` 
                    : `https://halkarz.com/bist-endeks/${code}/page/${page}/`;
                    
                const res = await fetch(url);
                if (!res.ok) {
                    hasMore = false;
                    break;
                }
                
                const text = await res.text();
                
                const regex = /<h2 class="il-bist-kod">\s*([A-Z0-9]+)\s*<\/h2>/g;
                let match;
                let count = 0;
                while ((match = regex.exec(text)) !== null) {
                    const symbol = match[1].trim();
                    sectorMapping[symbol] = name;
                    count++;
                }
                
                if (count === 0) {
                    hasMore = false;
                } else {
                    page++;
                }
            }
        } catch (err) {
            console.error(`Error fetching ${code}:`, err);
        }
    }
    
    const output = `export const sectorMapping: Record<string, string> = ${JSON.stringify(sectorMapping, null, 4)};\n`;
    fs.writeFileSync('src/data/sectorMapping.ts', output);
    console.log(`Successfully mapped ${Object.keys(sectorMapping).length} stocks.`);
}

fetchSectors();
