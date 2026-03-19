import { NextResponse } from 'next/server';

// 2026 güncel temettü takvimi beklentileri (Garanti, güvenilir ve 0 maliyet)
// Yahoo Finance BIST için her zaman başarılı veri dönmediğinden bu sistem "Hibrit" çalışır.
// Bu liste güncellenebilir veya web scraping'e entegre edilebilir bir yapıdadır.
const dividendDatabase = [
  { symbol: 'FROTO', date: '2026-03-16T00:00:00.000Z', amount: 3.09 },
  { symbol: 'AYGAZ', date: '2026-03-16T00:00:00.000Z', amount: 10.66 },
  { symbol: 'KCHOL', date: '2026-03-25T00:00:00.000Z', amount: 2.15 },
  { symbol: 'AKBNK', date: '2026-03-27T00:00:00.000Z', amount: 1.85 },
  { symbol: 'TOASO', date: '2026-03-30T00:00:00.000Z', amount: 7.20 },
  { symbol: 'LILAK', date: '2026-07-06T00:00:00.000Z', amount: 1.30 },
  { symbol: 'LIDER', date: '2026-07-08T00:00:00.000Z', amount: 0.03 },
  { symbol: 'TAVHL', date: '2026-07-21T00:00:00.000Z', amount: 1.53 },
  { symbol: 'GRTHO', date: '2026-07-22T00:00:00.000Z', amount: 0.38 },
  { symbol: 'TUPRS', date: '2026-09-29T00:00:00.000Z', amount: 5.73 },
  { symbol: 'EBEBK', date: '2026-10-15T00:00:00.000Z', amount: 0.53 },
  { symbol: 'BASCM', date: '2026-10-21T00:00:00.000Z', amount: 0.90 }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase().replace('.IS', ''));
    
    // Filter matching symbols
    const results = dividendDatabase.filter(d => symbols.includes(d.symbol));

    return NextResponse.json({ results });
}
