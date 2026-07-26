const https = require('https');

function fetchRss(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function run() {
  console.log("Testing direct Investing.com / KAP news RSS...");
  const rssData = await fetchRss("https://tr.investing.com/rss/news_25.rss");
  console.log("Data length:", rssData.length);
  const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<description>([\s\S]*?)<\/description>/g;
  let match;
  let count = 0;
  while ((match = itemRegex.exec(rssData)) !== null && count < 5) {
    count++;
    console.log(`\n--- ITEM ${count} ---`);
    console.log("Title:", match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'));
    console.log("Description:", match[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim());
  }
}

run();
