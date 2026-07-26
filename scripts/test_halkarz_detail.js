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
  console.log("Testing stock detail page fetch for ASELS...");
  const html = await fetchUrl("https://halkarz.com/aselsan-asels/");
  console.log("HTML length:", html.length);
  
  // Extract "Hakkında" section
  const match = html.match(/<h2[^>]*>(?:Şirket\s+)?Hakkında<\/h2>([\s\S]*?)(?:<h2|<div class="post-tags"|<footer)/i)
    || html.match(/<div class="entry-content[^"]*"[^>]*>([\s\S]*?)(?:<h2|<div class="post-tags"|<footer)/i);
    
  if (match) {
    const text = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("\n=== ASELSAN HAKKINDA TEXT ===");
    console.log(text.slice(0, 500));
  } else {
    console.log("Match not found directly, showing first 500 chars of entry-content:");
    const idx = html.indexOf('entry-content');
    if (idx !== -1) {
      console.log(html.slice(idx, idx + 1000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    }
  }
}

run();
