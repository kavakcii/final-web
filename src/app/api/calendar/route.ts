import { NextRequest, NextResponse } from 'next/server';
import { scrapeEconomicCalendar } from '@/lib/calendar-scraper';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 10. SERVER-SIDE REQUEST DEDUPLICATION CACHE
// 100 eşzamanlı kullanıcı widget açtığında dış kaynak API'sine 100 ayrı istek gitmesini engeller.
let cachedEvents: any[] | null = null;
let lastFetchTimeMs = 0;
const SERVER_CACHE_TTL_MS = 10000; // 10 Saniye Önbellek

export async function GET(request: NextRequest) {
  const nowMs = Date.now();

  // Önbellekteki veri 10 saniyeden taze ise direkt sunucu önbelleğinden döndür (Rate limit koruması)
  if (cachedEvents && (nowMs - lastFetchTimeMs < SERVER_CACHE_TTL_MS)) {
      return NextResponse.json(
          { success: true, source: 'server-cache', data: cachedEvents },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
  }

  try {
      const events = await scrapeEconomicCalendar();
      if (events && events.length > 0) {
          cachedEvents = events;
          lastFetchTimeMs = nowMs;
          return NextResponse.json(
            { success: true, source: 'live-feed', data: events },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } }
          );
      }
  } catch (e: any) {
      console.error("Economic calendar API route error:", e);
  }

  // Önbellekte önceden çekilmiş veri varsa onu kullan
  if (cachedEvents) {
      return NextResponse.json(
          { success: true, source: 'server-cache-fallback', data: cachedEvents },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
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
