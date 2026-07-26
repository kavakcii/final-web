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

async function getStockDetailUrl(symbol) {
  const searchRes = await fetchUrl(`https://halkarz.com/?s=${symbol}`);
  if (searchRes.finalUrl && !searchRes.finalUrl.includes('?s=')) {
    return searchRes.finalUrl;
  }

  const html = searchRes.html;
  // Match first post link inside search results
  const linkMatch = html.match(/<article[\s\S]*?<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
    || html.match(/<h2[^>]*class="entry-title"[^>]*>\s*<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
    || html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>[^<]*${symbol}/i);

  if (linkMatch && linkMatch[1]) {
    return linkMatch[1];
  }
  return null;
}

async function scrapeHalkarzAboutForSymbol(symbol) {
  const targetUrl = await getStockDetailUrl(symbol);
  if (targetUrl && !targetUrl.includes('?s=')) {
    const pageData = await fetchUrl(targetUrl);
    const about = extractAboutFromPageHtml(pageData.html);
    if (about && about.length > 50) {
      return about;
    }
  }
  return "";
}

async function runScraper() {
  console.log("Starting Halkarz 'Şirket Hakkında' complete scraper...");
  
  const symbols = [
    "ASELS", "THYAO", "EREGL", "TUPRS", "KCHOL", "SAHOL", "GARAN", "AKBNK", "ISCTR", "YKBNK",
    "BIMAS", "MGROS", "SOKM", "SISE", "FROTO", "TOASO", "TTRAK", "TCELL", "TTKOM", "SASA",
    "HEKTS", "ASTOR", "MIATK", "PGSUS", "BIGEN", "EFOR", "DAPGM", "TRHOL", "EDIP", "ATLAS",
    "AKSEN", "KLNMA", "TUREX", "VESTL", "VESBE", "PETKM", "ALARK", "ARCLK", "EKGYO", "KOZAL",
    "TAVHL", "DOAS", "SOKE", "ENKAI", "GUBRF", "ISGYO", "ODAS", "KONTR", "EUPWR", "ALFAS"
  ];

  const dbPath = path.join(__dirname, '../src/data/halkarz_about_db.json');
  let aboutMap = {};
  if (fs.existsSync(dbPath)) {
    try {
      aboutMap = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {}
  }

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    if (aboutMap[sym] && aboutMap[sym].length > 80) {
      console.log(`[${i + 1}/${symbols.length}] ${sym} already cached (${aboutMap[sym].length} chars).`);
      continue;
    }

    console.log(`[${i + 1}/${symbols.length}] Scraping about text for ${sym}...`);
    const aboutText = await scrapeHalkarzAboutForSymbol(sym);
    if (aboutText) {
      aboutMap[sym] = aboutText;
      console.log(` -> SUCCESS: ${sym} (${aboutText.length} chars)`);
    } else {
      console.log(` -> NO ABOUT TEXT: ${sym}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  const dir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dbPath, JSON.stringify(aboutMap, null, 2), 'utf-8');
  console.log(`\nFinished! Saved ${Object.keys(aboutMap).length} company about descriptions to ${dbPath}`);
}

runScraper();
