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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch news content");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Gereksiz öğeleri temizle
    $('script, style, nav, footer, header, ads, iframe, .ads, .social-share').remove();

    // Başlığı al
    const title = $('h1').first().text().trim();

    // İçeriği al (En temiz metni bulmaya çalış)
    let contentParts: string[] = [];
    
    // Yaygın haber metni kapsayıcılarını dene
    const selectors = ['article p', '.content p', '.news-content p', 'main p', '.entry-content p', 'body p'];
    
    for (const selector of selectors) {
      const parts = $(selector).map((_, el) => $(el).text().trim()).get();
      if (parts.length > 3) { // Eğer yeterince paragraf bulduysa bunu kullan
        contentParts = parts;
        break;
      }
    }

    // Eğer hiçbir seçici işe yaramadıysa tüm body p'leri al
    if (contentParts.length === 0) {
      contentParts = $('p').map((_, el) => $(el).text().trim()).get();
    }

    // Çok kısa olan veya tekrar eden kısımları temizle
    const cleanContent = contentParts
      .filter(p => p.length > 40) // Çok kısa (etiket, tarih vs.) satırları at
      .join('\n\n');

    return NextResponse.json({ 
      success: true, 
      content: {
        title: title,
        body: cleanContent,
        sourceUrl: url
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ success: false, error: "Haber içeriği çekilemedi." }, { status: 500 });
  }
}
