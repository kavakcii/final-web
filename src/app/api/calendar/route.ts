import { NextRequest, NextResponse } from 'next/server';
import { scrapeEconomicCalendar } from '@/lib/calendar-scraper';

export async function GET(request: NextRequest) {
  try {
      const events = await scrapeEconomicCalendar();
      if (events && events.length > 0) {
          return NextResponse.json({ success: true, source: 'live-feed', data: events });
      }
  } catch (e: any) {
      console.error("Economic calendar API route error:", e);
  }

  // Fallback if network issue
  return NextResponse.json({
    success: true,
    source: 'fallback',
    data: [
      { time: '10:00', country: 'TR', flag: '🇹🇷', event: 'TCMB Piyasa Katılımcıları Anketi', actual: '%42.8', previous: '%44.1', forecast: '%43.0', impact: 'high' },
      { time: '15:30', country: 'US', flag: '🇺🇸', event: 'ABD Çekirdek TÜFE (Yıllık)', actual: '%0.3', previous: '%0.3', forecast: '%0.2', impact: 'critical' },
      { time: '16:00', country: 'US', flag: '🇺🇸', event: 'İşsizlik Haklarından Yararlanma Başvuruları', actual: '215K', previous: '220K', forecast: '218K', impact: 'medium' },
      { time: '21:00', country: 'US', flag: '🇺🇸', event: 'Fed Faiz Oranı Kararı', actual: '%5.50', previous: '%5.50', forecast: '%5.50', impact: 'critical' },
    ]
  });
}
