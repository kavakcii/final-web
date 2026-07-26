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
  console.log("Inspecting Halkarz XU500 stock page URLs...");
  const html = await fetchUrl("https://halkarz.com/bist-endeks/xu500/");
  
  // Find all stock links
  const linkRegex = /<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>(.*?)<\/a>/gi;
  let match;
  const stockLinks = [];
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (href.length > 20 && !href.includes('/bist-endeks/') && !href.includes('/category/') && !href.includes('/halka-arz-takvimi/')) {
      stockLinks.push({ text, href });
    }
  }

  console.log(`Found ${stockLinks.length} stock links on page 1:`);
  console.log(stockLinks.slice(0, 10));

  if (stockLinks.length > 0) {
    console.log("\nTesting detail page fetch for first link:", stockLinks[0].href);
    const detailHtml = await fetchUrl(stockLinks[0].href);
    console.log("Detail HTML length:", detailHtml.length);
    
    // Extract paragraphs or "Hakkında" section
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    let pCount = 0;
    while ((pMatch = pRegex.exec(detailHtml)) !== null && pCount < 5) {
      const cleanP = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (cleanP.length > 30) {
        pCount++;
        console.log(`\nParagraph ${pCount}:`, cleanP);
      }
    }
  }
}

run();
