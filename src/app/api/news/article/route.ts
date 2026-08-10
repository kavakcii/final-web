import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export interface StructuredSummary {
    mainEvent: string;
    keyData: string;
    strategicImpact: string;
}

// In-memory summary cache (url -> summary)
const summaryCache = new Map<string, StructuredSummary>();

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

// 2. Yedek: Kural Tabanlı Finansal NLP Sentezleyici (Sıfır Maliyet, Anlık & Kesintisiz)
function nlpFallbackSummarize(title: string, paragraphs: string[], description?: string): StructuredSummary {
    const firstP = paragraphs[0] || description || title;
    const mainEvent = firstP.length > 200 ? firstP.slice(0, 195) + '...' : firstP;

    // Rakam, tutar, oran içeren en güçlü cümleyi bul
    let keyData = '';
    const numberSentences = paragraphs.flatMap(p => p.split(/(?<=[.!?])\s+/)).filter(s => 
        /\b(?:\d+[\.,]?\d*|\d+)\s*(?:milyon|milyar|bin|dolar|tl|lira|euro|btc|yüzde|%|puan|baz)/i.test(s)
    );
    if (numberSentences.length > 0 && numberSentences[0] !== firstP) {
        keyData = numberSentences[0].trim();
    } else {
        keyData = `${title} gelişmesi kapsamında ilgili tutarlar, fiyat seviyeleri ve işlem hacimleri yakından izlenmektedir.`;
    }

    // Stratejik etkiyi son paragraftan veya analizden çıkar
    const lastP = paragraphs[paragraphs.length - 1] || '';
    let strategicImpact = '';
    if (lastP && lastP !== firstP && lastP.length > 30) {
        strategicImpact = lastP.length > 180 ? lastP.slice(0, 175) + '...' : lastP;
    } else {
        strategicImpact = 'Bu gelişme ilgili sektör, şirket bilançoları ve piyasa dengesi açısından stratejik önem taşımaktadır.';
    }

    return {
        mainEvent: decodeHtmlEntities(mainEvent),
        keyData: decodeHtmlEntities(keyData.length > 200 ? keyData.slice(0, 195) + '...' : keyData),
        strategicImpact: decodeHtmlEntities(strategicImpact)
    };
}

// 1. Birincil: Gemini Flash Hibrit Özet Motoru
async function generateStructuredSummary(title: string, paragraphs: string[], description?: string): Promise<StructuredSummary> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return nlpFallbackSummarize(title, paragraphs, description);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Sen FinAi Kıdemli Finans Editörüsün. Aşağıdaki haber metnini yatırımcılar için 3 maddelik zengin ve profesyonel bir yönetici özeti haline getir.
SADECE aşağıdaki JSON formatında geçerli bir JSON döndür, başka hiçbir şey yazma:
{
  "mainEvent": "Haberin 1-2 cümlelik en temel ana gelişmesi",
  "keyData": "Haberdeki kritik rakamlar, parasal tutar, oran veya sayısal boyut",
  "strategicImpact": "Bu hamlenin/gelişmenin piyasaya veya şirkete nihai stratejik etkisi"
}

Haber Başlığı: ${title}
Haber Metni:
${paragraphs.slice(0, 6).join('\n\n')}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.mainEvent && parsed.keyData && parsed.strategicImpact) {
                return {
                    mainEvent: decodeHtmlEntities(parsed.mainEvent),
                    keyData: decodeHtmlEntities(parsed.keyData),
                    strategicImpact: decodeHtmlEntities(parsed.strategicImpact)
                };
            }
        }
        throw new Error("Invalid format");
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

        // 4. Hibrit Yapılandırılmış Özet Üretimi (Gemini Flash + NLP Fallback + Cache)
        let structuredSummary = summaryCache.get(url);
        if (!structuredSummary) {
            structuredSummary = await generateStructuredSummary(title, paragraphs, fallbackDesc);
            summaryCache.set(url, structuredSummary);
        }

        return NextResponse.json({
            success: true,
            data: {
                title,
                image,
                paragraphs,
                structuredSummary,
                sourceUrl: url
            }
        });

    } catch (error: any) {
        console.error("Article Scraper Error:", error);
        return NextResponse.json({ success: false, error: "Haber içeriği yüklenemedi." }, { status: 500 });
    }
}
