import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from './calendar-catalog';

const ALLOWED_COUNTRIES = new Set(['TR', 'TRY', 'US', 'USD', 'EU', 'EUR', 'GB', 'GBP']);

export async function scrapeEconomicCalendar(): Promise<CatalogCalendarEvent[]> {
    try {
        // Try live feed first, fallback/enrich with pre-indexed catalog
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            const liveEventsMap = new Map<string, any>();

            data.forEach((item: any) => {
                if (item.title && item.date) {
                    const dateObj = new Date(item.date);
                    const time = dateObj.toLocaleTimeString('tr-TR', {
                        timeZone: 'Europe/Istanbul',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                    const dateFormatted = dateObj.toLocaleDateString('tr-TR', {
                        timeZone: 'Europe/Istanbul',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    
                    const key = `${dateFormatted}_${time}_${item.country}`;
                    liveEventsMap.set(key, item);
                }
            });

            // Enrich catalog with live actual values
            const enrichedCatalog = ECONOMIC_CALENDAR_CATALOG.map(catItem => {
                const liveKey = `${catItem.dateFormatted}_${catItem.time}_${catItem.country === 'ABD' ? 'USD' : catItem.country === 'UK' ? 'GBP' : catItem.country}`;
                const liveItem = liveEventsMap.get(liveKey);

                if (liveItem && liveItem.actual && liveItem.actual !== '-') {
                    return {
                        ...catItem,
                        actual: liveItem.actual
                    };
                }
                return catItem;
            });

            return enrichedCatalog;
        }
    } catch (error) {
        console.error("Live calendar fetch failed, using catalog store:", error);
    }

    return ECONOMIC_CALENDAR_CATALOG;
}
