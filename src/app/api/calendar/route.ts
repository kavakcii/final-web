import { NextRequest, NextResponse } from 'next/server';
import { scrapeEconomicCalendar } from '@/lib/calendar-scraper';
import { CalendarCache } from '@/lib/calendar-cache';
import { CalendarDbService } from '@/lib/calendar-db-service';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'economic-calendar:combined';

export async function GET(request: NextRequest) {
    // 1. FRESH CACHE KONTROLÜ (Cache HIT)
    const cachedData = CalendarCache.get<any[]>(CACHE_KEY);
    if (cachedData) {
        return NextResponse.json(
            { success: true, source: 'server-cache', data: cachedData },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
    }

    // 6. IN-FLIGHT PROMISE DEDUPLICATION (Aynı process içinde concurrent istekleri tekilleştir)
    const existingInFlight = CalendarCache.getInFlightPromise<any[]>(CACHE_KEY);
    if (existingInFlight) {
        try {
            const data = await existingInFlight;
            if (data && data.length > 0) {
                return NextResponse.json(
                    { success: true, source: 'server-deduplicated-cache', data },
                    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
                );
            }
        } catch {}
    }

    // 15. MERKEZİ SOURCE REQUEST (In-Flight Promise Wrap)
    const fetchPromise = (async () => {
        try {
            const events = await scrapeEconomicCalendar();

            // 12. SOURCE RESPONSE VALIDATION
            if (CalendarCache.validateSourceResponse(events)) {
                CalendarCache.set(CACHE_KEY, events);
                return events;
            } else {
                console.warn("[CALENDAR API WARNING] Source response validation failed. Falling back to DB.");
            }
        } catch (e: any) {
            console.error("[CALENDAR API ERROR] Live fetch failed:", e);
        }

        // 8. DATABASE FALLBACK (Dış API başarısızsa Supabase DB'den kesintisiz getir)
        const today = new Date();
        const startIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split('T')[0];
        const endIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21).toISOString().split('T')[0];

        const dbEvents = await CalendarDbService.getEventsByDateRange(startIso, endIso);
        if (dbEvents && dbEvents.length > 0) {
            const formattedDbEvents = dbEvents.map(d => ({
                id: d.id,
                dateFormatted: d.event_date.split('-').reverse().join('.'),
                time: d.event_time,
                country: d.country_code,
                flag: d.flag,
                event: d.event_name,
                impact: d.impact_level,
                previous: d.previous_value || '-',
                forecast: d.forecast_value || '-',
                actual: d.is_released ? (d.actual_value || '-') : 'Bekleniyor',
                isToday: d.event_date === today.toISOString().split('T')[0]
            }));
            CalendarCache.set(CACHE_KEY, formattedDbEvents, 30000);
            return formattedDbEvents;
        }

        return null;
    })();

    CalendarCache.setInFlightPromise(CACHE_KEY, fetchPromise);

    try {
        const resultData = await fetchPromise;
        if (resultData && resultData.length > 0) {
            return NextResponse.json(
                { success: true, source: 'live-feed', data: resultData },
                { headers: { 'Cache-Control': 'no-store, max-age=0' } }
            );
        }
    } catch {}

    // Fallback if complete failure
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
