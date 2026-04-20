import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ success: false, error: 'AI not configured' }, { status: 500 });
    }

    // 1. Fetch the content with a more realistic User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, footer, header, ads, .ads, #ads, iframe, .social-share').remove();

    // 2. SMART EXTRACTION
    // Try multiple selectors for the main content
    let content = '';
    
    // Check for Meta Description first (reliable backup)
    const metaDesc = $('meta[property="og:description"]').attr('content') || 
                     $('meta[name="description"]').attr('content');

    // Try finding the main article body
    const articleSelectors = [
      'article', 
      '.article-content', 
      '.story-body', 
      '.post-content', 
      '.news-detail', 
      'main', 
      '.content'
    ];

    for (const selector of articleSelectors) {
      const text = $(selector).text().trim();
      if (text.length > content.length) {
        content = text;
      }
    }

    // If still empty or too short, use meta description
    if (content.length < 200 && metaDesc) {
      content = metaDesc;
    }

    // Final cleanup
    content = content.replace(/\s+/g, ' ').trim().slice(0, 5000);

    if (content.length < 50) {
      throw new Error("Content is too short to analyze");
    }

    // 3. Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
    Aşağıdaki haber metnini bir finansal analist gözüyle oku ve derinlemesine analiz et.
    Eğer içerik kısıtlıysa eldeki verilerle piyasa yorumu yap.
    
    İÇERİK:
    ${content}
    
    ANALİZ RAPORU FORMATI (JSON):
    {
      "summary": "Haberin detaylı özeti (2-3 paragraf).",
      "keyPoints": ["Kritik 1", "Kritik 2", "Kritik 3"],
      "marketImpact": "Piyasalara ve yatırım araçlarına olası etkisi nedir?",
      "score": 8,
      "sentiment": "positive | negative | neutral"
    }
    
    Lütfen sadece saf JSON yanıtı ver.
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      return NextResponse.json({
        success: true,
        analysis: analysis
      });
    } catch (aiError) {
      console.warn("AI Analysis failed, using basic fallback:", aiError);
      const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
      return NextResponse.json({
        success: true,
        analysis: {
          summary: content.slice(0, 600) + "...",
          keyPoints: sentences.slice(0, 3).map(s => s.trim()),
          marketImpact: "İçerik kısıtlı olduğundan temel analiz sunuluyor.",
          score: 5,
          sentiment: "neutral"
        }
      });
    }
  } catch (error: any) {
    console.error("General News Analysis Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
