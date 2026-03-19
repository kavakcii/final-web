const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        const summary = await yahooFinance.quoteSummary('THYAO.IS', { modules: ['calendarEvents'] });
        console.log("CALENDAR:", JSON.stringify(summary.calendarEvents, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
