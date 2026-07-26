const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, finalUrl: res.headers.location || url }));
    }).on('error', () => resolve({ html: '', finalUrl: '' }));
  });
}

async function getStockUrl(symbol) {
  const searchRes = await fetchUrl(`https://halkarz.com/?s=${symbol}`);
  if (searchRes.finalUrl && !searchRes.finalUrl.includes('?s=')) {
    return searchRes.finalUrl;
  }
  
  // Find first article title link
  const linkMatch = searchRes.html.match(/<h2[^>]*class="entry-title"[^>]*>\s*<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
    || searchRes.html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>[^<]*${symbol}/i);
    
  if (linkMatch && linkMatch[1]) {
    return linkMatch[1];
  }
  return null;
}

async function testSymbols() {
  const symbols = ["THYAO", "EREGL", "TUPRS", "KCHOL", "MIATK", "ASTOR", "BIGEN"];
  for (const sym of symbols) {
    const url = await getStockUrl(sym);
    console.log(`${sym} -> ${url}`);
  }
}

testSymbols();
