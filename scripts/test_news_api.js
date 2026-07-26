const https = require('https');

function fetchGoogleNews(symbol) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${symbol} BIST hisse haber`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let xml = '';
      res.on('data', chunk => xml += chunk);
      res.on('end', () => {
        const items = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          items.push({
            title: match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
            link: match[2],
            pubDate: match[3],
            source: match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
          });
        }
        resolve(items);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  console.log("Fetching live news for ASELS...");
  const news = await fetchGoogleNews("ASELS");
  console.log(`Found ${news.length} news items for ASELS:`);
  console.log(news.slice(0, 5));
}

run();
