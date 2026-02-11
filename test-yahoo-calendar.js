
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function testYahooCalendar() {
    console.log("Testing Yahoo Finance Calendar...");
    try {
        // Try to access calendar if it exists in the library
        // Note: yahoo-finance2 might not have 'calendar' method exposed directly or it might be 'daily'
        // Let's print available methods on the instance
        console.log("Available methods:", Object.keys(Object.getPrototypeOf(yahooFinance)));
        
        // If there's no calendar, we might search for 'calendar' in properties
        
    } catch (error) {
        console.error("Error:", error);
    }
}

testYahooCalendar();
