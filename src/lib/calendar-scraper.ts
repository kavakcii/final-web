const ALLOWED_COUNTRIES = new Set(['TR', 'TRY', 'US', 'USD', 'EU', 'EUR', 'GB', 'GBP']);

const COUNTRY_CODE_DISPLAY: Record<string, string> = {
    USD: 'ABD',
    US: 'ABD',
    EUR: 'EU',
    EU: 'EU',
    TRY: 'TR',
    TR: 'TR',
    GBP: 'UK',
    GB: 'UK'
};

const FLAG_MAP: Record<string, string> = {
    USD: '🇺🇸',
    US: '🇺🇸',
    EUR: '🇪🇺',
    EU: '🇪🇺',
    TRY: '🇹🇷',
    TR: '🇹🇷',
    GBP: '🇬🇧',
    GB: '🇬🇧'
};

const TITLE_TR_MAP: Record<string, string> = {
    "Inflation Rate MoM": "Aylık Enflasyon Oranı (TÜFE)",
    "Inflation Rate YoY": "Yıllık Enflasyon Oranı (TÜFE)",
    "CPI MoM": "Aylık Tüketici Fiyat Endeksi (TÜFE)",
    "CPI YoY": "Yıllık Tüketici Fiyat Endeksi (TÜFE)",
    "Core CPI MoM": "Aylık Çekirdek TÜFE",
    "Core CPI YoY": "Yıllık Çekirdek TÜFE",
    "PPI MoM": "Aylık Üretici Fiyat Endeksi (ÜFE)",
    "PPI YoY": "Yıllık Üretici Fiyat Endeksi (ÜFE)",
    "Manufacturing PMI": "İmalat PMI Endeksi",
    "Services PMI": "Hizmet PMI Endeksi",
    "S&P Global Manufacturing PMI Final": "S&P Global İmalat PMI (Nihai)",
    "S&P Global Services PMI Final": "S&P Global Hizmet PMI (Nihai)",
    "ISM Manufacturing PMI": "ISM İmalat PMI Endeksi",
    "ISM Non-Manufacturing PMI": "ISM İmalat Dışı PMI Endeksi",
    "Non Farm Payrolls": "Tarım Dışı İstihdam Değişimi",
    "Unemployment Rate": "İşsizlik Oranı",
    "Initial Jobless Claims": "İşsizlik Haklarından Yararlanma Başvuruları",
    "Interest Rate Decision": "Faiz Oranı Kararı",
    "Fed Interest Rate Decision": "Fed Politika Faizi Kararı",
    "TCMB Interest Rate Decision": "TCMB Politika Faizi Kararı",
    "GDP MoM": "Aylık Büyüme (GSYH)",
    "GDP QoQ": "Çeyreklik Büyüme (GSYH)",
    "GDP YoY": "Yıllık Büyüme (GSYH)",
    "Balance of Trade": "Dış Ticaret Dengesi",
    "Balance of Trade Prel": "Dış Ticaret Dengesi (Öncü)",
    "Exports": "İhracat Verisi",
    "Exports Prel": "İhracat (Öncü)",
    "Imports": "İthalat Verisi",
    "Imports Prel": "İthalat (Öncü)",
    "Retail Sales MoM": "Aylık Perakende Satışlar",
    "Retail Sales YoY": "Yıllık Perakende Satışlar",
    "Consumer Confidence": "Tüketici Güven Endeksi",
    "Industrial Production MoM": "Aylık Sanayi Üretimi",
    "Industrial Production YoY": "Yıllık Sanayi Üretimi",
    "Istanbul Chamber of Industry Manufacturing PMI": "İSO Türkiye İmalat PMI"
};

function translateTitle(title: string): string {
    if (!title) return "";
    const cleanTitle = title.trim();
    if (TITLE_TR_MAP[cleanTitle]) return TITLE_TR_MAP[cleanTitle];

    // Substring translations for dynamic titles
    let tr = cleanTitle;
    tr = tr.replace(/Manufacturing PMI/g, 'İmalat PMI');
    tr = tr.replace(/Services PMI/g, 'Hizmet PMI');
    tr = tr.replace(/Inflation Rate/g, 'Enflasyon Oranı');
    tr = tr.replace(/Unemployment Rate/g, 'İşsizlik Oranı');
    tr = tr.replace(/Interest Rate Decision/g, 'Faiz Kararı');
    tr = tr.replace(/MoM/g, '(Aylık)');
    tr = tr.replace(/YoY/g, '(Yıllık)');
    tr = tr.replace(/QoQ/g, '(Çeyreklik)');
    tr = tr.replace(/Prel/g, '(Öncü)');
    tr = tr.replace(/Final/g, '(Nihai)');

    return tr;
}

export async function scrapeEconomicCalendar() {
    try {
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 180 }
        });

        if (!response.ok) throw new Error(`Calendar fetch failed with status: ${response.status}`);

        const data = await response.json();

        // Strictly filter 2-star & 3-star for TR, US, EU, GB
        const filteredData = data.filter((item: any) => {
            const country = item.country ? item.country.toUpperCase() : '';
            const impact = item.impact ? item.impact.toLowerCase() : '';

            const isAllowedCountry = ALLOWED_COUNTRIES.has(country);
            const isAllowedImpact = impact === 'medium' || impact === 'high' || impact === 'critical';

            return isAllowedCountry && isAllowedImpact;
        });

        const events = filteredData.map((item: any) => {
            const dateObj = new Date(item.date);
            
            // TSİ (Europe/Istanbul UTC+3) time formatting
            const time = dateObj.toLocaleTimeString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            const countryCode = item.country ? item.country.toUpperCase() : 'TR';
            const countryDisplay = COUNTRY_CODE_DISPLAY[countryCode] || countryCode;
            const flag = FLAG_MAP[countryCode] || '🌐';

            // Map impact string
            let impactLevel: 'medium' | 'high' | 'critical' = 'medium';
            if (item.impact?.toLowerCase() === 'high' || item.impact?.toLowerCase() === 'critical') {
                impactLevel = item.title?.toLowerCase().includes('fed') || item.title?.toLowerCase().includes('tcmb') ? 'critical' : 'high';
            }

            const turkishTitle = translateTitle(item.title);

            // Is event today in TSİ timezone?
            const todayStr = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
            const eventDateStr = dateObj.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
            const isToday = eventDateStr === todayStr;

            return {
                id: item.title + '_' + item.date,
                time,
                country: countryDisplay,
                flag,
                event: turkishTitle,
                forecast: item.forecast || '-',
                previous: item.previous || '-',
                actual: item.actual || 'Bekleniyor',
                impact: impactLevel,
                isToday,
                originalDate: dateObj
            };
        });

        return events;
    } catch (error) {
        console.error("Calendar fetch failed:", error);
        return [];
    }
}
