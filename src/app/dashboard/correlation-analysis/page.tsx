"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SynchronizedCorrelationChart } from "@/components/SynchronizedCorrelationChart";
import {
    Activity,
    ArrowLeft,
    Brain,
    Info,
    Loader2,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    Sparkles,
    BarChart3,
    Layers,
    Target,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CorrelationPair {
    source: string;
    target: string;
    value: number;
    rolling?: number[];
    historySource?: { date: string; price: number }[];
    historyTarget?: { date: string; price: number }[];
    isStructuralOverlap?: boolean;
    events?: MarketEvent[];
}

interface MarketEvent {
    date: string;
    title: string;
    description: string;
    impact: string;
}

export default function CorrelationAnalysisPage() {
    const { myAssets, prices, isDataLoaded } = useUser();
    const [matrixData, setMatrixData] = useState<CorrelationPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [expandedPair, setExpandedPair] = useState<string | null>(null);
    const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);

    // Fetch Correlation Data
    useEffect(() => {
        if (!isDataLoaded || myAssets.length < 2) {
            setLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            try {
                const assetList = myAssets.map((a: any) => ({ symbol: a.symbol, type: a.type }));
                const res = await fetch('/api/portfolio/correlation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assets: assetList,
                        currentPrices: prices // Pass current dashboard prices for exact matching
                    })
                });
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (data.matrix && Array.isArray(data.matrix)) {
                    setMatrixData(data.matrix);
                    setUniqueSymbols(data.symbols || []);
                    setMarketEvents(data.events || []);
                    // Auto-select first asset
                    if (data.symbols && data.symbols.length > 0) {
                        setSelectedAsset(data.symbols[0]);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [isDataLoaded, myAssets]);

    // Helpers
    const getColor = (value: number) => {
        if (value >= 0.7) return "#ef4444";
        if (value >= 0.3) return "#f97316";
        if (value >= -0.3) return "#10b981";
        return "#06b6d4";
    };

    const getBgColor = (value: number) => {
        if (value >= 0.7) return "bg-red-500/10 border-red-500/20";
        if (value >= 0.3) return "bg-orange-500/10 border-orange-500/20";
        if (value >= -0.3) return "bg-green-500/10 border-green-500/20";
        return "bg-cyan-500/10 border-cyan-500/20";
    };

    const getLabel = (value: number) => {
        if (value >= 0.7) return "Yüksek Risk";
        if (value >= 0.3) return "Orta İlişki";
        if (value >= -0.3) return "Düşük / Güvenli";
        return "Negatif (Hedge)";
    };

    const getRiskIcon = (value: number) => {
        if (value >= 0.7) return <AlertTriangle className="w-4 h-4 text-red-400" />;
        if (value >= 0.3) return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
        if (value >= -0.3) return <ShieldCheck className="w-4 h-4 text-green-400" />;
        return <Target className="w-4 h-4 text-cyan-400" />;
    };

    const clean = (s: string) => s.replace('.IS', '');

    // ─────────────────── VARLIK BİLGİ BANKASI ───────────────────
    const fundInfo: Record<string, { name: string; manager: string; type: string; sector: string; holdings: string }> = {
        // Ak Portföy
        'ALC': { name: 'Ak Portföy Çoklu Varlık Fonu', manager: 'Ak Portföy', type: 'Karma', sector: 'Çoklu Varlık', holdings: 'BIST hisseleri, tahvil, eurobond karışımı' },
        'AK2': { name: 'Ak Portföy BIST 30 Endeks Fonu', manager: 'Ak Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 endeksindeki hisseler (THYAO, ASELS, GARAN vb.)' },
        'AKU': { name: 'Ak Portföy Kısa Vadeli Borçlanma', manager: 'Ak Portföy', type: 'Borçlanma', sector: 'Hazine Bonosu', holdings: 'Kısa vadeli devlet tahvili ve bono' },
        'AES': { name: 'Ak Portföy Eurobond Fonu', manager: 'Ak Portföy', type: 'Borçlanma', sector: 'Eurobond', holdings: 'Dolar bazlı Türk eurobondları' },
        'ADA': { name: 'Ak Portföy Amerikan Doları Fonu', manager: 'Ak Portföy', type: 'Döviz', sector: 'USD', holdings: 'Dolar mevduat, dolar cinsi tahviller' },
        'AGE': { name: 'Ak Portföy Getiri Endeksli Fon', manager: 'Ak Portföy', type: 'Borçlanma', sector: 'Enflasyon Endeksli', holdings: 'TÜFE endeksli devlet tahvilleri' },
        // Garanti Portföy
        'GMC': { name: 'Garanti Portföy Çoklu Varlık Fonu', manager: 'Garanti Portföy', type: 'Karma', sector: 'Çoklu Varlık', holdings: 'BIST hisseleri, tahvil, döviz karışımı' },
        'GSH': { name: 'Garanti Portföy Serbest Fon', manager: 'Garanti Portföy', type: 'Serbest', sector: 'Çoklu', holdings: 'Esnek strateji: hisse, tahvil, türev' },
        'GAE': { name: 'Garanti Portföy BIST 30 Fonu', manager: 'Garanti Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 endeksindeki hisseler' },
        'GBO': { name: 'Garanti Portföy Borçlanma Fonu', manager: 'Garanti Portföy', type: 'Borçlanma', sector: 'Devlet Tahvili', holdings: 'Devlet tahvilleri ve hazine bonoları' },
        // İş Portföy
        'IPJ': { name: 'İş Portföy BIST 30 Endeks Fonu', manager: 'İş Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 hisseleri (THYAO, GARAN, ASELS, EREGL vb.)' },
        'IRT': { name: 'İş Portföy Reel Getiri Fonu', manager: 'İş Portföy', type: 'Borçlanma', sector: 'Enflasyon Endeksli', holdings: 'TÜFE endeksli devlet tahvilleri, sabit getirili varlıklar' },
        'IYH': { name: 'İş Portföy Yabancı Hisse Fonu', manager: 'İş Portföy', type: 'Hisse', sector: 'Global Hisse', holdings: 'S&P 500 ETF, global teknoloji hisseleri' },
        'IKA': { name: 'İş Portföy Karma Fon', manager: 'İş Portföy', type: 'Karma', sector: 'Çoklu Varlık', holdings: 'Yerli hisse, tahvil, mevduat' },
        'IST': { name: 'İş Portföy Kısa Vadeli Tahvil Fonu', manager: 'İş Portföy', type: 'Borçlanma', sector: 'Kısa Vadeli Tahvil', holdings: 'Kısa vadeli devlet tahvili' },
        // Yapı Kredi Portföy
        'YAC': { name: 'Yapı Kredi Çoklu Varlık Fonu', manager: 'Yapı Kredi Portföy', type: 'Karma', sector: 'Çoklu Varlık', holdings: 'Hisse, tahvil, döviz dağılımı' },
        'YAS': { name: 'Yapı Kredi BIST 30 Fonu', manager: 'Yapı Kredi Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 hisseleri' },
        'YEF': { name: 'Yapı Kredi Eurobond Fonu', manager: 'Yapı Kredi Portföy', type: 'Borçlanma', sector: 'Eurobond', holdings: 'Dolar cinsi eurobondlar' },
        // TEB Portföy
        'TEF': { name: 'TEB Portföy BIST 30 Fonu', manager: 'TEB Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 hisseleri' },
        'TKF': { name: 'TEB Portföy Karma Fon', manager: 'TEB Portföy', type: 'Karma', sector: 'Çoklu Varlık', holdings: 'Hisse ve tahvil karışımı' },
        // Deniz Portföy
        'DZE': { name: 'Deniz Portföy BIST 100 Fonu', manager: 'Deniz Portföy', type: 'Hisse', sector: 'BIST-100', holdings: 'BIST-100 hisseleri' },
        // QNB Finans
        'FYD': { name: 'QNB Finans BIST 30 Fonu', manager: 'QNB Finans Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 hisseleri' },
        // Ziraat Portföy
        'ZBN': { name: 'Ziraat Portföy Borçlanma Fonu', manager: 'Ziraat Portföy', type: 'Borçlanma', sector: 'Devlet Tahvili', holdings: 'Devlet tahvilleri' },
        'ZSR': { name: 'Ziraat Portföy Serbest Fon', manager: 'Ziraat Portföy', type: 'Serbest', sector: 'Çoklu', holdings: 'Esnek yatırım stratejisi' },
        // Halkbank
        'HBU': { name: 'Halk Portföy Büyüme Fonu', manager: 'Halk Portföy', type: 'Hisse', sector: 'BIST Büyüme', holdings: 'Büyüme potansiyeli olan BIST hisseleri' },
        // Vakıf
        'VEF': { name: 'Vakıf Portföy BIST 30 Fonu', manager: 'Vakıf Portföy', type: 'Hisse', sector: 'BIST-30', holdings: 'BIST-30 hisseleri' },
    };

    const stockInfo: Record<string, { name: string; sector: string; subSector: string }> = {
        'THYAO': { name: 'Türk Hava Yolları', sector: 'Ulaştırma', subSector: 'Havacılık' },
        'ASELS': { name: 'ASELSAN', sector: 'Savunma', subSector: 'Savunma Sanayi' },
        'GARAN': { name: 'Garanti BBVA Bankası', sector: 'Finans', subSector: 'Bankacılık' },
        'AKBNK': { name: 'Akbank', sector: 'Finans', subSector: 'Bankacılık' },
        'YKBNK': { name: 'Yapı Kredi Bankası', sector: 'Finans', subSector: 'Bankacılık' },
        'ISCTR': { name: 'İş Bankası', sector: 'Finans', subSector: 'Bankacılık' },
        'HALKB': { name: 'Halkbank', sector: 'Finans', subSector: 'Kamu Bankacılığı' },
        'VAKBN': { name: 'Vakıfbank', sector: 'Finans', subSector: 'Kamu Bankacılığı' },
        'SISE': { name: 'Şişecam', sector: 'Sanayi', subSector: 'Cam' },
        'EREGL': { name: 'Ereğli Demir Çelik', sector: 'Metal', subSector: 'Demir Çelik' },
        'KRDMD': { name: 'Kardemir', sector: 'Metal', subSector: 'Demir Çelik' },
        'PETKM': { name: 'Petkim', sector: 'Kimya', subSector: 'Petrokimya' },
        'TUPRS': { name: 'Tüpraş', sector: 'Enerji', subSector: 'Petrol Rafinerisi' },
        'SAHOL': { name: 'Sabancı Holding', sector: 'Holding', subSector: 'Çoklu Sektör' },
        'KCHOL': { name: 'Koç Holding', sector: 'Holding', subSector: 'Çoklu Sektör' },
        'TAVHL': { name: 'TAV Havalimanları', sector: 'Ulaştırma', subSector: 'Havalimanı İşletme' },
        'BIMAS': { name: 'BİM Mağazaları', sector: 'Perakende', subSector: 'Market Zinciri' },
        'MGROS': { name: 'Migros', sector: 'Perakende', subSector: 'Market Zinciri' },
        'SOKM': { name: 'ŞOK Market', sector: 'Perakende', subSector: 'Market Zinciri' },
        'TCELL': { name: 'Turkcell', sector: 'Telekomünikasyon', subSector: 'Mobil İletişim' },
        'TTKOM': { name: 'Türk Telekom', sector: 'Telekomünikasyon', subSector: 'Sabit Hat' },
        'PGSUS': { name: 'Pegasus', sector: 'Ulaştırma', subSector: 'Havacılık' },
        'FROTO': { name: 'Ford Otosan', sector: 'Otomotiv', subSector: 'Araç Üretimi' },
        'TOASO': { name: 'Tofaş', sector: 'Otomotiv', subSector: 'Araç Üretimi' },
        'SASA': { name: 'SASA Polyester', sector: 'Kimya', subSector: 'Polyester' },
        'ENKAI': { name: 'Enka İnşaat', sector: 'İnşaat', subSector: 'Müteahhitlik' },
        'EKGYO': { name: 'Emlak Konut GYO', sector: 'GYO', subSector: 'Gayrimenkul' },
        'KOZAL': { name: 'Koza Altın', sector: 'Madencilik', subSector: 'Altın' },
        'KOZAA': { name: 'Koza Anadolu Metal', sector: 'Madencilik', subSector: 'Metal Madencilik' },
        'ARCLK': { name: 'Arçelik', sector: 'Beyaz Eşya', subSector: 'Dayanıklı Tüketim' },
        'VESBE': { name: 'Vestel Beyaz Eşya', sector: 'Beyaz Eşya', subSector: 'Dayanıklı Tüketim' },
        'VESTL': { name: 'Vestel Elektronik', sector: 'Teknoloji', subSector: 'Elektronik' },
        'GUBRF': { name: 'Gübre Fabrikaları', sector: 'Kimya', subSector: 'Gübre' },
        'AEFES': { name: 'Anadolu Efes', sector: 'Gıda', subSector: 'İçecek' },
        'ULKER': { name: 'Ülker', sector: 'Gıda', subSector: 'Gıda Üretimi' },
        'DOHOL': { name: 'Doğan Holding', sector: 'Holding', subSector: 'Çoklu Sektör' },
    };

    const getAssetInfo = (symbol: string) => {
        const s = clean(symbol);
        if (fundInfo[s]) return { ...fundInfo[s], assetType: 'fund' as const };
        if (stockInfo[s]) return { name: stockInfo[s].name, manager: '-', type: 'Hisse', sector: stockInfo[s].sector, holdings: stockInfo[s].subSector, assetType: 'stock' as const };
        // Genel fallback
        if (s.length === 3) return { name: s, manager: 'Bilinmiyor', type: 'Fon', sector: 'Bilinmiyor', holdings: '-', assetType: 'fund' as const };
        return { name: s, manager: '-', type: 'Hisse', sector: 'Bilinmiyor', holdings: '-', assetType: 'stock' as const };
    };

    const getDetailedInsight = (source: string, target: string, val: number) => {
        const s = clean(source);
        const t = clean(target);
        const infoS = getAssetInfo(source);
        const infoT = getAssetInfo(target);

        let reasons: string[] = [];
        const salt = (s.length + t.length + Math.round(val * 100)) % 5;

        // ── Aynı yönetici mi? ──
        if (infoS.manager !== '-' && infoS.manager !== 'Bilinmiyor' && infoS.manager === infoT.manager) {
            const variants = [
                `Hem ${s} hem de ${t} varlıkları ${infoS.manager} tarafından yönetilmektedir. Aynı kurumun uzman ekibi ve strateji yaklaşımı, bu iki varlığın piyasa hareketlerine benzer tepkiler vermesine neden oluyor.`,
                `${infoS.manager} portföy yönetim felsefesi her iki fonda da hakimdir. Bu ortak yönetim anlayışı, varlıkların fiyat davranışlarında yüksek bir senkronizasyon oluşturuyor.`,
                `Bu iki enstrümanın arkasındaki analitik süreç ve yatırım masası aynıdır. Bu durum, piyasa koşullarındaki değişimlerin her iki varlığa da paralel şekilde yansımasını sağlar.`,
                `${infoS.manager} imzası taşıyan bu iki varlık, kurumun genel risk ve getiri beklentileriyle uyumlu hareket etmektedir.`,
                `Yönetici ortaklığı, yatırım kararlarındaki temel 'bakış açısının' aynı olduğunu gösterir; bu da fiyat hareketlerindeki benzerliği açıklayan temel bir unsurdur.`
            ];
            reasons.push(variants[salt % variants.length]);
        }

        // ── Aynı sektör mü? ──
        if (infoS.sector !== 'Bilinmiyor' && infoS.sector === infoT.sector) {
            const variants = [
                `Her iki varlık da ${infoS.sector} sektörüne odaklanmış durumdadır. Sektörel haber akışları, yasal düzenlemeler ve global trendler bu iki enstrümanı ortak bir paydada etkilemektedir.`,
                `${infoS.sector} alanındaki makroekonomik değişimler, bu iki varlığın performansını aynı zaman dilimlerinde tetikleyen ana motor görevi görüyor.`,
                `Aynı sektör grubunda yer alan bu varlıklar, piyasanın sektörel beklentilerine paralel olarak birlikte yükselip düşme eğilimi gösterirler.`,
                `Sektörel döngüler ve büyüme potansiyelleri her iki varlık için de ortak bir risk ve fırsat zemini oluşturmaktadır.`,
                `Bu enstrümanların kaderi büyük ölçüde ${infoS.sector} sektöründeki karlılık ve büyüme rakamlarına bağlıdır.`
            ];
            reasons.push(variants[(salt + 1) % variants.length]);
        }

        // ── Aynı endeksi mi takip ediyor? ──
        if (infoS.sector.includes('BIST') && infoT.sector.includes('BIST') && infoS.sector === infoT.sector) {
            const variants = [
                `Her iki fon da ${infoS.sector} endeksini baz alıyor. Sepetlerindeki ağırlıklı hisselerin ortak olması, fiyat grafiklerinin neredeyse üst üste binmesine yol açıyor.`,
                `Bu iki varlığın temel performans ölçütü ${infoS.sector} endeksidir. Endekse paralel hareket etmek üzere kurgulanan bu yapılar, yerel piyasada eş zamanlı tepkiler verir.`,
                `Ortak bir yatırım evreninde (${infoS.sector}) faaliyet gösteren bu fonlar, borsadaki büyük şirketlerin performansından doğrudan ve benzer şekilde etkilenir.`,
                `${infoS.sector} endeksinin yönü, bu iki varlığın getiri rotasını belirleyen en temel faktördür.`,
                `Aynı kıyas ölçütünü takip etmeleri, bu varlıklar arasında yapısal bir korelasyon oluşturmaktadır.`
            ];
            reasons.push(variants[(salt + 2) % variants.length]);
        } else if (infoS.sector.includes('BIST') && infoT.sector.includes('BIST')) {
            reasons.push(`Her iki varlık da Borsa İstanbul piyasasında yoğunlaşıyor. Ortak hisse senedi havuzundan beslendikleri için genel piyasa iştahındaki değişimler ikisini de etkiliyor.`);
        }

        // ── Aynı türde varlıklar mı? ──
        if (infoS.type === infoT.type && infoS.type !== 'Bilinmiyor') {
            if (infoS.type === 'Hisse') {
                reasons.push(`İki varlığın da ana odağı hisse senetleridir. Özsermaye piyasalarındaki volatilite ve genel yükseliş trendleri bu çiftin hareketlerini senkronize tutuyor.`);
            } else if (infoS.type === 'Borçlanma') {
                reasons.push(`Bu çift sabit getirili menkul kıymetlere (tahvil/bono) dayanmaktadır. Faiz oranlarındaki değişimler ve likidite koşulları her iki varlığı da benzer yönde etkiler.`);
            } else if (infoS.type === 'Karma') {
                reasons.push(`Çoklu varlık yapısına sahip bu fonlar, benzer dağılım modelleri (hisse-tahvil dengesi) kullandıkları için dengeli bir paralellik sergiliyor.`);
            }
        }

        // ── Farklı türde varlıklar mı? (Düşük korelasyon açıklaması) ──
        if (infoS.type !== infoT.type && infoS.type !== 'Bilinmiyor' && infoT.type !== 'Bilinmiyor') {
            const typeS = infoS.type === 'Hisse' ? 'hisse senedi' : infoS.type === 'Borçlanma' ? 'sabit getirili' : infoS.type === 'Döviz' ? 'döviz tabanlı' : infoS.type;
            const typeT = infoT.type === 'Hisse' ? 'hisse senedi' : infoT.type === 'Borçlanma' ? 'sabit getirili' : infoT.type === 'Döviz' ? 'döviz tabanlı' : infoT.type;
            const variants = [
                `${s} bir ${typeS} enstrüman iken, ${t} ${typeT} yapısındadır. Farklı piyasa dinamikleriyle çalışan bu varlıklar, portföyünüzdeki riski dağıtmanıza yardımcı olur.`,
                `Bu iki varlık tamamen farklı finansal mekanizmalar üzerinden değerleniyor. Biri büyüme odaklıyken diğeri koruma odaklı olduğu için ilişkileri düşük seyretmektedir.`,
                `Varlık sınıflarının farklı olması ( ${typeS} vs ${typeT} ), piyasadaki dalgalanmalara karşı portföyünüzde koruyucu bir kalkan görevi görür.`,
                `Bu enstrümanlar piyasa haberlerine zıt veya bağımsız tepkiler verir; bu da yatırım sepetinizde dengeleyici bir unsur oluşturur.`
            ];
            reasons.push(variants[(salt + 3) % variants.length]);
        }

        // ── Hisse-Hisse aynı sektör mü? ──
        if (infoS.assetType === 'stock' && infoT.assetType === 'stock') {
            const sStock = stockInfo[s];
            const tStock = stockInfo[t];
            if (sStock && tStock) {
                if (sStock.subSector === tStock.subSector) {
                    reasons.push(`${sStock.name} ve ${tStock.name} şirketleri doğrudan ${sStock.subSector} alanında faaliyet gösteriyor. Sektörel talepler ve rakip şirketlerin ortak maliyetleri, fiyatları benzer yönde hareket ettiriyor.`);
                } else if (sStock.sector === tStock.sector) {
                    reasons.push(`Her iki şirket de ${sStock.sector} ana sektörü altında yer alıyor. Sektöre yönelik genel teşvikler veya kısıtlamalar bu iki kağıdı da etkileyen ortak faktörlerdir.`);
                }
            }
        }

        // ── Fon-Hisse: Fon o hisseyi barındırıyor olabilir ──
        if (infoS.assetType === 'fund' && infoT.assetType === 'stock' && infoS.sector.includes('BIST')) {
            reasons.push(`${s} fonu endeks bazlı bir portfeye sahiptir. Portföyünde yüksek olasılıkla ${stockInfo[t]?.name || t} hissesini de barındırdığı için aralarında doğal bir bağ bulunmaktadır.`);
        }
        if (infoT.assetType === 'fund' && infoS.assetType === 'stock' && infoT.sector.includes('BIST')) {
            reasons.push(`${t} fonunun sepetinde ${stockInfo[s]?.name || s} hissesi yer alma ihtimali yüksektir. Bu durum, fonun getirisini doğrudan bu hissenin performansına duyarlı hale getirir.`);
        }

        // Korelasyon seviyesi açıklaması
        let summaryText = '';
        if (val >= 0.8) {
            summaryText = `Korelasyon Oranı: ${val.toFixed(2)} — Çok yüksek bir birlikte hareket söz konusu. Bu seviye, iki varlığın neredeyse aynı risk gruplarında bulunduğunu gösterir. Çeşitlendirme etkisi bu çift için oldukça düşüktür.`;
        } else if (val >= 0.5) {
            summaryText = `Korelasyon Oranı: ${val.toFixed(2)} — Belirgin bir pozitif ilişki mevcut. Varlıklar piyasa koşullarına genellikle aynı yönde tepki veriyor. Ortak sektörel veya yönetimsel faktörler bu benzerliği beslemektedir.`;
        } else if (val >= 0.3) {
            summaryText = `Korelasyon Oranı: ${val.toFixed(2)} — Orta düzeyde bir ilişki izleniyor. Varlıklar tamamen bağımsız olmasa da her zaman aynı yöne gitmiyorlar; bu da sınırlı bir çeşitlendirme sunar.`;
        } else if (val >= -0.3) {
            summaryText = `Korelasyon Oranı: ${val.toFixed(2)} — Düşük ve sağlıklı bir ilişki seviyesi. Bu iki değer birbirinden büyük ölçüde bağımsız hareket ederek portföyünüzün risk dağılımını ideal bir noktaya taşıyor.`;
        } else {
            summaryText = `Korelasyon Oranı: ${val.toFixed(2)} — Negatif korelasyon tespit edildi. Bu varlıklar birbirinin zıttı yönlerde hareket etme eğilimindedir, bu da piyasa düşüşlerinde portföyünüz için doğal bir sigorta işlevi görür.`;
        }

        // Birleştir
        if (reasons.length === 0) {
            reasons.push(`${s} ve ${t} arasındaki ilişki güncel piyasa dinamiklerine ve makro ekonomik verilere bağlı olarak şekillenmektedir.`);
        }

        return summaryText + '\n\nAnaliz Detayları:\n' + reasons.map(r => `• ${r}`).join('\n');
    };

    const getRecommendation = (source: string, target: string, val: number) => {
        const s = clean(source);
        const t = clean(target);
        const infoS = getAssetInfo(source);
        const infoT = getAssetInfo(target);

        if (val >= 0.7) {
            if (infoS.manager !== '-' && infoS.manager === infoT.manager) {
                return `⚠️ ${s} ve ${t} aynı yönetici (${infoS.manager}) tarafından yönetiliyor ve çok benzer hareket ediyor. Farklı bir portföy yöneticisinin fonuna geçmeyi veya birini azaltmayı düşünün.`;
            }
            if (infoS.sector === infoT.sector && infoS.sector.includes('BIST')) {
                return `⚠️ Her ikisi de ${infoS.sector} endeksini takip ediyor, neredeyse aynı fonlar. İkisinden birini tutmak yeterli — diğerinin yerine farklı bir varlık sınıfı (tahvil, döviz, altın) eklemeyi düşünün.`;
            }
            return `⚠️ Bu iki varlık çok benzer hareket ediyor. Gerçek bir çeşitlendirme için birini farklı sektör, varlık sınıfı veya coğrafyadan bir alternatifle değiştirmeyi düşünün.`;
        }
        if (val >= 0.3) {
            return `📊 Orta düzey benzerlik mevcut. Portföyü güçlendirmek için bu ikisinin yanına düşük korelasyonlu (tahvil, altın veya farklı sektör) bir varlık eklenebilir.`;
        }
        if (val >= -0.3) {
            return `✅ Mükemmel kombinasyon! Bu iki varlık birbirinden bağımsız hareket ediyor. Portföyünüzde bu dengeyi korumaya devam edin.`;
        }
        return `🛡️ Doğal hedge! ${s} ve ${t} ters yönde hareket ediyor. Piyasa düşüşlerinde portföyünüzü koruyan harika bir çift.`;
    };

    // Get pairs for selected asset (exclude self-correlation)
    const selectedPairs = useMemo(() => {
        if (!selectedAsset) return [];
        return matrixData
            .filter(d => d.source === selectedAsset && d.target !== selectedAsset)
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }, [selectedAsset, matrixData]);

    // Diversification score
    const diversificationScore = useMemo(() => {
        const allPairs: CorrelationPair[] = [];
        const seen = new Set<string>();
        matrixData.forEach(item => {
            if (item.source === item.target) return;
            const key = [item.source, item.target].sort().join('-');
            if (!seen.has(key)) { seen.add(key); allPairs.push(item); }
        });
        if (allPairs.length === 0) return 0;
        const highCorrCount = allPairs.filter(p => p.value > 0.5).length;
        return Math.max(0, Math.round(100 - (highCorrCount / allPairs.length) * 100));
    }, [matrixData]);

    // LOADING
    if (!isDataLoaded || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
                <div className="w-full max-w-sm p-8 rounded-3xl bg-slate-900/50 border border-white/10 text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Korelasyon Analizi</h2>
                    <p className="text-slate-400 text-sm animate-pulse">Portföy verileri analiz ediliyor...</p>
                </div>
            </div>
        );
    }

    // NOT ENOUGH
    if (myAssets.length < 2) {
        return (
            <div className="min-h-screen p-8 bg-[#020617] flex flex-col items-center justify-center text-center">
                <Brain className="w-16 h-16 text-slate-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Yetersiz Veri</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Korelasyon analizi için portföyünüzde en az 2 farklı varlık gereklidir.
                </p>
                <Link href="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    Portföye Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-8 lg:p-12 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* Back */}
                <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Dashboard'a Dön
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Activity className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Portföy Korelasyon Raporu</h1>
                            <p className="text-sm text-slate-500 mt-0.5">{uniqueSymbols.length} varlık analiz edildi</p>
                        </div>
                    </div>
                    <p className="text-slate-400 max-w-3xl leading-relaxed mt-3">
                        Aşağıdan bir varlık seçin ve o varlığın portföyünüzdeki diğer varlıklarla olan ilişkisini detaylı olarak inceleyin.
                    </p>
                </div>

                {/* Asset Selector Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {uniqueSymbols.map((sym) => (
                        <button
                            key={sym}
                            onClick={() => { setSelectedAsset(sym); setExpandedPair(null); }}
                            className={cn(
                                "px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                                selectedAsset === sym
                                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                    : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white hover:border-white/10"
                            )}
                        >
                            {clean(sym)}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT: Selected Asset Pairs */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedAsset}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-slate-900/30 rounded-2xl border border-white/5 overflow-hidden"
                            >
                                {/* Section Header */}
                                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/30">
                                            {selectedAsset ? clean(selectedAsset).substring(0, 2) : '?'}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selectedAsset ? clean(selectedAsset) : ''}</h2>
                                            <p className="text-xs text-slate-500">{selectedPairs.length} varlık ile karşılaştırıldı</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pairs List */}
                                <div className="divide-y divide-white/5">
                                    {selectedPairs.length === 0 ? (
                                        <div className="text-center py-12 text-slate-600">
                                            <Info className="w-8 h-8 mx-auto mb-3" />
                                            <p>Bu varlık için korelasyon verisi bulunamadı.</p>
                                        </div>
                                    ) : (
                                        selectedPairs.map((pair, idx) => {
                                            const pairKey = `${pair.source}-${pair.target}`;
                                            const isExpanded = expandedPair === pairKey;

                                            return (
                                                <motion.div
                                                    key={pairKey}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    {/* Row */}
                                                    <div
                                                        onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                                                        className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {getRiskIcon(pair.value)}

                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-blue-400">{clean(pair.source)}</span>
                                                                    <ChevronRight className="w-3 h-3 text-slate-700" />
                                                                    <span className="text-sm font-bold text-white">{clean(pair.target)}</span>
                                                                </div>
                                                                {pair.isStructuralOverlap && (
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <div className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-1">
                                                                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                                                                            <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter">AYNI VARLIKLAR</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <span
                                                                className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getBgColor(pair.value))}
                                                                style={{ color: getColor(pair.value) }}
                                                            >
                                                                {getLabel(pair.value)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            {/* Correlation Bar */}
                                                            <div className="hidden sm:flex items-center gap-2 w-32">
                                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${((pair.value + 1) / 2) * 100}%`,
                                                                            backgroundColor: getColor(pair.value)
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <span className="text-lg font-bold min-w-[50px] text-right" style={{ color: getColor(pair.value) }}>
                                                                {pair.value.toFixed(2)}
                                                            </span>

                                                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                                <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Detail */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.25 }}
                                                                className="overflow-visible"
                                                            >
                                                                <div className="px-4 pb-6 pt-2 space-y-4">
                                                                    {/* Enhanced Synchronized Charts */}
                                                                    {pair.historySource && pair.historyTarget && (
                                                                        <div className="bg-white/[0.01] rounded-[2.5rem] p-5 border border-white/5 shadow-2xl backdrop-blur-3xl">
                                                                            <SynchronizedCorrelationChart
                                                                                sourceSymbol={pair.source}
                                                                                targetSymbol={pair.target}
                                                                                historySource={pair.historySource}
                                                                                historyTarget={pair.historyTarget}
                                                                                rollingCorrelation={pair.rolling || []}
                                                                                events={pair.events || []}
                                                                                correlationValue={pair.value}
                                                                                isStructuralOverlap={pair.isStructuralOverlap}
                                                                                customInsight={getDetailedInsight(pair.source, pair.target, pair.value)}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Quick Recommendation Badge */}
                                                                    <div className="flex flex-wrap gap-2 px-2">
                                                                        <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                                                                            <Brain className="w-3 h-3 text-blue-400" />
                                                                            <span className="text-[9px] font-bold text-slate-500">STRATEJİ:</span>
                                                                            <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                                                                {pair.value > 0.7 ? "Çeşitlendirme Gerekli" : "İdeal Risk Dağılımı"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Diversification Score */}
                        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/50 border border-blue-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-4 h-4 text-green-400" />
                                <h3 className="text-sm font-bold text-white">Çeşitlendirme Skoru</h3>
                            </div>
                            <div className="flex items-end gap-2 mb-3">
                                <span className="text-4xl font-bold text-white">{diversificationScore}</span>
                                <span className="text-sm text-slate-500 mb-1">/ 100</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        diversificationScore >= 70 ? "bg-green-500" :
                                            diversificationScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${diversificationScore}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {diversificationScore >= 70
                                    ? "Portföyünüz iyi çeşitlendirilmiş."
                                    : diversificationScore >= 40
                                        ? "Orta düzeyde çeşitlilik. Farklı sektörler eklemeyi düşünün."
                                        : "Varlıklar yoğunlaşmış, risk dağılımı zayıf."
                                }
                            </p>
                        </div>

                        {/* Mini Heatmap */}
                        <div className="bg-slate-900/30 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                <h3 className="text-xs font-bold text-white">Isı Haritası</h3>
                            </div>

                            <div className="overflow-hidden">
                                <div
                                    className="grid gap-[2px]"
                                    style={{ gridTemplateColumns: `16px repeat(${uniqueSymbols.length}, 1fr)` }}
                                >
                                    <div />
                                    {uniqueSymbols.map((sym, i) => (
                                        <div key={`h-${i}`} className="flex items-center justify-center">
                                            <span className={cn(
                                                "text-[6px] font-bold truncate",
                                                selectedAsset === sym ? "text-blue-400" : "text-slate-600"
                                            )}>
                                                {clean(sym).substring(0, 3)}
                                            </span>
                                        </div>
                                    ))}

                                    {uniqueSymbols.map((rowSym, i) => (
                                        <>
                                            <div key={`r-${i}`} className="flex items-center justify-end pr-[2px]">
                                                <span className={cn(
                                                    "text-[6px] font-bold truncate",
                                                    selectedAsset === rowSym ? "text-blue-400" : "text-slate-600"
                                                )}>
                                                    {clean(rowSym).substring(0, 3)}
                                                </span>
                                            </div>
                                            {uniqueSymbols.map((colSym, j) => {
                                                const cell = matrixData.find(d => d.source === rowSym && d.target === colSym);
                                                const val = cell ? cell.value : 0;
                                                const isSelf = i === j;
                                                const isHighlighted = selectedAsset === rowSym || selectedAsset === colSym;

                                                return (
                                                    <div
                                                        key={`c-${i}-${j}`}
                                                        className={cn(
                                                            "aspect-square rounded-[2px] transition-all",
                                                            isHighlighted && !isSelf ? "ring-1 ring-white/20" : ""
                                                        )}
                                                        style={{
                                                            backgroundColor: isSelf ? '#1e293b' : getColor(val),
                                                            opacity: isSelf ? 0.2 : isHighlighted ? 1 : 0.4
                                                        }}
                                                        title={`${clean(rowSym)} ↔ ${clean(colSym)}: ${val.toFixed(2)}`}
                                                    />
                                                );
                                            })}
                                        </>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 text-[8px] text-slate-600">
                                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-cyan-500" /> Negatif</div>
                                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-green-500" /> Düşük</div>
                                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-orange-500" /> Orta</div>
                                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-red-500" /> Yüksek</div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-slate-900/30 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-slate-400" />
                                Nasıl Okunur?
                            </h3>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Soldaki listeden bir varlık seçin. O varlığın portföyünüzdeki diğer varlıklarla ilişkisi (korelasyonu) gösterilir.
                                <strong className="text-slate-400"> +1</strong> tam benzerlik,
                                <strong className="text-slate-400"> 0</strong> ilişkisizlik,
                                <strong className="text-slate-400"> −1</strong> ters orantı demektir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
