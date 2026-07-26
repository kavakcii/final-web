const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve);
      }
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve(html));
    }).on('error', () => resolve(''));
  });
}

function extractTextFromHtml(html) {
  if (!html) return "";
  // Strip script, style, nav, footer tags
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(cleanHtml)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();
    if (text.length > 40 && !text.includes('Cookie') && !text.includes('Telif') && !text.includes('Gizlilik')) {
      paragraphs.push(text);
    }
  }
  return paragraphs.join('\n\n');
}

async function run() {
  console.log("Testing full article extraction for Investing / News URL...");
  const rssUrl = "https://news.google.com/rss/search?q=ASELS+hisse+haber&hl=tr&gl=TR&ceid=TR:tr";
  const xml = await fetchUrl(rssUrl);
  
  const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
  const match = itemRegex.exec(xml);
  if (match) {
    console.log("Title:", match[1]);
    console.log("Link:", match[2]);
    const pageHtml = await fetchUrl(match[2]);
    const articleBody = extractTextFromHtml(pageHtml);
    console.log("\n--- EXTRACTED FULL ARTICLE BODY ---");
    console.log(articleBody.slice(0, 800) || "No paragraph text found.");
  }
}

run();
