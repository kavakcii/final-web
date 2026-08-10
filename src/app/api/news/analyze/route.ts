import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error("Kaynak sayfaya ulaşılamadı.");

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Sayfayı temizle (Gürültü ve reklamları kaldır)
    $('script, style, iframe, nav, footer, header, aside, form, .ads, .sidebar, .comments, .social-share, .related, .tags, .author-info, [role="navigation"], [role="banner"]').remove();

    // 2. Başlığı al
    const title = $('h1').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('title').text().trim() || "Finansal Gelişme";

    // 3. Readability & Paragraf Çıkarıcı
    let bestElement: any = null;
    let maxScore = 0;

    $('article, main, section, div').each((_, el) => {
      const element = $(el);
      const text = element.clone().children().remove().end().text().trim();
      const paragraphCount = element.find('p').length;
      const linkCount = element.find('a').length;
      
      const score = (paragraphCount * 25) + (text.length / 10) - (linkCount * 8);

      if (score > maxScore) {
        maxScore = score;
        bestElement = element;
      }
    });

    let finalBody = "";

    if (bestElement && maxScore > 60) {
      finalBody = (bestElement as any).find('p, div.text, div.content').map((_: any, el: any) => $(el).text().trim()).get()
        .filter((p: string) => p.length > 45 && !p.toLowerCase().includes('abone ol') && !p.toLowerCase().includes('çerez'))
        .join('\n\n');
    }

    if (finalBody.length < 250) {
      finalBody = $('p').map((_, el) => $(el).text().trim()).get()
        .filter(p => p.length > 50 && !p.includes('cookie') && !p.includes('tıklayın'))
        .join('\n\n');
    }

    // Temizle
    finalBody = finalBody
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (finalBody.length < 80) {
      finalBody = $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || 
                   "Haber metni bu kaynaktan teknik olarak ayıklanamadı. Lütfen orijinal linki ziyaret edin.";
    }

    // 4. AI Zenginleştirmesi (Gemini AI ile Hap Yönetici Özeti & Piyasa Etkisi)
    let aiKeyPoints: string[] = [];
    let aiMarketImpact: string = "";

    if (genAI && finalBody.length > 100) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
        Sen kıdemli bir Finansal Stratejistsin.
        Aşağıdaki haber metnini oku ve yatırımcılar için hap bilgi çıkar:
        
        BAŞLIK: ${title}
        METİN: ${finalBody.slice(0, 4000)}
        
        Lütfen SADECE aşağıdaki JSON formatında yanıt ver:
        {
          "keyPoints": [
            "Haberin en kritik 1. somut maddesi",
            "Haberin en kritik 2. somut maddesi",
            "Haberin en kritik 3. somut maddesi"
          ],
          "marketImpact": "Bu gelişmenin Borsa İstanbul, Dolar/TL, Altın veya ilgili hisseler üzerindeki doğrudan olası etkisi (1-2 cümle)."
        }
        `;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();
        const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.keyPoints) aiKeyPoints = parsed.keyPoints;
        if (parsed.marketImpact) aiMarketImpact = parsed.marketImpact;
      } catch (aiErr) {
        console.warn("AI Smart Reader Error:", aiErr);
      }
    }

    // Fallback if AI not available
    if (aiKeyPoints.length === 0) {
      const paragraphs = finalBody.split('\n\n').filter(p => p.length > 40);
      aiKeyPoints = paragraphs.slice(0, 3).map(p => p.slice(0, 160) + '...');
      aiMarketImpact = "Bu gelişme sektör dinamikleri ve piyasa fiyatlamaları açısından takip edilmektedir.";
    }

    return NextResponse.json({ 
      success: true, 
      content: {
        title,
        body: finalBody.slice(0, 15000),
        sourceUrl: url,
        keyPoints: aiKeyPoints,
        marketImpact: aiMarketImpact
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Haber içeriği yüklenirken teknik bir sorun oluştu." }, { status: 500 });
  }
}
