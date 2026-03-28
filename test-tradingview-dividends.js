const fetch = require('node-fetch');

const query = {
  symbols: { tickers: ["BIST:THYAO", "BIST:TUPRS", "BIST:PETKM", "BIST:FROTO"] },
  columns: [
    "name",
    "dividends_yield_current",
    "dividend_yield_recent",
    "dividends_ex_date_recent",
    "dividends_ex_date_upcoming",
    "dividend_amount_upcoming",
    "dividends_paid_recent",
    "next_dividend_date"
  ]
};

fetch('https://scanner.tradingview.com/turkey/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(query)
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
