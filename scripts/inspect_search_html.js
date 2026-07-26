const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function run() {
  const html = await fetchUrl("https://halkarz.com/?s=THYAO");
  console.log("Search HTML length:", html.length);
  const aRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  let count = 0;
  console.log("All links found in search for THYAO:\n");
  while ((match = aRegex.exec(html)) !== null && count < 15) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('halkarz.com') && href.length > 25 && !href.includes('/category/') && !href.includes('/bist-endeks/')) {
      count++;
      console.log(`[Link ${count}] ${text} -> ${href}`);
    }
  }
}

run();
