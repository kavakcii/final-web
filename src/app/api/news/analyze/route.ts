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
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Gereksiz öğeleri agresif bir şekilde temizle
    $('script, style, nav, footer, header, ads, iframe, .ads, .social-share, .sidebar, .comments, .related-news, aside').remove();

    // Başlık Bulucu
    const title = $('h1').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('title').text().trim();

    // İçerik Bulucu - Haber sitelerinin en yaygın kullandığı kapsayıcılar
    const articleSelectors = [
      'article', 
      '[itemprop="articleBody"]', 
      '.article-body', 
      '.news-content', 
      '.detail-content', 
      '.content-text',
      '#article-body',
      '.entry-content',
      '.post-content',
      '.news-detail',
      '.story-body',
      'main'
    ];

    let contentParts: string[] = [];
    
    // Önce özel kapsayıcılar içinde paragrafları ara
    for (const selector of articleSelectors) {
      const container = $(selector);
      if (container.length > 0) {
        const parts = container.find('p').map((_, el) => $(el).text().trim()).get();
        if (parts.length > 2) {
          contentParts = parts;
          break;
        }
      }
    }

    // Eğer kapsayıcı bulunamadıysa doğrudan tüm p'leri al ama filtrele
    if (contentParts.length === 0) {
      contentParts = $('p').map((_, el) => $(el).text().trim()).get();
    }

    // Temizle ve Filtrele
    let cleanContent = contentParts
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 40) // Kısa satırları at
      .filter(p => !p.includes('tıklayın') && !p.includes('abone olun')) // Reklamımsı cümleleri at
      .join('\n\n');

    // Eğer hala metin yoksa (Bazı siteler metni div içinde tutar)
    if (cleanContent.length < 200) {
      cleanContent = $('div').map((_, el) => {
        const text = $(el).children().length === 0 ? $(el).text().trim() : '';
        return text;
      }).get().filter(t => t.length > 100).join('\n\n');
    }

    // Son Yedek: Meta Description
    if (cleanContent.length < 100) {
      cleanContent = $('meta[property="og:description"]').attr('content') || 
                     $('meta[name="description"]').attr('content') || 
                     "Haber içeriği bu kaynaktan çekilemedi. Lütfen orijinal kaynağı ziyaret edin.";
    }

    return NextResponse.json({ 
      success: true, 
      content: {
        title: title,
        body: cleanContent.slice(0, 10000), // Çok uzun metinleri sınırla
        sourceUrl: url
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ success: false, error: "Haber içeriği şu an teknik olarak çekilemiyor." }, { status: 500 });
  }
}
