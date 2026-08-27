// test-report-generation.js
// Run with: npx tsx test-report-generation.js

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function test() {
    console.log("Starting financial mail report generation test...");
    console.log("GEMINI_API_KEY status:", process.env.GEMINI_API_KEY ? "Present" : "Missing!");
    
    // Dynamic import inside async function to ensure env variables are loaded first
    const { generateWeeklyReport, generateEmailHtml } = await import('./src/lib/report-generator.ts');
    
    const mockAssets = [
        { symbol: 'EKGYO', amount: 2500, type: 'stock' }, // Real Estate (GYO) - Should map to Gayrimenkul
        { symbol: 'THYAO', amount: 150, type: 'stock' },  // Ulaştırma
        { symbol: 'BTC-USD', amount: 0.05, type: 'crypto' } // Kripto
    ];

    try {
        console.log("Generating report data...");
        const start = Date.now();
        const reportData = await generateWeeklyReport(mockAssets);
        const duration = (Date.now() - start) / 1000;
        
        console.log(`Report generated successfully in ${duration}s!`);
        console.log("\n=== Portfolio Value ===");
        console.log(`Total Value: ${reportData.totalValue.toLocaleString('tr-TR')} TL`);
        console.log(`Daily Change: %${reportData.dailyChangePercent.toFixed(2)} (${reportData.dailyChange.toLocaleString('tr-TR')} TL)`);
        console.log(`Weekly Change: %${reportData.weeklyChangePercent.toFixed(2)} (${reportData.weeklyChange.toLocaleString('tr-TR')} TL)`);
        console.log(`Monthly Change: %${reportData.monthlyChangePercent.toFixed(2)} (${reportData.monthlyChange.toLocaleString('tr-TR')} TL)`);
        
        console.log("\n=== Asset Performances ===");
        reportData.assets.forEach(a => {
            console.log(`- ${a.symbol} (${a.name} - Sector: ${a.sector}):`);
            console.log(`  Current Price: ${a.currentPrice.toLocaleString('tr-TR')} TL`);
            console.log(`  Daily Chg: %${a.dailyChangePercent.toFixed(2)} | Weekly Chg: %${a.weeklyChangePercent.toFixed(2)} | Monthly Chg: %${a.monthlyChangePercent.toFixed(2)}`);
        });

        console.log("\n=== Gemini AI Causal Analysis ===");
        console.log("Lookback Summary:", reportData.structuredAnalysis?.lookbackSummary);
        console.log("\nCausal Asset Explanations:");
        reportData.structuredAnalysis?.assetAnalysisTable?.forEach(item => {
            console.log(`[${item.symbol}]: ${item.reason}`);
        });
        
        console.log("\nFuture Outlook:", reportData.structuredAnalysis?.futureOutlook);
        console.log("\nEconomic Calendar Summary:", reportData.structuredAnalysis?.economicCalendarSummary);

        console.log("\nGenerating HTML...");
        const html = generateEmailHtml(reportData, "Test User");
        console.log(`HTML generated successfully (Length: ${html.length} chars).`);
        console.log("Test completed successfully!");

    } catch (e) {
        console.error("Test failed with error:", e);
    }
}

test();
