import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error("Fetch failed");

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. ADIM: Sayfayı temizle (Gürültüleri at)
    $('script, style, iframe, nav, footer, header, aside, form, .ads, .sidebar, .comments, .social-share, .related, .tags, .author-info').remove();

    // 2. ADIM: Başlığı Kesinleştir
    const title = $('h1').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('title').text().trim();

    // 3. ADIM: Readability Algoritması (Metin Yoğunluğu Analizi)
    let bestElement: cheerio.Cheerio<cheerio.Element> | null = null;
    let maxScore = 0;

    // Tüm kapsayıcıları tara
    $('div, article, section, main').each((_, el) => {
      const element = $(el);
      const text = element.clone().children().remove().end().text().trim(); // Sadece direkt metin
      const paragraphCount = element.find('p').length;
      const linkCount = element.find('a').length;
      
      // Puanlama: Paragraf sayısı yüksek, link sayısı düşük olan bölge asıl haberdir
      const score = (paragraphCount * 20) + (text.length / 10) - (linkCount * 10);

      if (score > maxScore) {
        maxScore = score;
        bestElement = element;
      }
    });

    let finalBody = "";

    if (bestElement && maxScore > 100) {
      // En iyi adayı bulduk, içindeki paragrafları al
      finalBody = (bestElement as any).find('p, div.text, div.content').map((_: any, el: any) => $(el).text().trim()).get()
        .filter((p: string) => p.length > 50)
        .join('\n\n');
    }

    // 4. ADIM: Eğer Readability başarısızsa (SPA veya farklı yapı) LD+JSON dene
    if (finalBody.length < 300) {
      const ldJson = $('script[type="application/ld+json"]');
      ldJson.each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          const articleBody = data.articleBody || data.description;
          if (articleBody && articleBody.length > finalBody.length) {
            finalBody = articleBody;
          }
        } catch (e) {}
      });
    }

    // 5. ADIM: Son Çare - Tüm P'leri akıllıca topla
    if (finalBody.length < 300) {
      finalBody = $('p').map((_, el) => $(el).text().trim()).get()
        .filter(p => p.length > 60 && !p.includes('cookie') && !p.includes('tıklayın'))
        .join('\n\n');
    }

    // Temizlik
    finalBody = finalBody
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Eğer hala boşsa meta fallback
    if (finalBody.length < 100) {
      finalBody = $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || 
                   "Haber metni bu kaynaktan teknik olarak çekilemedi. Lütfen orijinal linki ziyaret edin.";
    }

    return NextResponse.json({ 
      success: true, 
      content: {
        title: title,
        body: finalBody.slice(0, 15000),
        sourceUrl: url
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Teknik bir hata oluştu." }, { status: 500 });
  }
}
