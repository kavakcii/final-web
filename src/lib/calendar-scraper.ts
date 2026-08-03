import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from './calendar-catalog';

const ALLOWED_COUNTRIES = new Set(['TR', 'TRY', 'US', 'USD', 'EU', 'EUR', 'GB', 'GBP']);

// Strictly verify if event date/time has passed in TSİ (Europe/Istanbul UTC+3)
function isEventTimePassed(dateFormatted: string, time: string): boolean {
    try {
        const now = new Date();
        const [dayStr, monthStr, yearStr] = dateFormatted.split('.');
        const [hourStr, minStr] = time.split(':');

        const eventDate = new Date(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
            parseInt(dayStr),
            parseInt(hourStr),
            parseInt(minStr)
        );

        return now.getTime() >= eventDate.getTime();
    } catch {
        return false;
    }
}

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

            // Enrich catalog with live actual values ONLY IF event time has actually passed!
            const enrichedCatalog = ECONOMIC_CALENDAR_CATALOG.map(catItem => {
                const liveKey = `${catItem.dateFormatted}_${catItem.time}_${catItem.country === 'ABD' ? 'USD' : catItem.country === 'UK' ? 'GBP' : catItem.country}`;
                const liveItem = liveEventsMap.get(liveKey);
                const hasTimePassed = isEventTimePassed(catItem.dateFormatted, catItem.time);

                // Strict check: If event time has NOT passed yet, actual is ALWAYS 'Bekleniyor'
                if (!hasTimePassed) {
                    return {
                        ...catItem,
                        actual: 'Bekleniyor'
                    };
                }

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

    // Fallback: Ensure no future event displays actuals
    return ECONOMIC_CALENDAR_CATALOG.map(catItem => {
        const hasTimePassed = isEventTimePassed(catItem.dateFormatted, catItem.time);
        if (!hasTimePassed) {
            return {
                ...catItem,
                actual: 'Bekleniyor'
            };
        }
        return catItem;
    });
}
