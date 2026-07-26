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

function extractPureCompanyAboutSection(html) {
  if (!html) return "";

  // 1. Look specifically for "Hakkında" or "Şirket Hakkında" heading section
  const headingMatch = html.match(/<h[23][^>]*>(?:Şirket\s+)?Hakkında<\/h[23]>([\s\S]*?)(?:<h[23]|<div class="post-tags"|<footer)/i);
  let contentArea = headingMatch ? headingMatch[1] : html;

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  const paragraphs = [];

  while ((pMatch = pRegex.exec(contentArea)) !== null) {
    const text = pMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "-")
      .replace(/&#8212;/g, "—")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, ' ')
      .trim();

    if (
      text.length > 35 && 
      !text.includes('KAP bildirimi') && 
      !text.includes('Gönderim Tarihi:') &&
      !text.includes('Kaynak: kap.org.tr') &&
      !text.includes('Halka Arz Süreci Hakkında') &&
      !text.includes('Yönetim Kurulu Kararı uyarınca bağlı ortaklarımızdan') &&
      !text.includes('SORUMLULUK REDDİ') && 
      !text.includes('YASAL UYARI') && 
      !text.includes('Topluluğumuzda sağlıklı') && 
      !text.includes('Yorum yapmak için') &&
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
  const linkMatch = html.match(/<article[\s\S]*?<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
    || html.match(/<h2[^>]*class="entry-title"[^>]*>\s*<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
    || html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>[^<]*${symbol}/i);

  if (linkMatch && linkMatch[1]) {
    return linkMatch[1];
  }
  return null;
}

async function run() {
  console.log("Building 0ms Instant Local Halkarz About Database...");

  const dbPath = path.join(__dirname, '../src/data/halkarz_about_db.json');
  let aboutMap = {};
  if (fs.existsSync(dbPath)) {
    try {
      aboutMap = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {}
  }

  const symbols = [
    "ASELS", "THYAO", "EREGL", "TUPRS", "KCHOL", "SAHOL", "GARAN", "AKBNK", "ISCTR", "YKBNK",
    "BIMAS", "MGROS", "SOKM", "SISE", "FROTO", "TOASO", "TTRAK", "TCELL", "TTKOM", "SASA",
    "HEKTS", "ASTOR", "MIATK", "PGSUS", "BIGEN", "TKFEN", "EFOR", "DAPGM", "TRHOL", "EDIP",
    "ATLAS", "AKSEN", "KLNMA", "TUREX", "VESTL", "VESBE", "PETKM", "ALARK", "ARCLK", "EKGYO",
    "KOZAL", "TAVHL", "DOAS", "SOKE", "ENKAI", "GUBRF", "ISGYO", "ODAS", "KONTR", "EUPWR", "ALFAS"
  ];

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    console.log(`[${i + 1}/${symbols.length}] Processing ${sym}...`);
    const targetUrl = await getStockDetailUrl(sym);

    if (targetUrl) {
      const page = await fetchUrl(targetUrl);
      const pureAbout = extractPureCompanyAboutSection(page.html);
      if (pureAbout && pureAbout.length > 50) {
        aboutMap[sym] = pureAbout;
        console.log(`  -> Pure 'Şirket Hakkında' extracted for ${sym} (${pureAbout.length} chars)`);
      } else {
        console.log(`  -> Fallback text for ${sym}`);
      }
    }

    await new Promise(r => setTimeout(r, 400));
  }

  const dir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dbPath, JSON.stringify(aboutMap, null, 2), 'utf-8');
  console.log(`\nSuccessfully built local database at ${dbPath} with ${Object.keys(aboutMap).length} entries!`);
}

run();
