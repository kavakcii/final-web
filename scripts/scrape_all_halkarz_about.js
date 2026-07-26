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
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, finalUrl: res.headers.location || url }));
    }).on('error', () => resolve({ html: '', finalUrl: '' }));
  });
}

function extractAboutFromPageHtml(html) {
  if (!html) return "";
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  const paragraphs = [];
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (
      text.length > 50 && 
      !text.includes('SORUMLULUK REDDİ') && 
      !text.includes('YASAL UYARI') && 
      !text.includes('Topluluğumuzda sağlıklı') && 
      !text.includes('Yorum yapmak için') &&
      !text.includes('Halka arz takvimi') &&
      !text.includes('Telif hakları')
    ) {
      paragraphs.push(text);
    }
  }
  return paragraphs.join('\n\n');
}

async function scrapeHalkarzAboutForSymbol(symbol) {
  const searchRes = await fetchUrl(`https://halkarz.com/?s=${symbol}`);
  let targetUrl = searchRes.finalUrl;
  
  if (targetUrl.includes('?s=')) {
    const linkMatch = searchRes.html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>(?:[^<]*${symbol}[^<]*)<\/a>/i)
      || searchRes.html.match(/<h2[^>]*class="entry-title"[^>]*><a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i);
    if (linkMatch && linkMatch[1]) {
      targetUrl = linkMatch[1];
    }
  }

  if (targetUrl && !targetUrl.includes('?s=')) {
    const pageData = await fetchUrl(targetUrl);
    const about = extractAboutFromPageHtml(pageData.html);
    if (about && about.length > 50) {
      return about;
    }
  }
  return "";
}

async function runBatch() {
  console.log("Starting Halkarz 'Şirket Hakkında' scraping batch...");
  
  const sampleSymbols = [
    "ASELS", "THYAO", "EREGL", "TUPRS", "KCHOL", "SAHOL", "GARAN", "AKBNK", "ISCTR", "YKBNK",
    "BIMAS", "MGROS", "SOKM", "SISE", "FROTO", "TOASO", "TTRAK", "TCELL", "TTKOM", "SASA",
    "HEKTS", "ASTOR", "MIATK", "PGSUS", "BIGEN", "EFOR", "DAPGM", "TRHOL", "EDIP", "ATLAS",
    "AKSEN", "KLNMA", "TUREX", "VESTL", "VESBE", "PETKM", "ALARK", "ARCLK", "EKGYO", "KOZAL"
  ];

  const dbPath = path.join(__dirname, '../src/data/halkarz_about_db.json');
  let aboutMap = {};
  if (fs.existsSync(dbPath)) {
    try {
      aboutMap = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {}
  }

  for (let i = 0; i < sampleSymbols.length; i++) {
    const sym = sampleSymbols[i];
    if (aboutMap[sym] && aboutMap[sym].length > 80) {
      console.log(`[${i + 1}/${sampleSymbols.length}] ${sym} already cached.`);
      continue;
    }

    console.log(`[${i + 1}/${sampleSymbols.length}] Fetching about text for ${sym}...`);
    const aboutText = await scrapeHalkarzAboutForSymbol(sym);
    if (aboutText) {
      aboutMap[sym] = aboutText;
      console.log(` -> Found ${aboutText.length} chars for ${sym}`);
    } else {
      console.log(` -> No about text found for ${sym}`);
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 400));
  }

  // Ensure src/data directory exists
  const dir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dbPath, JSON.stringify(aboutMap, null, 2), 'utf-8');
  console.log(`Saved ${Object.keys(aboutMap).length} company about descriptions to ${dbPath}`);
}

runBatch();
