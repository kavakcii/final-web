async function run() {
    const urls = [
        'https://www.kap.org.tr/api/member-disclosure',
        'https://www.kap.org.tr/tr/api/member-disclosure',
        'https://www.kap.org.tr/en/api/member-disclosure',
        'https://www.kap.org.tr/api/export-member-disclosure',
        'https://www.kap.org.tr/tr/api/disclosures',
    ];

    for (const url of urls) {
        try {
            console.log(`Trying ${url}...`);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`Success! Length: ${text.length}`);
                if (text.length < 1000) console.log("Body:", text);
            }
        } catch (error) {
            console.log(`Error fetching ${url}:`, error.message);
        }
    }
}

run();