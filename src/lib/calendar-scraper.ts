export async function scrapeEconomicCalendar() {
    try {
        // Fetch from ForexFactory (public JSON)
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        
        if (!response.ok) throw new Error('Failed to fetch calendar');
        
        const data = await response.json();
        
        // Filter and map data
        const events = data.map((item: any) => {
            const dateObj = new Date(item.date);
            const time = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            // Only show future events or today's events
            // For now, just return all sorted by date
            return {
                time,
                country: item.country,
                event: item.title,
                actual: item.forecast || '-', // Use forecast as placeholder for actual/expected
                previous: item.previous || '-',
                impact: item.impact.toLowerCase(),
                originalDate: dateObj // for sorting
            };
        });

        // Filter for today and future, sort by date
        const now = new Date();
        const futureEvents = events.filter((e: any) => e.originalDate >= new Date(now.setHours(0,0,0,0)));
        
        futureEvents.sort((a: any, b: any) => a.originalDate.getTime() - b.originalDate.getTime());
        
        return futureEvents.slice(0, 10);
    } catch (error) {
        console.error("Calendar fetch failed:", error);
        return [];
    }
}
