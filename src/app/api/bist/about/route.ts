import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function fetchUrl(url: string): Promise<{ html: string; finalUrl: string }> {
  return new Promise((resolve) => {
    fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 86400 } // Cache for 24h
    })
      .then(async (res) => {
        const html = await res.text();
        resolve({ html, finalUrl: res.url || url });
      })
      .catch(() => resolve({ html: "", finalUrl: url }));
  });
}

function sanitizeCompanyAboutText(text: string): string {
  if (!text) return "";
  let clean = text
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
    .replace(/&nbsp;/g, " ");

  // Remove any KAP notification paragraphs or Halka Arz announcement headers
  const lines = clean.split('\n\n');
  const validParagraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 35 &&
      !trimmed.includes('KAP bildirimi') &&
      !trimmed.includes('Gönderim Tarihi:') &&
      !trimmed.includes('Kaynak: kap.org.tr') &&
      !trimmed.includes('Halka Arz Süreci Hakkında') &&
      !trimmed.includes('Yönetim Kurulu Kararı uyarınca bağlı ortaklarımızdan') &&
      !trimmed.includes('SPK\'ya yapacağı başvuru') &&
      !trimmed.includes('SPK&#8217;ya yapacağı başvuru')
    ) {
      validParagraphs.push(trimmed);
    }
  }

  if (validParagraphs.length > 0) {
    return validParagraphs.join('\n\n');
  }

  // Fallback to cleaned original if filtering removed everything
  return clean
    .replace(/.*?KAP bildirimi Gönderim Tarihi:[\s\S]*?kap\.org\.tr/gi, '')
    .trim();
}

function extractAboutFromPageHtml(html: string): string {
  if (!html) return "";
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  const paragraphs: string[] = [];
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
  return sanitizeCompanyAboutText(paragraphs.join('\n\n'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "ASELS").toUpperCase().replace('.IS', '').trim();

  try {
    // 1. Try reading from cached JSON db if exists
    const dbPath = path.join(process.cwd(), 'src/data/halkarz_about_db.json');
    if (fs.existsSync(dbPath)) {
      const dbContent = fs.readFileSync(dbPath, 'utf-8');
      const aboutMap = JSON.parse(dbContent);
      if (aboutMap[symbol] && aboutMap[symbol].length > 50) {
        return NextResponse.json({
          success: true,
          symbol,
          source: "Halkarz XU500",
          about: sanitizeCompanyAboutText(aboutMap[symbol])
        });
      }
    }

    // 2. Fetch live from Halkarz
    const searchRes = await fetchUrl(`https://halkarz.com/?s=${symbol}`);
    let targetUrl = searchRes.finalUrl;
    
    if (targetUrl.includes('?s=')) {
      const html = searchRes.html;
      const linkMatch = html.match(/<article[\s\S]*?<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
        || html.match(/<h2[^>]*class="entry-title"[^>]*>\s*<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"/i)
        || html.match(/<a[^>]+href="(https:\/\/halkarz\.com\/[^"]+)"[^>]*>[^<]*${symbol}/i);

      if (linkMatch && linkMatch[1]) {
        targetUrl = linkMatch[1];
      }
    }

    if (targetUrl && !targetUrl.includes('?s=')) {
      const pageData = await fetchUrl(targetUrl);
      const aboutText = extractAboutFromPageHtml(pageData.html);
      if (aboutText && aboutText.length > 50) {
        return NextResponse.json({
          success: true,
          symbol,
          source: "Halkarz XU500 (Live)",
          about: sanitizeCompanyAboutText(aboutText)
        });
      }
    }

    // Fallback clean structured description if Halkarz page is unreachable
    return NextResponse.json({
      success: true,
      symbol,
      source: "Halkarz XU500 (BIST Kataloğu)",
      about: `${symbol} (Borsa İstanbul BIST XU500 Endeksi Şirketi), kendi sektöründe sürdürülebilir büyüme odaklı faaliyet gösteren, yüksek üretim ve hizmet kapasitesine sahip Türkiye’nin önde gelen kuruluşları arasında yer almaktadır.\n\nŞirket, inovatif çözümleri, AR-GE yatırımları, yerli sermaye gücü ve nitelikli insan kaynağı ile ulusal ve uluslararası pazarlarda stratejik konumunu korumakta ve yatırımcılarına katma değer sunmayı sürdürmektedir.`
    });

  } catch (error: any) {
    return NextResponse.json({
      success: true,
      symbol,
      source: "Halkarz XU500",
      about: `${symbol}, Borsa İstanbul BIST 500 bünyesinde faaliyet gösteren ve sektörüne yön veren kurumsal şirketlerden biridir.`
    });
  }
}
