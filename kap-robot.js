const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// KAP Robot - Fon Portföy Dağılım Raporu Çekici
// Kullanım: node kap-robot.js [FON_KODU]
// Örnek: node kap-robot.js MAC

const FUND_CODE = process.argv[2] || 'MAC';
const OUTPUT_DIR = path.join(__dirname, 'kap_downloads');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

async function run() {
    const log = (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${msg}`);
        fs.appendFileSync('robot.log', `[${timestamp}] ${msg}\n`);
    };

    log(`Robot başlatılıyor... Fon: ${FUND_CODE}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new", // Tarayıcıyı gizli modda çalıştır
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });
        
        const page = await browser.newPage();
        
        // Gerçek kullanıcı gibi görünmek için User-Agent ayarla
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        // 1. Arama sayfasına gitme yerine direkt URL oluşturmayı dene (daha hızlı)
        // Not: KAP URL yapısı değişebilir, bu yüzden dinamik arama daha güvenlidir ama şimdilik direct deniyoruz.
        // Örn: https://www.kap.org.tr/tr/fon-bilgileri/genel/mac-marmara-capital-portfoy-hisse-senedi-tl-fonu-hisse-senedi-yogun-fon
        // Ancak tam URL'yi bilmiyorsak arama yapmalıyız.
        
        log("KAP Ana sayfasına gidiliyor...");
        await page.goto('https://www.kap.org.tr', { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        log("Arama kutusu aranıyor...");
        const searchInputSelector = '#all-search';
        await page.waitForSelector(searchInputSelector);
        
        log(`'${FUND_CODE}' aranıyor...`);
        await page.type(searchInputSelector, FUND_CODE);
        
        // Önerilerin gelmesini bekle
        await new Promise(r => setTimeout(r, 3000));
        
        // Enter'a bas
        await page.keyboard.press('Enter');
        
        log("Sonuçlar yükleniyor...");
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // URL kontrolü
        const url = page.url();
        log(`Şu anki URL: ${url}`);
        
        if (url.includes('/genel/')) {
            log("Fon sayfasına başarıyla ulaşıldı.");
        } else {
            log("Arama sonuçları sayfasındayız, fon linki aranıyor...");
            // Linki bulup tıkla (Basit mantık)
            const clicked = await page.evaluate((code) => {
                const links = Array.from(document.querySelectorAll('a'));
                const fundLink = links.find(l => l.innerText.includes(code) || l.href.includes(code.toLowerCase()));
                if (fundLink) {
                    fundLink.click();
                    return true;
                }
                return false;
            }, FUND_CODE);
            
            if (clicked) {
                log("Fon linkine tıklandı, yönlendirme bekleniyor...");
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
            } else {
                throw new Error("Fon linki bulunamadı.");
            }
        }
        
        // Fon sayfasındayız (Varsayım)
        // 'Bildirimler' sekmesini bul ve tıkla
        log("'Bildirimler' sekmesi aranıyor...");
        await new Promise(r => setTimeout(r, 5000)); // Sayfa tam otursun
        
        const notificationsClicked = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('div, a, li'));
            const bildirimTab = tabs.find(el => el.innerText && el.innerText.trim() === 'Bildirimler');
            if (bildirimTab) {
                bildirimTab.click();
                return true;
            }
            return false;
        });
        
        if (!notificationsClicked) {
            log("UYARI: 'Bildirimler' sekmesi bulunamadı veya tıklanamadı. Sayfa yapısı farklı olabilir.");
            await page.screenshot({ path: path.join(OUTPUT_DIR, 'error-tabs.png') });
        } else {
            log("'Bildirimler' sekmesine tıklandı. Veriler bekleniyor...");
            await new Promise(r => setTimeout(r, 5000));
            
            // Portföy Dağılım Raporu ara
            log("Rapor aranıyor...");
            const report = await page.evaluate(() => {
                // Tüm linkleri tara
                const links = Array.from(document.querySelectorAll('a'));
                const reportLink = links.find(l => l.innerText.includes('Portföy Dağılım Raporu') || l.innerText.includes('Portföy Dağılım'));
                
                if (reportLink) {
                    return {
                        text: reportLink.innerText,
                        href: reportLink.href
                    };
                }
                return null;
            });
            
            if (report) {
                log(`RAPOR BULUNDU: ${report.text}`);
                log(`Link: ${report.href}`);
                
                // İsterseniz burada PDF'i indirebilirsiniz
                // await page.goto(report.href);
            } else {
                log("Son bildirimlerde 'Portföy Dağılım Raporu' bulunamadı.");
                await page.screenshot({ path: path.join(OUTPUT_DIR, 'notifications.png') });
            }
        }
        
        log("İşlem tamamlandı.");

    } catch (error) {
        log(`HATA: ${error.message}`);
        if (browser) {
            await page.screenshot({ path: path.join(OUTPUT_DIR, 'error.png') });
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

run();