export interface CatalogCalendarEvent {
    id: string;
    dateFormatted: string; // DD.MM.YYYY
    dateDayName: string;   // Pazartesi, Salı, etc.
    time: string;          // HH:mm (TSİ UTC+3)
    country: 'TR' | 'ABD' | 'EU' | 'UK';
    flag: string;
    event: string;
    forecast: string;
    previous: string;
    actual: string;
    impact: 'medium' | 'high' | 'critical';
    isToday?: boolean;
    isTomorrow?: boolean;
    weekOffset: number; // 0 = Bu Hafta, 1 = Gelecek Hafta, 2 = 3. Hafta
    originalDate?: any;
    releasedAt?: string; // ISO string
}

// 3 Haftalık Kapsamlı Önceden Çevrilmiş ve İndekslenmiş Ekonomik Takvim Kataloğu
export const ECONOMIC_CALENDAR_CATALOG: CatalogCalendarEvent[] = [
    // --- BUGÜN & BU HAFTA (1. HAFTA: 03 AĞUSTOS 2026) ---
    {
        id: "tr_cpi_mom_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Aylık Tüketici Fiyat Endeksi (TÜFE)",
        forecast: "%1,83",
        previous: "%0,99",
        actual: "%1,78",
        impact: "critical",
        isToday: true,
        weekOffset: 0
    },
    {
        id: "tr_cpi_yoy_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Yıllık Enflasyon Oranı (TÜFE)",
        forecast: "%31,80",
        previous: "%32,11",
        actual: "%31,75",
        impact: "critical",
        isToday: true,
        weekOffset: 0
    },
    {
        id: "tr_ppi_mom_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Aylık Üretici Fiyat Endeksi (ÜFE)",
        forecast: "%1,60",
        previous: "%1,80",
        actual: "%1,52",
        impact: "high",
        isToday: true,
        weekOffset: 0
    },
    {
        id: "eu_pmi_final_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "11:00",
        country: "EU",
        flag: "🇪🇺",
        event: "S&P Global İmalat PMI (Nihai)",
        forecast: "52,0",
        previous: "51,4",
        actual: "51,9",
        impact: "medium",
        isToday: true,
        weekOffset: 0
    },
    {
        id: "uk_pmi_final_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "11:30",
        country: "UK",
        flag: "🇬🇧",
        event: "S&P Global İmalat PMI (Nihai)",
        forecast: "52,8",
        previous: "52,5",
        actual: "51,9",
        impact: "medium",
        isToday: true,
        weekOffset: 0
    },
    {
        id: "us_ism_pmi_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "ISM İmalat PMI Endeksi",
        forecast: "49,5",
        previous: "48,5",
        actual: "49,8",
        impact: "high",
        isToday: true,
        weekOffset: 0,
        releasedAt: new Date().toISOString()
    },
    {
        id: "us_ism_prices_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "ISM İmalat Fiyat Endeksi",
        forecast: "53,2",
        previous: "52,1",
        actual: "52,9",
        impact: "high",
        isToday: true,
        weekOffset: 0,
        releasedAt: new Date().toISOString()
    },
    {
        id: "us_construction_1",
        dateFormatted: "03.08.2026",
        dateDayName: "Pazartesi",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "Aylık İnşaat Harcamaları",
        forecast: "%0,2",
        previous: "-%0,1",
        actual: "%0,2",
        impact: "medium",
        isToday: true,
        weekOffset: 0,
        releasedAt: new Date().toISOString()
    },

    // --- YARIN (04.08.2026) ---
    {
        id: "tr_trade_balance_1",
        dateFormatted: "04.08.2026",
        dateDayName: "Salı",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Dış Ticaret Dengesi (Öncü)",
        forecast: "-7,2 B $",
        previous: "-10,37 B $",
        actual: "Bekleniyor",
        impact: "high",
        isTomorrow: true,
        weekOffset: 0
    },
    {
        id: "eu_ppi_mom_1",
        dateFormatted: "04.08.2026",
        dateDayName: "Salı",
        time: "12:00",
        country: "EU",
        flag: "🇪🇺",
        event: "Aylık Üretici Fiyat Endeksi (ÜFE)",
        forecast: "%0,4",
        previous: "%0,6",
        actual: "Bekleniyor",
        impact: "high",
        isTomorrow: true,
        weekOffset: 0
    },
    {
        id: "us_factory_orders_1",
        dateFormatted: "04.08.2026",
        dateDayName: "Salı",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "Aylık Fabrika Siparişleri",
        forecast: "-%0,5",
        previous: "%2,7",
        actual: "Bekleniyor",
        impact: "medium",
        isTomorrow: true,
        weekOffset: 0
    },

    // --- 05.08.2026 (Çarşamba) ---
    {
        id: "us_services_pmi_1",
        dateFormatted: "05.08.2026",
        dateDayName: "Çarşamba",
        time: "16:45",
        country: "ABD",
        flag: "🇺🇸",
        event: "S&P Global Hizmet PMI (Nihai)",
        forecast: "56,0",
        previous: "55,3",
        actual: "Bekleniyor",
        impact: "medium",
        weekOffset: 0
    },
    {
        id: "us_ism_non_mfg_1",
        dateFormatted: "05.08.2026",
        dateDayName: "Çarşamba",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "ISM İmalat Dışı (Hizmet) PMI",
        forecast: "51,5",
        previous: "50,8",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 0
    },
    {
        id: "us_crude_oil_1",
        dateFormatted: "05.08.2026",
        dateDayName: "Çarşamba",
        time: "17:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "Haftalık Ham Petrol Stokları",
        forecast: "-2,1 M",
        previous: "-3,4 M",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 0
    },

    // --- 06.08.2026 (Perşembe) ---
    {
        id: "uk_boe_decision_1",
        dateFormatted: "06.08.2026",
        dateDayName: "Perşembe",
        time: "14:00",
        country: "UK",
        flag: "🇬🇧",
        event: "İngiltere Merkez Bankası (BoE) Faiz Kararı",
        forecast: "%5,00",
        previous: "%5,25",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 0
    },
    {
        id: "us_initial_jobless_1",
        dateFormatted: "06.08.2026",
        dateDayName: "Perşembe",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "İşsizlik Haklarından Yararlanma Başvuruları",
        forecast: "218K",
        previous: "216K",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 0
    },

    // --- 07.08.2026 (Cuma - Tarım Dışı İstihdam Günü) ---
    {
        id: "us_non_farm_1",
        dateFormatted: "07.08.2026",
        dateDayName: "Cuma",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "Tarım Dışı İstihdam Değişimi (NFP)",
        forecast: "175K",
        previous: "206K",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 0
    },
    {
        id: "us_unemployment_1",
        dateFormatted: "07.08.2026",
        dateDayName: "Cuma",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD İşsizlik Oranı",
        forecast: "%4,1",
        previous: "%4,1",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 0
    },
    {
        id: "us_hourly_earnings_1",
        dateFormatted: "07.08.2026",
        dateDayName: "Cuma",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "Aylık Ortalama Saatlik Kazançlar",
        forecast: "%0,3",
        previous: "%0,3",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 0
    },

    // --- 2. HAFTA (GELECEK HAFTA: 10 - 14 AĞUSTOS 2026) ---
    {
        id: "tr_unemployment_2",
        dateFormatted: "10.08.2026",
        dateDayName: "Pazartesi",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Türkiye İşsizlik Oranı",
        forecast: "%8,4",
        previous: "%8,5",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 1
    },
    {
        id: "tr_industrial_prod_2",
        dateFormatted: "11.08.2026",
        dateDayName: "Salı",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Aylık Sanayi Üretim Endeksi",
        forecast: "%0,5",
        previous: "-%0,1",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 1
    },
    {
        id: "us_cpi_mom_2",
        dateFormatted: "12.08.2026",
        dateDayName: "Çarşamba",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD Aylık Tüketici Fiyat Endeksi (TÜFE)",
        forecast: "%0,2",
        previous: "%0,3",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 1
    },
    {
        id: "us_cpi_yoy_2",
        dateFormatted: "12.08.2026",
        dateDayName: "Çarşamba",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD Yıllık Enflasyon Oranı (TÜFE)",
        forecast: "%3,1",
        previous: "%3,3",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 1
    },
    {
        id: "us_ppi_mom_2",
        dateFormatted: "13.08.2026",
        dateDayName: "Perşembe",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD Aylık Üretici Fiyat Endeksi (ÜFE)",
        forecast: "%0,2",
        previous: "%0,2",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 1
    },
    {
        id: "us_retail_sales_2",
        dateFormatted: "14.08.2026",
        dateDayName: "Cuma",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD Aylık Perakende Satışlar",
        forecast: "%0,4",
        previous: "%0,4",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 1
    },
    {
        id: "us_michigan_sentiment_2",
        dateFormatted: "14.08.2026",
        dateDayName: "Cuma",
        time: "17:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "Michigan Tüketici Duyarlılık Endeksi (Öncü)",
        forecast: "67,5",
        previous: "66,4",
        actual: "Bekleniyor",
        impact: "medium",
        weekOffset: 1
    },

    // --- 3. HAFTA (17 - 21 AĞUSTOS 2026) ---
    {
        id: "tr_housing_sales_3",
        dateFormatted: "17.08.2026",
        dateDayName: "Pazartesi",
        time: "10:00",
        country: "TR",
        flag: "🇹🇷",
        event: "Türkiye Konut Satış İstatistikleri",
        forecast: "105.000",
        previous: "98.500",
        actual: "Bekleniyor",
        impact: "medium",
        weekOffset: 2
    },
    {
        id: "eu_gdp_qoq_3",
        dateFormatted: "18.08.2026",
        dateDayName: "Salı",
        time: "12:00",
        country: "EU",
        flag: "🇪🇺",
        event: "Euro Bölgesi Çeyreklik Büyüme (GSYH)",
        forecast: "%0,3",
        previous: "%0,3",
        actual: "Bekleniyor",
        impact: "high",
        weekOffset: 2
    },
    {
        id: "us_building_permits_3",
        dateFormatted: "18.08.2026",
        dateDayName: "Salı",
        time: "15:30",
        country: "ABD",
        flag: "🇺🇸",
        event: "ABD Yapı Ruhsatları",
        forecast: "1,45 M",
        previous: "1,44 M",
        actual: "Bekleniyor",
        impact: "medium",
        weekOffset: 2
    },
    {
        id: "us_fomc_minutes_3",
        dateFormatted: "19.08.2026",
        dateDayName: "Çarşamba",
        time: "21:00",
        country: "ABD",
        flag: "🇺🇸",
        event: "FOMC Toplantı Tutanakları (Fed)",
        forecast: "-",
        previous: "-",
        actual: "Açıklanacak",
        impact: "critical",
        weekOffset: 2
    },
    {
        id: "tr_tcmb_decision_3",
        dateFormatted: "20.08.2026",
        dateDayName: "Perşembe",
        time: "14:00",
        country: "TR",
        flag: "🇹🇷",
        event: "TCMB Politika Faizi Kararı",
        forecast: "%50,00",
        previous: "%50,00",
        actual: "Bekleniyor",
        impact: "critical",
        weekOffset: 2
    },
    {
        id: "eu_consumer_confidence_3",
        dateFormatted: "21.08.2026",
        dateDayName: "Cuma",
        time: "17:00",
        country: "EU",
        flag: "🇪🇺",
        event: "Euro Bölgesi Tüketici Güven Endeksi (Öncü)",
        forecast: "-13,8",
        previous: "-14,0",
        actual: "Bekleniyor",
        impact: "medium",
        weekOffset: 2
    }
];

/**
 * Haber açıklanma zamanı (Date objesi olarak)
 */
export function getEventReleaseTimestamp(event: CatalogCalendarEvent): Date | null {
    if (event.releasedAt) return new Date(event.releasedAt);

    if (!event.dateFormatted || !event.time) return null;
    
    // Parse DD.MM.YYYY and HH:mm
    const [day, month, year] = event.dateFormatted.split('.').map(Number);
    const [hour, minute] = event.time.split(':').map(Number);

    if (!day || !month || !year || isNaN(hour) || isNaN(minute)) return null;

    // TSİ (UTC+3)
    return new Date(Date.UTC(year, month - 1, day, hour - 3, minute));
}

/**
 * Açıklanan verinin beklentiye kıyasla durumu
 */
export function getActualVsForecastStatus(event: CatalogCalendarEvent): 'above' | 'below' | 'inline' | 'pending' {
    if (!event.actual || event.actual === 'Bekleniyor' || event.actual === 'Açıklanacak') {
        return 'pending';
    }

    const parseNum = (str: string) => {
        if (!str) return NaN;
        const clean = str.replace(/%/g, '').replace(/,/g, '.').replace(/B/g, '').replace(/\$/g, '').replace(/K/g, '').replace(/M/g, '').trim();
        return parseFloat(clean);
    };

    const actVal = parseNum(event.actual);
    const foreVal = parseNum(event.forecast);

    if (isNaN(actVal) || isNaN(foreVal)) return 'inline';

    if (actVal > foreVal) return 'above';
    if (actVal < foreVal) return 'below';
    return 'inline';
}

/**
 * Veri açıklanalı henüz 30 dakika geçip geçmediğini kontrol eder
 */
export function isEventWithin30Minutes(event: CatalogCalendarEvent): boolean {
    if (!event.actual || event.actual === 'Bekleniyor' || event.actual === 'Açıklanacak') {
        return false;
    }

    const releaseTime = getEventReleaseTimestamp(event);
    if (!releaseTime) return false;

    const now = new Date();
    const diffMs = now.getTime() - releaseTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // 0 ile 30 dakika arasında açıklanmışsa yanıp sönmeli!
    return diffMinutes >= 0 && diffMinutes <= 30;
}

