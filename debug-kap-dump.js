const fs = require('fs');

async function run() {
    try {
        console.log("Fetching KAP Companies Page...");
        const res = await fetch('https://www.kap.org.tr/tr/bist-sirketler', {
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await res.text();
        console.log("Length:", text.length);
        
        // Save to file for inspection
        fs.writeFileSync('kap-dump.html', text);
        console.log("Saved to kap-dump.html");

        // Try to find JSON inside
        const match = text.match(/member-disclosure/);
        console.log("Has member-disclosure:", !!match);

    } catch (error) {
        console.error("Error:", error);
    }
}

run();