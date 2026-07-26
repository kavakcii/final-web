const https = require('https');
const fs = require('fs');
const path = require('path');

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

async function inspectTable() {
  console.log("Fetching table structure of https://halkarz.com/bist-endeks/xu500/...");
  const html = await fetchUrl("https://halkarz.com/bist-endeks/xu500/");
  
  // Extract table rows
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let count = 0;
  while ((match = trRegex.exec(html)) !== null && count < 10) {
    const trContent = match[1];
    if (trContent.includes('href=')) {
      count++;
      console.log(`\n--- ROW ${count} ---`);
      console.log(trContent.replace(/\s+/g, ' '));
    }
  }
}

inspectTable();
