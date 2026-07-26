const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchHalkarzStockAbout(symbol) {
  return new Promise((resolve) => {
    const slug = symbol.toLowerCase();
    const url = `https://halkarz.com/${slug}/`;
    
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHalkarzStockAboutByUrl(res.headers.location).then(resolve);
      }
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        const about = extractAboutText(html);
        resolve(about);
      });
    }).on('error', () => resolve(''));
  });
}

function fetchHalkarzStockAboutByUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    }, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        resolve(extractAboutText(html));
      });
    }).on('error', () => resolve(''));
  });
}

function extractAboutText(html) {
  if (!html) return "";
  
  // Look for "Hakkında" or "Şirket Hakkında" or content paragraphs
  const match = html.match(/<h2[^>]*>(?:Şirket\s+)?Hakkında<\/h2>([\s\S]*?)(?:<h2|<div class="post-tags"|<footer)/i) 
    || html.match(/class="entry-content[^"]*"[^>]*>([\s\S]*?)(?:<h2|<footer)/i);
    
  if (match) {
    const contentHtml = match[1];
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(contentHtml)) !== null) {
      const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
      if (text.length > 20 && !text.includes('Halka Arz') && !text.includes('BIST kodu')) {
        paragraphs.push(text);
      }
    }
    if (paragraphs.length > 0) {
      return paragraphs.join('\n\n');
    }
    // Fallback text extraction
    const cleanText = contentHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return cleanText;
  }
  return "";
}

async function testSampleStocks() {
  console.log("Testing Halkarz 'Şirket Hakkında' extraction...");
  const sampleSymbols = ["ASELS", "THYAO", "MIATK", "ASTOR", "BIGEN"];
  for (const sym of sampleSymbols) {
    const about = await fetchHalkarzStockAbout(sym);
    console.log(`\n=== ${sym} ŞİRKET HAKKINDA ===`);
    console.log(about.slice(0, 300) || "Henüz bilgi çekilemedi.");
  }
}

testSampleStocks();
