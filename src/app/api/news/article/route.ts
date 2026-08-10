import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// In-memory summary cache (url -> summary)
const summaryCache = new Map<string, string>();

function decodeHtmlEntities(str: string): string {
    if (!str) return '';
    return str
        .replace(/&#8217;|&#39;|&apos;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;|&#8221;|&quot;/g, '"')
        .replace(/&#8230;/g, '...')
        .replace(/&#8211;|&#8212;/g, '-')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .trim();
}

// 2. Yedek: Akıcı Birleşik Paragraf NLP Sentezleyici
function nlpFallbackSummarize(title: string, paragraphs: string[], description?: string): string {
    const p1 = paragraphs[0] || description || title;
    const p2 = paragraphs[1] || '';
    
    let combined = p1;
    if (p2 && p2.length > 30 && !combined.includes(p2)) {
        combined += ` ${p2}`;
    }

    return decodeHtmlEntities(combined.trim());
}

// 1. Birincil: Gemini Flash Akıcı Paragraf Özeti
async function generateUnifiedSummary(title: string, paragraphs: string[], description?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return nlpFallbackSummarize(title, paragraphs, description);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sen FinAi Kıdemli Finans Editörüsün. Aşağıdaki haber metnini yatırımcıların tek bakışta anlayacağı, akıcı, tek parça ve net bir haber özeti paragrafı haline getir.
Maddeleme, başlık veya liste yapma. Doğrudan tek bir akıcı ve profesyonel Türkçe paragraf yaz.

Haber Başlığı: ${title}
Haber Metni:
${paragraphs.slice(0, 5).join('\n\n')}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text && text.length > 20) {
            return decodeHtmlEntities(text);
        }
        throw new Error("Empty response");
    } catch {
        return nlpFallbackSummarize(title, paragraphs, description);
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const fallbackDesc = searchParams.get('desc') || '';

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
        let rawTitle = $('h1').first().text().trim() || 
                       $('meta[property="og:title"]').attr('content') || 
                       $('title').text().trim() || "FinAi Ekonomi Masası Özel Haberi";

        const title = decodeHtmlEntities(rawTitle);
        const image = $('meta[property="og:image"]').attr('content') || $('article img').first().attr('src') || null;

        // 3. Ham Paragrafları ve Tabloları ayıkla
        let paragraphs: string[] = [];

        // Tablo satırlarını düzenle
        $('table').each((_, tbl) => {
            const rows: string[] = [];
            $(tbl).find('tr').each((_, tr) => {
                const cells = $(tr).find('th, td').map((_, cell) => $(cell).text().trim().replace(/\s+/g, ' ')).get().filter(Boolean);
                if (cells.length >= 2) {
                    rows.push(`• ${decodeHtmlEntities(cells.join(' : '))}`);
                } else if (cells.length === 1 && cells[0].length > 10) {
                    rows.push(`📌 ${decodeHtmlEntities(cells[0])}`);
                }
            });
            if (rows.length > 0) {
                paragraphs.push(...rows);
            }
        });

        // Paragrafları tara
        $('article p, main p, .content p, .news-detail p, .news-content p, .story-body p, p').each((_, el) => {
            let text = $(el).text().trim().replace(/\s+/g, ' ');
            text = decodeHtmlEntities(text);

            text = text
                .replace(/isimli makale.*?tarafından hazırlanmış.*?yayınlanmıştır\.?/gi, '')
                .replace(/Haberin devamı için tıklayınız\.?/gi, '')
                .trim();

            if (text.length > 35 && !text.toLowerCase().includes('çerez') && !text.toLowerCase().includes('abone') && !text.toLowerCase().includes('tıklayın') && !paragraphs.includes(text)) {
                paragraphs.push(text);
            }
        });

        // Eğer hala çok kısaysa meta description fallback
        if (paragraphs.length === 0) {
            const metaDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || fallbackDesc;
            if (metaDesc) {
                paragraphs.push(decodeHtmlEntities(metaDesc));
            } else {
                paragraphs.push("Bu haberin ayrıntıları FinAi masası tarafından hazırlanmaktadır.");
            }
        }

        // 4. Akıcı Birleşik Haber Özeti (Cache Destekli)
        let unifiedSummary = summaryCache.get(url);
        if (!unifiedSummary) {
            unifiedSummary = await generateUnifiedSummary(title, paragraphs, fallbackDesc);
            summaryCache.set(url, unifiedSummary);
        }

        return NextResponse.json({
            success: true,
            data: {
                title,
                image,
                paragraphs,
                summary: unifiedSummary,
                sourceUrl: url
            }
        });

    } catch (error: any) {
        console.error("Article Scraper Error:", error);
        return NextResponse.json({ success: false, error: "Haber içeriği yüklenemedi." }, { status: 500 });
    }
}
