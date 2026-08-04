import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from './calendar-catalog';

const ALLOWED_COUNTRIES = new Set(['TR', 'TRY', 'US', 'USD', 'EU', 'EUR', 'GB', 'GBP']);

// Strictly verify if event date/time has passed in TSİ (Europe/Istanbul UTC+3)
function isEventTimePassed(dateFormatted: string, time: string): boolean {
    try {
        const now = new Date();
        const [dayStr, monthStr, yearStr] = dateFormatted.split('.').map(Number);
        const [hourStr, minStr] = time.split(':').map(Number);

        // TSİ (UTC+3) conversion to UTC timestamp
        const eventUtc = new Date(Date.UTC(yearStr, monthStr - 1, dayStr, hourStr - 3, minStr));

        return now.getTime() >= eventUtc.getTime();
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

            const todayFormatted = new Date().toLocaleDateString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowFormatted = tomorrowDate.toLocaleDateString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Enrich catalog with live actual values & dynamic isToday / isTomorrow flags
            const enrichedCatalog = ECONOMIC_CALENDAR_CATALOG.map(catItem => {
                const liveKey = `${catItem.dateFormatted}_${catItem.time}_${catItem.country === 'ABD' ? 'USD' : catItem.country === 'UK' ? 'GBP' : catItem.country}`;
                const liveItem = liveEventsMap.get(liveKey);
                const hasTimePassed = isEventTimePassed(catItem.dateFormatted, catItem.time);

                const isToday = catItem.dateFormatted === todayFormatted;
                const isTomorrow = catItem.dateFormatted === tomorrowFormatted;

                // Strict check: If event time has NOT passed yet, actual is ALWAYS 'Bekleniyor'
                if (!hasTimePassed) {
                    return {
                        ...catItem,
                        isToday,
                        isTomorrow,
                        actual: 'Bekleniyor'
                    };
                }

                if (liveItem && liveItem.actual && liveItem.actual !== '-') {
                    return {
                        ...catItem,
                        isToday,
                        isTomorrow,
                        actual: liveItem.actual
                    };
                }

                return {
                    ...catItem,
                    isToday,
                    isTomorrow
                };
            });

            return enrichedCatalog;
        }
    } catch (error) {
        console.error("Live calendar fetch failed, using catalog store:", error);
    }

    const todayFormatted = new Date().toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowFormatted = tomorrowDate.toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Fallback: Ensure dynamic isToday and no future event displays actuals
    return ECONOMIC_CALENDAR_CATALOG.map(catItem => {
        const hasTimePassed = isEventTimePassed(catItem.dateFormatted, catItem.time);
        const isToday = catItem.dateFormatted === todayFormatted;
        const isTomorrow = catItem.dateFormatted === tomorrowFormatted;

        if (!hasTimePassed) {
            return {
                ...catItem,
                isToday,
                isTomorrow,
                actual: 'Bekleniyor'
            };
        }
        return {
            ...catItem,
            isToday,
            isTomorrow
        };
    });
}
