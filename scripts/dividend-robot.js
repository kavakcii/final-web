const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Bot korumalarını (Cloudflare vb.) aşmak için Stealth eklentisi
puppeteer.use(StealthPlugin());

console.log("🤖 FinAI Temettü Ajanı Başlatılıyor...");

// Veritabanı rotası (Next.js'in okuduğu dosya)
const dbPath = path.join(__dirname, '../src/lib/dividend-db.json');

(async () => {
    let browser;
    try {
        console.log("🌐 Gizli Chrome Tarayıcısı Açılıyor...");
        browser = await puppeteer.launch({ 
            headless: 'new', // Arkada sessizce çalışır (ekranınızda açılmaz)
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });

        const page = await browser.newPage();
        
        // Kullanıcı deneyimi oluşturmak için User-Agent eklentisi
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log("🔓 Fintables'ın Temettü Sunucusuna (API) Sızılıyor...");
        
        // API Sızıntı Hedefi: "wapi.fintables.com/v1/dividends"
        // Normal fetch() yapıldığında cloudflare bloklar, ancak Puppeteer (Gerçek Chrome) bloğu geçer.
        await page.goto('https://wapi.fintables.com/v1/dividends', { waitUntil: 'networkidle2' });

        console.log("✅ Duvar Aşıldı. Veriler İndiriliyor...");

        // Sayfa içeriğini alıp JSON'a çevirme
        const apiResponseText = await page.evaluate(() => document.body.innerText);
        
        let rawData;
        try {
            rawData = JSON.parse(apiResponseText);
        } catch(e) {
            throw new Error("API'den geçerli bir JSON gelmedi. Cloudflare yakalamış olabilir veya veri yapısı değişti.");
        }

        if (!rawData || !rawData.data || !Array.isArray(rawData.data)) {
            throw new Error("Veri formatı Fintables tarafından değiştirilmiş.");
        }

        console.log(`📊 ${rawData.data.length} adet kesinleşmiş/geçmiş temettü verisi yakalandı!`);

        const dividendDbMap = {};
        
        // Gelen listeyi bizim dividend-db.json formatına çevirme
        rawData.data.forEach(item => {
            if(item.symbol && item.amount) {
                // Temettü Tarihi ve Miktar (Brüt veya Net, Fintables amount olarak veriyor)
                dividendDbMap[item.symbol] = {
                    date: item.date, // "2024-05-30T00:00:00.000Z"
                    amount: parseFloat(item.amount) 
                };
            }
        });

        const sortedKeys = Object.keys(dividendDbMap).sort();
        console.log(`🔥 ${sortedKeys.length} adet farklı şirketin nakit akışı veritabanına yazılıyor...`);

        // Sonucu dividend-db.json içine kaydetme
        fs.writeFileSync(dbPath, JSON.stringify(dividendDbMap, null, 4), 'utf8');

        console.log("🎉 MÜKEMMEL! Tüm veriler `src/lib/dividend-db.json` dosyasına işlendi.");
        console.log("Artık Next.js temanızı bu kusursuz ve gerçek verilerle %100 hızla başlatabilirsiniz.");

    } catch (error) {
        console.error("\n❌ HATA OLUŞTU:", error.message);
    } finally {
        if (browser) {
            console.log("🧹 Tarayıcı Görevi Bitti, Kapatılıyor...");
            await browser.close();
        }
        process.exit(0);
    }
})();
