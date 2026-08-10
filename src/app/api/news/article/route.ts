import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ success: false, error: "URL parametresi gereklidir." }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error("Kaynak sayfaya ulaşılamadı.");

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Reklam, menü ve gereksiz etiketleri kaldır
        $('script, style, iframe, nav, footer, header, aside, form, .ads, .sidebar, .comments, .social-share, .related, .tags, .author-info, [role="navigation"], [role="banner"]').remove();

        // 2. Başlık ve görsel
        const title = $('h1').first().text().trim() || 
                      $('meta[property="og:title"]').attr('content') || 
                      $('title').text().trim() || "FinAi Ekonomi Masası Özel Haberi";

        const image = $('meta[property="og:image"]').attr('content') || $('article img').first().attr('src') || null;

        // 3. Ham Paragrafları ayıkla
        let paragraphs: string[] = [];

        // Önce ana içerik alanını bul
        const contentContainers = $('article, main, .content, .news-detail, .news-content, .story-body, .article-body, #content');
        if (contentContainers.length > 0) {
            contentContainers.find('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 45 && !text.toLowerCase().includes('çerez') && !text.toLowerCase().includes('abone')) {
                    paragraphs.push(text);
                }
            });
        }

        // Eğer bulunamadıysa tüm p etiketlerini tara
        if (paragraphs.length === 0) {
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 45 && !text.toLowerCase().includes('çerez') && !text.toLowerCase().includes('abone') && !text.toLowerCase().includes('tıklayın')) {
                    paragraphs.push(text);
                }
            });
        }

        // Eğer hala çok kısaysa meta description fallback
        if (paragraphs.length === 0) {
            const metaDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
            if (metaDesc) {
                paragraphs.push(metaDesc);
            } else {
                paragraphs.push("Bu haberin metni hazırlanmaktadır. Ayrıntılar için kaynak bağlantısını ziyaret edebilirsiniz.");
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                title,
                image,
                paragraphs,
                sourceUrl: url
            }
        });

    } catch (error: any) {
        console.error("Article Scraper Error:", error);
        return NextResponse.json({ success: false, error: "Haber içeriği yüklenemedi." }, { status: 500 });
    }
}
