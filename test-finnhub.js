
async function testFinnhub() {
  const apiKey = "d65j5ahr01qiisgvtrugd65j5ahr01qiisgvtrv0";
  
  // Test 1: Basic Quote (Free Tier usually allows this)
  const urlQuote = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`;
  
  console.log("Testing Quote API...");
  try {
    const res = await fetch(urlQuote);
    if (!res.ok) {
        throw new Error(`Quote Status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Quote Data Success:", data);
  } catch (error) {
    console.error("Quote Error:", error.message);
  }

  // Test 2: Economic Calendar (May be restricted)
  const today = new Date();
  const fromDate = today.toISOString().split('T')[0];
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const toDate = nextWeek.toISOString().split('T')[0];
  const urlCalendar = `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${apiKey}`;

  console.log("\nTesting Calendar API...");
  try {
    const res = await fetch(urlCalendar);
    if (!res.ok) {
        throw new Error(`Calendar Status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Calendar Data Success:", data.economicCalendar ? "Yes" : "No");
  } catch (error) {
    console.error("Calendar Error:", error.message);
  }
}

testFinnhub();
