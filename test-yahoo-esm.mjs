import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        const quote = await yahooFinance.quote('FROTO.IS');
        console.log("DividendDate via Quote:", quote.dividendDate);
        
        const summary = await yahooFinance.quoteSummary('FROTO.IS', { modules: ['calendarEvents'] });
        console.log("CalendarEvents via Summary:", JSON.stringify(summary.calendarEvents, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
