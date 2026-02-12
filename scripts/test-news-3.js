const yahooFinance = require('yahoo-finance2').default; // Trying default export again, but let's check without .default

console.log("With .default:", yahooFinance);

const yahooFinanceDirect = require('yahoo-finance2');
console.log("Without .default:", yahooFinanceDirect);

async function test() {
    // If yahooFinanceDirect is the instance (singleton), use it.
    // If it has a .default property that is the instance, use that.
    
    let yf = yahooFinanceDirect;
    if (yf.default) {
        console.log("Using .default from direct require");
        yf = yf.default;
    }
    
    // Check if it's a function (class) or object
    if (typeof yf === 'function') {
        console.log("It's a class/function. Instantiating...");
        try {
            yf = new yf();
        } catch(e) {
            console.log("Instantiation failed:", e.message);
        }
    }

    try {
        console.log("Searching news...");
        const res = await yf.search("IPJ", { newsCount: 1 });
        console.log("Success:", res.news[0]?.title);
    } catch (e) {
        console.log("Fail:", e.message);
    }
}

test();