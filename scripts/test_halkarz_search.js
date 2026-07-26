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

async function run() {
  console.log("Searching Halkarz for ASELS...");
  const searchRes = await fetchUrl("https://halkarz.com/?s=ASELS");
  console.log("Final URL:", searchRes.finalUrl);
  
  // Extract link from search results if not redirected
  const linkMatch = searchRes.html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>(?:[^<]*ASELS[^<]*)<\/a>/i)
    || searchRes.html.match(/<h2[^>]*class="entry-title"[^>]*><a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i);
    
  let targetUrl = searchRes.finalUrl;
  if (linkMatch && linkMatch[1]) {
    targetUrl = linkMatch[1];
  }

  console.log("Target stock URL:", targetUrl);
  const stockPage = await fetchUrl(targetUrl);
  
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  let count = 0;
  console.log(`\nParagraphs from ${targetUrl}:\n`);
  while ((pMatch = pRegex.exec(stockPage.html)) !== null && count < 10) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (text.length > 40 && !text.includes('SORUMLULUK REDDİ') && !text.includes('YASAL UYARI')) {
      count++;
      console.log(`[Paragraph ${count}] ${text}\n`);
    }
  }
}

run();
