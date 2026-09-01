export interface TechnicalTermTooltip {
    term: string;
    label: string;
    definition: string;
}

export interface IndicatorProfile {
    id: string;
    name: string;
    country: string;
    flag: string;
    category: 'Enflasyon' | 'İstihdam' | 'Faiz & Para Politikası' | 'Büyüme & İmalat' | 'Dış Ticaret';
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    unit: string; // '%', 'K', 'B $', 'Puan'
    higherIsPositive: boolean; // Gösterge yönü
    definition: string; // 1. Tanım
    whatItMeasures: string; // 2. Ne ölçer?
    whyItMatters: string; // 3. Neden önemlidir?
    impactChannels: Array<{ title: string; desc: string }>; // Etki zinciri
    readingChartGuide: string; // Grafik nasıl okunur?
    whatWeCannotInfer: string; // Ne çıkaramayız?
    financialLiteracyItems: Array<{ title: string; content: string }>; // Finansal Okuryazarlık
    relatedIndicators: Array<{ name: string; id: string; category: string }>; // İlgili göstergeler
}

export const TECHNICAL_TERMS: Record<string, TechnicalTermTooltip> = {
    actual: {
        term: 'actual',
        label: 'Açıklanan Veri',
        definition: 'Ekonomik göstergenin ilgili dönem için resmi kurumlarca yayınlanan gerçekleşen nihai değeridir.'
    },
    forecast: {
        term: 'forecast',
        label: 'Beklenti',
        definition: 'Verinin açıklanmasından önce piyasa analistleri ve kurumsal kurumların tahmin ortalamasıdır.'
    },
    previous: {
        term: 'previous',
        label: 'Önceki',
        definition: 'Bir önceki açıklama döneminde yayınlanan (veya revize edilen) resmi referans değerdir.'
    },
    dezenflasyon: {
        term: 'dezenflasyon',
        label: 'Dezenflasyon',
        definition: 'Fiyatların düşmesi değil, enflasyon oranının (fiyat artış hızının) yavaşlaması sürecidir.'
    },
    baseEffect: {
        term: 'baseEffect',
        label: 'Baz Etkisi',
        definition: 'Bir önceki yılın aynı dönemindeki sıra dışı yüksek veya düşük değerlerin yıllık artış oranına olan etkisidir.'
    }
};

export const INDICATOR_PROFILES_DATABASE: Record<string, IndicatorProfile> = {
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": {
        id: "tr_cpi_mom",
        name: "Aylık Tüketici Fiyat Endeksi (TÜFE)",
        country: "TR",
        flag: "🇹🇷",
        category: "Enflasyon",
        impactLevel: "critical",
        unit: "%",
        higherIsPositive: false,
        definition: "Tüketici Fiyat Endeksi (TÜFE), hanehalklarının tükettiği mal ve hizmet sepetinin aylık bazdaki ortalama fiyat değişimini ölçer.",
        whatItMeasures: "Hanehalkı harcama sepetindeki aylık fiyat artış hızını ve Türk Lirası'nın satın alma gücündeki aylık erimeyi ölçer.",
        whyItMatters: "TCMB faiz kararlarını, mevduat getirilerini, ev kiralarını ve maaş zam oranlarını doğrudan belirleyen en kritik makro veridir.",
        impactChannels: [
            { title: "Enflasyon Beklentileri", desc: "Aylık fiyat artış hızı piyasanın gelecek dönem enflasyon patikasını şekillendirir." },
            { title: "Para Politikası & Faizler", desc: "Yüksek aylık enflasyon Merkez Bankası'nı sıkı para politikası ve faiz artışına sevk edebilir." },
            { title: "Mevduat & Kredi Maliyetleri", desc: "Faizlerin tırmanmasıyla kredi çekmek zorlaşır, vadeli mevduat getirisi yükselir." },
            { title: "Finansal Varlık Değerlemeleri", desc: "Borsa şirketlerinin kârlılıkları ve döviz kuru dengeleri üzerinde doğrudan etki yapar." }
        ],
        readingChartGuide: "Grafikteki her nokta ilgili ay açıklanan aylık enflasyonu gösterir. Çizginin aşağı yönelmesi enflasyon hızının yavaşladığını (dezenflasyon), yukarı yönelmesi fiyat artışlarının hızlandığını gösterir.",
        whatWeCannotInfer: "Tek bir aylık TÜFE açıklamasından enflasyonun uzun vadeli trendinin kalıcı olarak kırıldığı sonucu çıkarılamaz. Sonraki aylar ve çekirdek göstergelerle birlikte değerlendirilmelidir.",
        financialLiteracyItems: [
            { title: "Aylık ve Yıllık Enflasyon Arasındaki Fark Nedir?", content: "Aylık enflasyon sadece son 30 gündeki fiyat değişimini, yıllık enflasyon ise son 12 ayın toplam birikimli artışını gösterir." },
            { title: "Çekirdek Enflasyon Nedir?", content: "Gıda ve enerji gibi oynak fiyatlı kalemlerin çıkarılmasıyla hesaplanan ana enflasyon eğilimi göstergesidir." }
        ],
        relatedIndicators: [
            { name: "Yıllık Enflasyon Oranı (TÜFE)", id: "tr_cpi_yoy", category: "Enflasyon" },
            { name: "Aylık Üretici Fiyat Endeksi (ÜFE)", id: "tr_ppi_mom", category: "Enflasyon" },
            { name: "TCMB Politika Faizi Kararı", id: "tr_cbrt_rate", category: "Faiz & Para Politikası" }
        ]
    },
    "Yıllık Enflasyon Oranı (TÜFE)": {
        id: "tr_cpi_yoy",
        name: "Yıllık Enflasyon Oranı (TÜFE)",
        country: "TR",
        flag: "🇹🇷",
        category: "Enflasyon",
        impactLevel: "critical",
        unit: "%",
        higherIsPositive: false,
        definition: "Yıllık TÜFE Enflasyonu, son 12 ay içerisindeki tüketici fiyat seviyesinin birikimli yıllık artış oranını gösterir.",
        whatItMeasures: "Ülkedeki genel fiyat düzeyinin 1 yıllık zaman ufku içerisindeki toplam artış hızını ölçer.",
        whyItMatters: "Kira artış tavanları, asgari ücret güncellemeleri ve memur/emekli zam oranları resmi olarak bu veriye dayanır.",
        impactChannels: [
            { title: "Yıllık Kira & Ücret Zamları", desc: "Resmi kira tavanları ve maaş güncellemeleri yıllık TÜFE oranına göre belirlenir." },
            { title: "Reel Faiz Hesaplaması", desc: "Mevduat faizinin enflasyon karşısındaki reel getirisini ortaya koyar." },
            { title: "Sermaye Hareketleri", desc: "Dezenflasyon sürecinin inandırıcılığı yabancı sermaye girişlerini teşvik eder." }
        ],
        readingChartGuide: "Yıllık grafikteki düşüş eğilimi dezenflasyon sürecini temsil eder. Değerin gerilemesi fiyatların düştüğü anlamına değil, fiyat artış hızının yavaşladığı anlamına gelir.",
        whatWeCannotInfer: "Yıllık enflasyonun düşmesi market fiyatlarının ucuzladığı anlamına gelmez; fiyatların geçen yıla göre daha yavaş pahalandığını gösterir.",
        financialLiteracyItems: [
            { title: "Dezenflasyon ile Deflasyon Arasındaki Fark", content: "Dezenflasyon fiyat artış hızının yavaşlamasıdır. Deflasyon ise fiyatların genel olarak mutlak gerilemesidir." }
        ],
        relatedIndicators: [
            { name: "Aylık Tüketici Fiyat Endeksi (TÜFE)", id: "tr_cpi_mom", category: "Enflasyon" },
            { name: "TCMB Politika Faizi Kararı", id: "tr_cbrt_rate", category: "Faiz & Para Politikası" }
        ]
    },
    "Fed Politika Faizi Kararı": {
        id: "us_fed_rate",
        name: "Fed Politika Faizi Kararı",
        country: "ABD",
        flag: "🇺🇸",
        category: "Faiz & Para Politikası",
        impactLevel: "critical",
        unit: "%",
        higherIsPositive: true,
        definition: "Fed (ABD Merkez Bankası) politika faizi kararı, küresel finansal sistemdeki Dolar borçlanma maliyetinin taban seviyesidir.",
        whatItMeasures: "Küresel Dolar likiditesinin fiyatını ve borçlanma maliyetini ölçer.",
        whyItMatters: "Dünya borsaları, Ons Altın, gelişmekte olan ülke para birimleri ve küresel kredi mekanizması üzerinde birinci derecede etkilidir.",
        impactChannels: [
            { title: "Küresel Dolar Likiditesi", desc: "Faiz artışları küresel Doları güçlendirir, faiz indirimleri piyasaya likidite akıtır." },
            { title: "Tahvil & Borçlanma Piyasaları", desc: "ABD 10 Yıllık tahvil faizlerini ve küresel kredi maliyetlerini doğrudan şekillendirir." },
            { title: "Altın & Borsa Değerlemeleri", desc: "Düşük faiz risk iştahını artırarak borsa ve altın fiyatlarını destekleyebilir." }
        ],
        readingChartGuide: "Faiz grafiğindeki merdiven basamakları para politikası döngülerini (sıkılaşma / gevşeme) gösterir.",
        whatWeCannotInfer: "Fed faiz indirdiği an tüm borsaların kesin yükseleceği çıkarılamaz; resesyon endişeleri varsa hisse piyasaları baskılanabilir.",
        financialLiteracyItems: [
            { title: "Fed Notları ve Dot Plot Nedir?", content: "Fed üyelerinin geleceğe dair faiz tahminlerini gösteren nokta grafiktir." }
        ],
        relatedIndicators: [
            { name: "Tarım Dışı İstihdam Değişimi (NFP)", id: "us_nfp", category: "İstihdam" },
            { name: "ISM İmalat PMI Endeksi", id: "us_ism_pmi", category: "Büyüme & İmalat" }
        ]
    },
    "Default": {
        id: "default_indicator",
        name: "Ekonomik Gösterge",
        country: "TR",
        flag: "🌐",
        category: "Büyüme & İmalat",
        impactLevel: "medium",
        unit: "%",
        higherIsPositive: true,
        definition: "Makroekonomik piyasa takibinde kullanılan resmi ekonomik gösterge verisidir.",
        whatItMeasures: "Piyasadaki ekonomik aktivite düzeyini ve finansal dengeleri ölçer.",
        whyItMatters: "Yatırımcı kararlarını ve makroekonomik beklentileri yönlendirir.",
        impactChannels: [
            { title: "Piyasa Beklentileri", desc: "Veri gerçekleşmeleri piyasa beklentilerini şekillendirir." },
            { title: "Para Politikası", desc: "Merkez bankalarının politika kararlarına girdi sağlar." }
        ],
        readingChartGuide: "Grafikteki değişimler ilgili dönemdeki makro eğilimi temsil eder.",
        whatWeCannotInfer: "Tek veri açıklamasından uzun vadeli piyasa yönü çıkarılamaz.",
        financialLiteracyItems: [
            { title: "Makro Veri Nedir?", content: "Ekonominin genel sağlık durumunu gösteren istatistiki göstergelerdir." }
        ],
        relatedIndicators: []
    }
};
