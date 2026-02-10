const pkg = require('yahoo-finance2');
// Try to get the class or instance
let yahooFinance;

try {
    // Attempt to use the default singleton
    if (pkg.default) {
        yahooFinance = pkg.default;
    } else {
        yahooFinance = pkg;
    }
    
    // If it requires instantiation (based on previous error)
    if (typeof yahooFinance === 'function' || (pkg.YahooFinance && !yahooFinance.quote)) {
        console.log('Instantiating YahooFinance class...');
        const YahooFinance = pkg.YahooFinance || pkg.default; // or however it's exported
        yahooFinance = new YahooFinance();
    }
} catch (e) {
    console.log('Initialization error:', e.message);
}

// Fallback: The error message specifically said: "Call `const yahooFinance = new YahooFinance()` first."
// This implies YahooFinance is exported.
if (!yahooFinance || !yahooFinance.quote) {
    try {
        const { YahooFinance } = require('yahoo-finance2');
        yahooFinance = new YahooFinance();
    } catch(e) {
        console.log('Fallback instantiation failed:', e.message);
    }
}

async function testYahoo() {
  console.log('--- Testing Yahoo Finance ---');

  if (!yahooFinance || !yahooFinance.quote) {
      console.error('CRITICAL: Could not initialize yahooFinance instance.');
      return;
  }

  // Test 1: US Stock
  try {
    console.log('\nFetching AAPL...');
    const aapl = await yahooFinance.quote('AAPL');
    console.log(`Success! AAPL Price: ${aapl.regularMarketPrice} ${aapl.currency}`);
  } catch (e) {
    console.error('Error fetching AAPL:', e.message);
  }

  // Test 2: Turkish Stock (THYAO.IS)
  try {
    console.log('\nFetching THYAO.IS...');
    const thyao = await yahooFinance.quote('THYAO.IS');
    console.log(`Success! THYAO.IS Price: ${thyao.regularMarketPrice} ${thyao.currency}`);
  } catch (e) {
    console.error('Error fetching THYAO.IS:', e.message);
  }

  // Test 3: TEFAS Fund via Yahoo
  try {
    console.log('\nFetching MAC (Test)...');
    const mac = await yahooFinance.quote('MAC'); 
    console.log(`Result for MAC: ${mac.longName} (${mac.symbol}) - Price: ${mac.regularMarketPrice}`);
  } catch (e) {
    console.log('MAC fetch failed (expected if not a US stock).');
  }
}

testYahoo();
