import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const API_KEY = process.env.FINNHUB_API_KEY;

  if (!API_KEY) {
    // Return Mock Data if no key
    return NextResponse.json({
      source: 'mock',
      warning: 'Finnhub API Key missing. Add FINNHUB_API_KEY to .env',
      data: [
        { time: '10:00', country: 'TR', event: 'Tüketici Güven Endeksi', actual: '78.2', previous: '75.0', impact: 'high' },
        { time: '15:30', country: 'US', event: 'ABD TÜFE (Yıllık)', actual: '3.4%', previous: '3.2%', impact: 'high' },
        { time: '16:00', country: 'US', event: 'İşsizlik Hak. Yarlanma', actual: '210K', previous: '205K', impact: 'medium' },
        { time: '21:00', country: 'US', event: 'Fed Faiz Kararı', actual: '5.50%', previous: '5.50%', impact: 'critical' },
      ]
    });
  }

  try {
    // Finnhub Economic Calendar endpoint
    // Endpoint: /calendar/economic (Premium or specific access required)
    const today = new Date();
    const fromDate = today.toISOString().split('T')[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const toDate = nextWeek.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${API_KEY}`;
    
    const res = await fetch(url);
    
    // Fallback to mock data if API fails (403 Forbidden, 401 Unauthorized, etc.)
    if (!res.ok) {
        console.warn(`Finnhub API returned ${res.status}. Falling back to mock data.`);
        throw new Error(`Finnhub API Error: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.economicCalendar) {
         throw new Error('Invalid data format');
    }

    // Transform to our format
    const events = data.economicCalendar.map((item: any) => ({
      time: item.hour + ':' + String(item.minute).padStart(2, '0'),
      country: item.country,
      event: item.event,
      actual: item.actual,
      previous: item.prev,
      impact: item.impact,
      currency: item.currency
    }));

    return NextResponse.json({ source: 'finnhub', data: events });

  } catch (error: any) {
    console.error('Finnhub Fetch Failed, using Mock Data:', error.message);
    // Fallback Mock Data
    return NextResponse.json({
      source: 'mock-fallback',
      warning: `Finnhub API failed (${error.message}). Showing mock data.`,
      data: [
        { time: '10:00', country: 'TR', event: 'Tüketici Güven Endeksi', actual: '78.2', previous: '75.0', impact: 'high' },
        { time: '15:30', country: 'US', event: 'ABD TÜFE (Yıllık)', actual: '3.4%', previous: '3.2%', impact: 'high' },
        { time: '16:00', country: 'US', event: 'İşsizlik Hak. Yarlanma', actual: '210K', previous: '205K', impact: 'medium' },
        { time: '21:00', country: 'US', event: 'Fed Faiz Kararı', actual: '5.50%', previous: '5.50%', impact: 'critical' },
      ]
    });
  }
}
