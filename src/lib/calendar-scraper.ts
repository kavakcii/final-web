const ALLOWED_COUNTRIES = new Set(['TR', 'TRY', 'US', 'USD', 'EU', 'EUR']);

const FLAG_MAP: Record<string, string> = {
    USD: '🇺🇸',
    US: '🇺🇸',
    EUR: '🇪🇺',
    EU: '🇪🇺',
    TRY: '🇹🇷',
    TR: '🇹🇷'
};

export async function scrapeEconomicCalendar() {
    try {
        // Fetch live economic calendar feed (FairEconomy / ForexFactory real-time feed)
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 300 } // Cache for 5 mins
        });

        if (!response.ok) throw new Error(`Calendar fetch failed with status: ${response.status}`);

        const data = await response.json();

        // User requested STRICTLY:
        // 1. ONLY 2-star (Medium) and 3-star (High/Critical) events
        // 2. ONLY TR (Türkiye), US (ABD), and EU (Euro Bölgesi)
        const filteredData = data.filter((item: any) => {
            const country = item.country ? item.country.toUpperCase() : '';
            const impact = item.impact ? item.impact.toLowerCase() : '';

            const isAllowedCountry = ALLOWED_COUNTRIES.has(country);
            const isAllowedImpact = impact === 'medium' || impact === 'high' || impact === 'critical';

            return isAllowedCountry && isAllowedImpact;
        });

        const events = filteredData.map((item: any) => {
            const dateObj = new Date(item.date);
            const time = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const countryCode = item.country ? item.country.toUpperCase() : 'TR';
            const flag = FLAG_MAP[countryCode] || '🌐';

            // Map impact string (medium = 2-star, high/critical = 3-star)
            let impactLevel: 'medium' | 'high' | 'critical' = 'medium';
            if (item.impact?.toLowerCase() === 'high' || item.impact?.toLowerCase() === 'critical') {
                impactLevel = item.title?.toLowerCase().includes('fed') || item.title?.toLowerCase().includes('tcmb') ? 'critical' : 'high';
            }

            return {
                id: item.title + '_' + item.date,
                time,
                country: countryCode === 'USD' ? 'US' : countryCode === 'EUR' ? 'EU' : countryCode === 'TRY' ? 'TR' : countryCode,
                flag,
                event: item.title,
                forecast: item.forecast || '-',
                previous: item.previous || '-',
                actual: item.actual || 'Bekleniyor',
                impact: impactLevel,
                originalDate: dateObj
            };
        });

        return events;
    } catch (error) {
        console.error("Calendar fetch failed:", error);
        return [];
    }
}
