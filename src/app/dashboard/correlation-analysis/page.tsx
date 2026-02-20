"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
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
}

export default function CorrelationAnalysisPage() {
    const { myAssets, isDataLoaded } = useUser();
    const [matrixData, setMatrixData] = useState<CorrelationPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [expandedPair, setExpandedPair] = useState<string | null>(null);

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
                    body: JSON.stringify({ assets: assetList })
                });
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (data.matrix && Array.isArray(data.matrix)) {
                    setMatrixData(data.matrix);
                    setUniqueSymbols(data.symbols || []);
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

        // ── Aynı yönetici mi? ──
        if (infoS.manager !== '-' && infoS.manager !== 'Bilinmiyor' && infoS.manager === infoT.manager) {
            reasons.push(`Her iki varlık da **${infoS.manager}** tarafından yönetiliyor. Aynı portföy yönetim ekibi benzer yatırım stratejileri kullanma eğiliminde olduğundan, varlıklar birbirine paralel hareket edebilir.`);
        }

        // ── Aynı sektör mü? ──
        if (infoS.sector !== 'Bilinmiyor' && infoS.sector === infoT.sector) {
            reasons.push(`Her iki varlık da **${infoS.sector}** sektörüne odaklı. Aynı sektördeki varlıklar, sektöre özgü haberler ve düzenlemelerden benzer şekilde etkilendiği için birlikte hareket etme olasılıkları yüksektir.`);
        }

        // ── Aynı endeksi mi takip ediyor? ──
        if (infoS.sector.includes('BIST') && infoT.sector.includes('BIST') && infoS.sector === infoT.sector) {
            reasons.push(`Her ikisi de **${infoS.sector} endeksini** takip ediyor. Portföylerinde büyük ölçüde aynı hisseler (THYAO, GARAN, ASELS vb.) yer aldığından, neredeyse aynı şekilde hareket etmeleri beklenir.`);
        } else if (infoS.sector.includes('BIST') && infoT.sector.includes('BIST')) {
            reasons.push(`Her ikisi de BIST hisselerine yatırım yapıyor. Ortak hisseler barındırmaları nedeniyle (özellikle büyük şirketler) benzer performans gösterebilirler.`);
        }

        // ── Aynı türde varlıklar mı? ──
        if (infoS.type === infoT.type && infoS.type !== 'Bilinmiyor') {
            if (infoS.type === 'Hisse') {
                reasons.push(`Her iki varlık da **hisse senedi ağırlıklı**. Borsa genel olarak yükseldiğinde ikisi de yükselir, düştüğünde ikisi de düşer.`);
            } else if (infoS.type === 'Borçlanma') {
                reasons.push(`Her ikisi de **sabit getirili (tahvil/bono)** varlık. Faiz oranı değişiklikleri her ikisini de benzer şekilde etkiler.`);
            } else if (infoS.type === 'Karma') {
                reasons.push(`Her ikisi de **karma (çoklu varlık)** fon. Benzer dağılım stratejileri kullanıyorlarsa paralel hareket etmeleri doğaldır.`);
            }
        }

        // ── Farklı türde varlıklar mı? (Düşük korelasyon açıklaması) ──
        if (infoS.type !== infoT.type && infoS.type !== 'Bilinmiyor' && infoT.type !== 'Bilinmiyor') {
            const typeS = infoS.type === 'Hisse' ? 'hisse senedi' : infoS.type === 'Borçlanma' ? 'sabit getirili tahvil' : infoS.type === 'Döviz' ? 'döviz bazlı' : infoS.type;
            const typeT = infoT.type === 'Hisse' ? 'hisse senedi' : infoT.type === 'Borçlanma' ? 'sabit getirili tahvil' : infoT.type === 'Döviz' ? 'döviz bazlı' : infoT.type;
            reasons.push(`${s} bir **${typeS}** varlık iken, ${t} **${typeT}** yapıda. Farklı varlık sınıfları farklı piyasa dinamiklerinden etkilendiğinden, birbirlerinden bağımsız hareket etmeleri beklenir.`);
        }

        // ── Hisse-Hisse aynı sektör mü? ──
        if (infoS.assetType === 'stock' && infoT.assetType === 'stock') {
            const sStock = stockInfo[s];
            const tStock = stockInfo[t];
            if (sStock && tStock) {
                if (sStock.subSector === tStock.subSector) {
                    reasons.push(`**${sStock.name}** ve **${tStock.name}** aynı alt sektörde (${sStock.subSector}) faaliyet gösteriyor. Rakip veya benzer iş modeline sahip şirketler olarak aynı piyasa koşullarından etkileniyorlar.`);
                } else if (sStock.sector === tStock.sector) {
                    reasons.push(`**${sStock.name}** (${sStock.subSector}) ve **${tStock.name}** (${tStock.subSector}) aynı ana sektörde (${sStock.sector}). Sektörel haberler ve düzenlemeler her ikisini de etkileyebilir.`);
                }
            }
        }

        // ── Fon-Hisse: Fon o hisseyi barındırıyor olabilir ──
        if (infoS.assetType === 'fund' && infoT.assetType === 'stock' && infoS.sector.includes('BIST')) {
            reasons.push(`${s} fonu BIST endeksini takip ettiğinden, portföyünde büyük olasılıkla **${stockInfo[t]?.name || t}** hissesi de bulunuyor. Bu nedenle birlikte hareket etmeleri doğaldır.`);
        }
        if (infoT.assetType === 'fund' && infoS.assetType === 'stock' && infoT.sector.includes('BIST')) {
            reasons.push(`${t} fonu BIST endeksini takip ettiğinden, portföyünde büyük olasılıkla **${stockInfo[s]?.name || s}** hissesi de bulunuyor. Bu nedenle birlikte hareket etmeleri doğaldır.`);
        }

        // Korelasyon seviyesi açıklaması
        let levelText = '';
        if (val >= 0.8) {
            levelText = `📈 **Korelasyon: ${val.toFixed(2)}** — Çok yüksek bir birlikte hareket. Bu seviyede iki varlık neredeyse aynı hisseleri/enstrümanları barındırıyor veya aynı piyasa faktörlerine maruz kalıyor demektir. Portföyünüzde **çeşitlendirme etkisi çok düşük**.`;
        } else if (val >= 0.5) {
            levelText = `📊 **Korelasyon: ${val.toFixed(2)}** — Belirgin pozitif ilişki. İki varlık genellikle aynı yönde hareket ediyor. Ortak faktörler (sektör, yönetici, endeks) bu benzerliğe yol açıyor olabilir.`;
        } else if (val >= 0.3) {
            levelText = `📉 **Korelasyon: ${val.toFixed(2)}** — Orta düzey ilişki. Tamamen bağımsız değiller ancak her zaman birlikte de hareket etmiyorlar.`;
        } else if (val >= -0.3) {
            levelText = `✅ **Korelasyon: ${val.toFixed(2)}** — Düşük ilişki. Bu iki varlık büyük ölçüde birbirinden bağımsız hareket ediyor. **İdeal çeşitlendirme** — birindeki kayıp diğerini doğrudan etkilemiyor.`;
        } else {
            levelText = `🛡️ **Korelasyon: ${val.toFixed(2)}** — Negatif korelasyon. Biri yükselirken diğeri düşme eğiliminde. Bu, portföyünüze **doğal bir koruma (hedge)** sağlıyor.`;
        }

        // Birleştir
        if (reasons.length === 0) {
            reasons.push(`${s} ve ${t} arasındaki ilişki piyasa koşullarına bağlı olarak değişkenlik gösterebilir.`);
        }

        return levelText + '\n\n**Neden böyle?**\n' + reasons.map(r => `• ${r}`).join('\n');
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

                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-blue-400">{clean(pair.source)}</span>
                                                                <ChevronRight className="w-3 h-3 text-slate-700" />
                                                                <span className="text-sm font-bold text-white">{clean(pair.target)}</span>
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
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-5 pb-5 pt-2 ml-8 space-y-4">
                                                                    {/* AI Analysis */}
                                                                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <Brain className="w-3.5 h-3.5 text-purple-400" />
                                                                            <span className="text-xs font-semibold text-purple-300">Detaylı Analiz</span>
                                                                        </div>
                                                                        <div className="text-sm text-slate-300 leading-relaxed space-y-2">
                                                                            {getDetailedInsight(pair.source, pair.target, pair.value)
                                                                                .split('\n')
                                                                                .filter(line => line.trim())
                                                                                .map((line, li) => (
                                                                                    <p key={li} className={cn(
                                                                                        line.startsWith('•') ? 'pl-3 text-slate-400' : '',
                                                                                        line.startsWith('**') ? 'font-semibold text-slate-200 mt-3' : ''
                                                                                    )}
                                                                                        dangerouslySetInnerHTML={{
                                                                                            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                                                                        }}
                                                                                    />
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </div>

                                                                    {/* Recommendation */}
                                                                    <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                                                            <span className="text-xs font-semibold text-blue-300">Öneri</span>
                                                                        </div>
                                                                        <p className="text-sm text-slate-400">
                                                                            {getRecommendation(pair.source, pair.target, pair.value)}
                                                                        </p>
                                                                    </div>

                                                                    {/* Scale bar */}
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[10px] text-slate-600 font-mono">-1</span>
                                                                        <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                                                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-green-500 via-50% via-yellow-500 to-red-500 opacity-20" />
                                                                            <div
                                                                                className="absolute top-0 w-3 h-3 rounded-full bg-white shadow-md shadow-white/30 -translate-y-[2px]"
                                                                                style={{ left: `${((pair.value + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-600 font-mono">+1</span>
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
