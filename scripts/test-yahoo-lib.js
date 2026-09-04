const yfModule = require('yahoo-finance2');
const YahooFinanceClass = yfModule.YahooFinance || yfModule.default?.YahooFinance || yfModule.default;
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

async function testYahooLibrary() {
  try {
    const res = await yahooFinance.quoteSummary('THYAO.IS', {
      modules: ['price', 'financialData', 'incomeStatementHistoryQuarterly', 'balanceSheetHistoryQuarterly']
    });
    console.log('Yahoo Finance Library Status: SUCCESS');
    console.log('Long Name:', res.price?.longName);
    console.log('Currency:', res.price?.currency);
    console.log('Quarterly Income Items:', res.incomeStatementHistoryQuarterly?.incomeStatementHistory?.length);
  } catch (e) {
    console.error('Yahoo Finance Library Error:', e.message);
  }
}

testYahooLibrary();
