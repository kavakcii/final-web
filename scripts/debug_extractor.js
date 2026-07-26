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

async function debugAsels() {
  const pageData = await fetchUrl("https://halkarz.com/aselsan-elektronik-san-ve-tic-a-s/");
  const html = pageData.html;
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Length:", text.length);
    console.log("Includes SORUMLULUK:", text.includes('SORUMLULUK REDDİ'));
    console.log("Includes YASAL:", text.includes('YASAL UYARI'));
    console.log("Includes Topluluğumuzda:", text.includes('Topluluğumuzda sağlıklı'));
    console.log("Text sample:", text.slice(0, 100));
    console.log("-----------------------------------------");
  }
}

debugAsels();
