import { NextRequest } from 'next/server';
import { normalizeSymbol } from '@/lib/api/finai-symbol';
import { apiSuccess, apiError } from '@/lib/api/finai-api-response';
import { sectorMapping } from '@/data/sectorMapping';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return apiError('INVALID_SYMBOL', 'Geçersiz sembol formatı');

  const sector = sectorMapping[symbol] || 'BIST Şirket';

  try {
    const query = encodeURIComponent(`${symbol} hisse haber KAP bilanço`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 180 }
    });

    if (!res.ok) {
      throw new Error(`News RSS returned ${res.status}`);
    }

    const xmlText = await res.text();
    const articles: any[] = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>(?:[\s\S]*?<description>([\s\S]*?)<\/description>)?/g;

    let match;
    let index = 1;
    while ((match = itemRegex.exec(xmlText)) !== null && articles.length < 15) {
      const rawTitle = match[1] || '';
      const titleClean = rawTitle
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\s*-\s*[\w\.\s]+$/g, '')
        .trim();

      const rawDesc = match[4] || '';
      const descClean = rawDesc
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();

      const pubDateRaw = match[3];

      let category = 'Şirket Haberi';
      if (titleClean.toLowerCase().includes('kap') || titleClean.toLowerCase().includes('bildirim')) {
        category = 'KAP Bildirimi';
      } else if (titleClean.toLowerCase().includes('analiz') || titleClean.toLowerCase().includes('hedef') || titleClean.toLowerCase().includes('kâr')) {
        category = 'Finansal Analiz';
      } else if (titleClean.toLowerCase().includes('bist') || titleClean.toLowerCase().includes('borsa') || titleClean.toLowerCase().includes('rekor')) {
        category = 'Piyasa Gelişmesi';
      }

      const dateObj = new Date(pubDateRaw);
      const timeFormatted = isNaN(dateObj.getTime())
        ? 'Bugün'
        : dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Zero fake text: Use only real RSS description or title. Never synthesize quotes or claims!
      const bodyText = descClean && descClean.length > 20 ? descClean : titleClean;

      articles.push({
        id: `${symbol}-news-${index++}`,
        symbol,
        title: titleClean,
        category,
        pubDate: timeFormatted,
        summary: titleClean,
        content: bodyText
      });
    }

    if (articles.length === 0) {
      return apiSuccess([], { total: 0, status: 'DATA_UNAVAILABLE', message: 'Doğrulanmış güncel haber veya duyuru bulunamadı.' }, symbol);
    }

    return apiSuccess(articles, { total: articles.length, sector }, symbol);

  } catch (error: any) {
    // Strictly return empty list. Never generate fake fallback articles!
    return apiSuccess([], { total: 0, status: 'DATA_UNAVAILABLE', message: 'Haber akışına erişilemedi.' }, symbol);
  }
}
