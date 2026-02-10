
const yahooFinance = require('yahoo-finance2');
console.log('Default export:', yahooFinance);
console.log('Keys:', Object.keys(yahooFinance));
if (yahooFinance.default) {
    console.log('yahooFinance.default:', yahooFinance.default);
    console.log('Keys of default:', Object.keys(yahooFinance.default));
}
