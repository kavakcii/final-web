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

    // 1. Fetch the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and common non-content elements
    $('script, style, nav, footer, header, ads, .ads, #ads').remove();

    // Get main text content (often in <article>, <main>, or large <div>s)
    let content = $('article').text() || $('main').text() || $('body').text();
    
    // Clean up text (remove excessive whitespace)
    content = content.replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit to 5k chars for AI

    // 2. Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
    Aşağıdaki haber metnini bir finansal analist gözüyle oku ve derinlemesine analiz et.
    
    İÇERİK:
    ${content}
    
    ANALİZ RAPORU FORMATI (JSON):
    {
      "summary": "Haberin detaylı özeti (2-3 paragraf).",
      "keyPoints": ["Kritik 1", "Kritik 2", "Kritik 3"],
      "marketImpact": "Piyasalara ve yatırım araçlarına olası etkisi nedir?",
      "score": 8, // 1-10 arası önem puanı
      "sentiment": "positive | negative | neutral"
    }
    
    Lütfen sadece saf JSON yanıtı ver.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      analysis: analysis
    });

  } catch (error: any) {
    console.error("AI News Analysis Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Analysis failed'
    }, { status: 500 });
  }
}
