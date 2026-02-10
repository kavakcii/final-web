import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface TefasHistoryParams {
  fundCode: string;
  startDate?: string;
  endDate?: string;
  fundType?: string; // 'YAT' or 'EMK'
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

async function fetchTefasHistory(params: TefasHistoryParams) {
  const { fundCode, startDate, endDate, fundType = 'YAT' } = params;

  // Default dates if not provided
  const end = endDate || formatDate(new Date());
  const start = startDate || formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));

  const url = 'https://www.tefas.gov.tr/api/DB/BindHistoryInfo';

  const payload = {
    fontip: fundType,
    sfontur: '',
    fonkod: fundCode.toUpperCase(),
    bastarih: start,
    bittarih: end,
    fonuser: '',
    encutf: '',
    parabirimi: ''
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.tefas.gov.tr',
        'Cookie': 'ASP.NET_SessionId=;', // Sometimes helps, though often not strictly needed for public data
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`TEFAS History API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    // API returns structured data. We usually want 'data' property if it exists, or the array directly.
    // TEFAS API usually returns { data: [...] } or just [...]
    // BindHistoryInfo returns: { d: "[[...]]" } usually wrapped in ASP.NET AJAX style 
    // OR it returns standard JSON. Let's handle standard JSON first.
    // Actually, TEFAS modern endpoints return JSON directly.

    // Example response item: { TAR: '09.02.2024', FIYAT: 123.45, ... }
    return data.data || data;
  } catch (error) {
    console.error('Error fetching TEFAS history:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!code) {
    return NextResponse.json({ error: 'Fon kodu gerekli (code parameter)' }, { status: 400 });
  }

  try {
    // 1. Existing Scraping for General Info (Title, Category, etc.)
    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${code.toUpperCase()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `TEFAS error: ${res.status}` }, { status: res.status });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const result: any = {
      symbol: code.toUpperCase(),
      title: $('.main-indicator h2').text().trim() || code.toUpperCase(),
      details: [],
      price: 0,
      dailyReturn: 0,
      category: '',
      history: []
    };

    // Parse Top List (Price, Return, etc.)
    $('.top-list li').each((i, el) => {
      const label = $(el).find('span').first().text().trim();
      const value = $(el).find('span').last().text().trim();
      if (label && value) {
        result.details.push({ label, value });
        if (label.includes('Son Fiyat')) result.price = parseFloat(value.replace(',', '.'));
        if (label.includes('Günlük Getiri')) result.dailyReturn = parseFloat(value.replace('%', '').replace(',', '.'));
        if (label.includes('Kategorisi')) result.category = value;
      }
    });

    // 2. Determine Fund Type (YAT or EMK)
    // Emeklilik funds usually have "Emeklilik" in category.
    const isPension = result.category && result.category.toLowerCase().includes('emeklilik');
    const fundType = isPension ? 'EMK' : 'YAT';

    // 3. Fetch History
    // If user didn't provide dates, we fetch 1 month by default (handled in helper)
    const historyData = await fetchTefasHistory({
      fundCode: code,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      fundType
    });

    // Map history to cleaner format
    result.history = Array.isArray(historyData) ? historyData.map((item: any) => ({
      date: item.TARJIH || item.TARIH || item.TAR, // Fields might vary, usually TAR or TARIH
      price: item.FIYAT,
      investors: item.KISI_SAYISI,
      totalValue: item.TEDAVUL_PAY_SAYISI // Adjust based on actual API response keys if known, usually just FIYAT is most important
    })) : [];

    // If history is empty, try to see if we got data in a different structure
    // Common keys: TAR, FIYAT, PAY_SAYISI, etc.
    // Let's pass the raw data if mapping is unsure, but mapping is better.
    // Currently, typical keys are: TAR, FIYAT, KISI_SAYISI.

    // Fallback: if details parsing failed, maybe we can get basic info from history (latest entry)
    if (result.price === 0 && result.history.length > 0) {
      const last = result.history[result.history.length - 1];
      result.price = last.price;
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('TEFAS Scraping Error:', error);
    return NextResponse.json({ error: 'Failed to fetch TEFAS data', details: error.message }, { status: 500 });
  }
}
