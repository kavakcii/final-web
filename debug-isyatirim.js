const fs = require('fs');

async function run() {
    try {
        console.log("Fetching IsYatirim MAC Page...");
        const res = await fetch('https://www.isyatirim.com.tr/tr-tr/analiz/fon/Sayfalar/Fon-Detay.aspx?FonKodu=MAC', {
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await res.text();
        console.log("Length:", text.length);
        
        fs.writeFileSync('isyatirim-dump.html', text);
        console.log("Saved to isyatirim-dump.html");

    } catch (error) {
        console.error("Error:", error);
    }
}

run();