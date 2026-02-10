"use client";

import { useState, useEffect, Fragment } from "react";
import { Search, Filter, Loader2, Info, TrendingUp, TrendingDown, Layers, Database, ChevronDown, ChevronUp, ExternalLink, DollarSign, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to estimate holdings based on fund info
const getEstimatedHoldings = (fund: any) => {
    const code = fund.code;
    const name = fund.title.toUpperCase();
    const cat = fund.category;

    // 1. Specific Famous Funds (Hardcoded for accuracy)
    if (code === 'MAC') return "THYAO, KCHOL, TCELL, BIMAS, MGROS";
    if (code === 'TCD') return "GARAN, ISCTR, AKBNK, YKBNK, SAHOL";
    if (code === 'IPJ') return "Tesla (TSLA), BYD, Ford, Albemarle, Pilbara";
    if (code === 'AFT') return "NVIDIA, Microsoft, Apple, Amazon, Google";
    if (code === 'YAY') return "Apple, Microsoft, Amazon, NVIDIA, Alphabet";
    if (code === 'AFA') return "JP Morgan, Bank of America, Wells Fargo, Visa, Mastercard";
    if (code === 'TI2') return "İş Bankası İştirakleri (ISCTR, SISE, TSKB, ISGYO, ISMEN)";
    if (code === 'TI3') return "İş Bankası İştirakleri (ISCTR, SISE, ANHYT, ISFIN, TSKB)";
    if (code === 'HKH') return "THYAO, TUPRS, KCHOL, SAHOL, EREGL";
    if (code === 'ST1') return "Endeks Hisseleri (BIST 30)";
    if (code === 'AES') return "Petrol, Doğalgaz, Enerji Şirketleri (XOM, CVX, SHELL)";

    // 2. Name-based Heuristics
    if (name.includes('ALTIN')) return "Kıymetli Madenler (Altın), Altın Sertifikası (GLDTR)";
    if (name.includes('GÜMÜŞ')) return "Gümüş Fonu (GMSTR), Gümüş Madeni İşletmeleri";
    if (name.includes('TEKNOLOJİ') || name.includes('BİLİŞİM')) {
        if (name.includes('YABANCI')) return "NVIDIA, Apple, Microsoft, Broadcom, AMD";
        return "ASELS, LOGO, KFEIN, ARDYZ, VBTYZ";
    }
    if (name.includes('BANKA')) return "AKBNK, GARAN, ISCTR, YKBNK, VAKBN";
    if (name.includes('SÜRDÜRÜLEBİLİRLİK')) return "SISE, TUPRS, EREGL, FROTO, ARCLK";
    if (name.includes('KOÇ')) return "KCHOL, FROTO, TUPRS, ARCLK, YKBNK";
    if (name.includes('META')) return "Meta Platforms, Roblox, Unity, NVIDIA, Microsoft";
    if (name.includes('BLOCKCHAIN') || name.includes('BLOKZİNCİR')) return "Coinbase, Riot, Marathon Digital, NVIDIA, Block";
    if (name.includes('TARIM')) return "Deere & Co, Corteva, Nutrien, Archer-Daniels, Bunge";
    if (name.includes('SAĞLIK')) return "Pfizer, Moderna, Johnson & Johnson, Merck, AbbVie";
    if (name.includes('TURİZM')) return "THYAO, PGSUS, DOCO, AYGAZ, CLEBI";

    // 3. Category-based Fallbacks
    if (cat === 'Hisse Senedi Şemsiye Fonu') return "BIST 100 Hisseleri (THYAO, KCHOL, TUPRS, EREGL, ASELS)";
    if (cat === 'Borçlanma Araçları Şemsiye Fonu') return "Devlet Tahvili, Özel Sektör Tahvili, Finansman Bonosu";
    if (cat === 'Para Piyasası Şemsiye Fonu') return "Mevduat, Ters Repo, Takasbank Para Piyasası";
    if (cat === 'Kıymetli Madenler Şemsiye Fonu') return "Altın, Gümüş, Platin, Kıymetli Maden Sertifikaları";
    if (cat === 'Fon Sepeti Şemsiye Fonu') return "Yabancı Borsa Yatırım Fonları (ETF), Yerli Yatırım Fonları";
    if (cat === 'Katılım Şemsiye Fonu') return "Kira Sertifikaları (Sukuk), Katılım Hesabı, Katılım Hisseleri";
    if (cat === 'Karma Şemsiye Fonu') return "Hisse Senedi, Tahvil, Altın, Döviz (Dengeli Dağılım)";
    if (cat === 'Değişken Şemsiye Fonu') return "Aktif Yönetilen Portföy (Hisse, Türev, Borçlanma Araçları)";
    if (cat === 'Serbest Şemsiye Fonu') return "Nitelikli Yatırımcıya Özel (Hisse, Eurobond, Varant, Türev)";

    return "Çeşitli Yatırım Araçları (Mevduat, Repo, Tahvil)";
};

// Category Mapping for User Friendly Names
const getCategoryLabel = (cat: string) => {
    if (cat === 'Hisse Senedi Şemsiye Fonu') return { label: 'Hisse Senedi', color: 'bg-blue-500/20 text-blue-300' };
    if (cat === 'Kıymetli Madenler Şemsiye Fonu') return { label: 'Kıymetli Maden', color: 'bg-yellow-500/20 text-yellow-300' };
    if (cat === 'Serbest Şemsiye Fonu') return { label: 'Serbest Fon', color: 'bg-purple-500/20 text-purple-300' };
    if (cat === 'Fon Sepeti Şemsiye Fonu') return { label: 'Fon Sepeti', color: 'bg-orange-500/20 text-orange-300' };
    if (cat === 'Para Piyasası Şemsiye Fonu') return { label: 'Para Piyasası', color: 'bg-emerald-500/20 text-emerald-300' };
    if (cat === 'Borçlanma Araçları Şemsiye Fonu') return { label: 'Borçlanma', color: 'bg-cyan-500/20 text-cyan-300' };
    if (cat === 'Katılım Şemsiye Fonu') return { label: 'Katılım', color: 'bg-green-500/20 text-green-300' };
    return { label: cat.replace(' Şemsiye Fonu', ''), color: 'bg-slate-500/20 text-slate-300' };
};

export default function DataPage() {
    const [funds, setFunds] = useState<any[]>([]);
    const [filteredFunds, setFilteredFunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [expandedFund, setExpandedFund] = useState<string | null>(null);
    const [detailedFunds, setDetailedFunds] = useState<Record<string, any>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

    // Fetch Funds on Mount
    useEffect(() => {
        const fetchFunds = async () => {
            try {
                const res = await fetch('/api/tefas/list');
                const data = await res.json();
                if (data.success) {
                    // Enrich data with estimated holdings
                    const enriched = data.data.map((f: any) => ({
                        ...f,
                        holdings: getEstimatedHoldings(f)
                    }));
                    setFunds(enriched);
                    setFilteredFunds(enriched);
                }
            } catch (error) {
                console.error("Failed to fetch funds", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFunds();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = funds;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter((f: any) => 
                f.code.toLowerCase().includes(lowerTerm) || 
                f.title.toLowerCase().includes(lowerTerm) ||
                f.holdings.toLowerCase().includes(lowerTerm)
            );
        }

        if (selectedCategory !== "Tümü") {
            if (selectedCategory === "Hisse") result = result.filter((f: any) => f.category === 'Hisse Senedi Şemsiye Fonu' || f.title.toUpperCase().includes('HİSSE'));
            else if (selectedCategory === "Altın/Maden") result = result.filter((f: any) => f.category === 'Kıymetli Madenler Şemsiye Fonu' || f.title.toUpperCase().includes('ALTIN') || f.title.toUpperCase().includes('GÜMÜŞ'));
            else if (selectedCategory === "Serbest") result = result.filter((f: any) => f.category === 'Serbest Şemsiye Fonu');
            else if (selectedCategory === "Döviz/Yabancı") result = result.filter((f: any) => f.category === 'Fon Sepeti Şemsiye Fonu' || f.title.toUpperCase().includes('YABANCI') || f.title.toUpperCase().includes('DÖVİZ'));
            else if (selectedCategory === "Faiz/Para") result = result.filter((f: any) => f.category === 'Para Piyasası Şemsiye Fonu' || f.category === 'Borçlanma Araçları Şemsiye Fonu' || f.title.toUpperCase().includes('MEVDUAT'));
        }

        setFilteredFunds(result);
    }, [searchTerm, selectedCategory, funds]);

    const categories = ["Tümü", "Hisse", "Altın/Maden", "Serbest", "Döviz/Yabancı", "Faiz/Para"];

    const toggleExpand = async (code: string) => {
        if (expandedFund === code) {
            setExpandedFund(null);
        } else {
            setExpandedFund(code);
            // Fetch detailed info if not already cached/fetched
            if (!detailedFunds[code]) {
                setLoadingDetails(prev => ({ ...prev, [code]: true }));
                try {
                    const res = await fetch('/api/tefas/detail', {
                        method: 'POST',
                        body: JSON.stringify({ fundCode: code }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const json = await res.json();
                    if (res.ok) {
                        setDetailedFunds(prev => ({ ...prev, [code]: json }));
                    } else {
                        console.error('Detail fetch error:', json.error);
                    }
                } catch (e) {
                    console.error("Detail fetch failed", e);
                } finally {
                    setLoadingDetails(prev => ({ ...prev, [code]: false }));
                }
            }
        }
    };

    return (
        <div className="p-8 min-h-full space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-500" />
                        TEFAS Fon Veri Merkezi
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Türkiye'deki tüm yatırım fonlarının detaylı listesi, güncel fiyatları ve varlık dağılımları.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Fon kodu, adı veya içerik ara (Örn: MAC, Teknoloji, Altın)..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedCategory === cat 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Fon verileri TEFAS'tan çekiliyor...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1e293b] text-white uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">Fon Kodu</th>
                                    <th className="px-6 py-4">Fon Adı</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 w-1/3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-blue-400" />
                                            İçerik (Top 5)
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Yıllık Getiri</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFunds.length > 0 ? (
                                    filteredFunds.slice(0, 100).map((fund) => {
                                        const catInfo = getCategoryLabel(fund.category);
                                        const isExpanded = expandedFund === fund.code;
                                        
                                        return (
                                            <Fragment key={fund.code}>
                                                <tr 
                                                    onClick={() => toggleExpand(fund.code)}
                                                    className={`cursor-pointer transition-colors group ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-blue-500" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                                                            )}
                                                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                                                                {fund.code}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-slate-700 font-medium text-sm block max-w-xs truncate" title={fund.title}>
                                                            {fund.title}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            fund.category.includes('Hisse') ? 'bg-blue-100 text-blue-700' :
                                                            fund.category.includes('Altın') || fund.category.includes('Kıymetli') ? 'bg-yellow-100 text-yellow-700' :
                                                            fund.category.includes('Serbest') ? 'bg-purple-100 text-purple-700' :
                                                            fund.category.includes('Yabancı') || fund.category.includes('Sepet') ? 'bg-orange-100 text-orange-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {catInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-1">
                                                            {fund.holdings}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {fund.return1y ? (
                                                            <span className={`font-bold ${fund.return1y > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                %{parseFloat(fund.return1y).toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={5} className="p-0 border-b border-blue-100 bg-blue-50/30">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                        {/* Left: Holdings */}
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-blue-200 pb-2">
                                                                                <Layers className="w-4 h-4 text-blue-500" />
                                                                                Varlık Dağılımı / İçerik
                                                                            </h3>
                                                                            <ul className="space-y-2">
                                                                                {fund.holdings.split(',').map((item: string, i: number) => (
                                                                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-white/50 p-2 rounded-lg border border-blue-100">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                                                        {item.trim()}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                                                <a 
                                                                                    href={`https://www.google.com/search?q=site%3Akap.org.tr+${fund.code}+portföy+dağılım+raporu`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-blue-100 p-3 rounded-lg border border-blue-200"
                                                                                >
                                                                                    <ExternalLink className="w-4 h-4" />
                                                                                    Detaylı Hisse Dağılımı İçin KAP Raporunu İncele
                                                                                </a>
                                                                                <p className="text-[10px] text-slate-500 mt-1 ml-1">
                                                                                    * Kesin hisse oranları (Örn: Tüpraş %10) sadece aylık KAP raporlarında yayınlanmaktadır.
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Right: Price & Performance */}
                                                                        <div className="space-y-4">
                                                                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-blue-200 pb-2">
                                                                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                                                                Fiyat ve Performans
                                                                            </h3>
                                                                            
                                                                            {loadingDetails[fund.code] ? (
                                                                                <div className="flex items-center justify-center py-8">
                                                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                                                </div>
                                                                            ) : detailedFunds[fund.code] ? (
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                     <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                                                        <span className="text-xs text-slate-500 block">Son Fiyat</span>
                                                                                        <span className="text-lg font-bold text-slate-900">
                                                                                            {detailedFunds[fund.code].SONPORTFOYDEGERI && detailedFunds[fund.code].SONPAYADEDI 
                                                                                                ? (detailedFunds[fund.code].SONPORTFOYDEGERI / detailedFunds[fund.code].SONPAYADEDI).toFixed(6) + ' ₺'
                                                                                                : 'Hesaplanamadı'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                                                        <span className="text-xs text-slate-500 block">Günlük Getiri</span>
                                                                                        <span className={`text-lg font-bold ${fund.returnDay >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.returnDay ? parseFloat(fund.returnDay).toFixed(2) : '0.00'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                                                        <span className="text-xs text-slate-500 block">Toplam Değer</span>
                                                                                        <span className="text-sm font-bold text-slate-900">
                                                                                            {detailedFunds[fund.code].SONPORTFOYDEGERI 
                                                                                                ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(detailedFunds[fund.code].SONPORTFOYDEGERI)
                                                                                                : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                                                        <span className="text-xs text-slate-500 block">Yatırımcı Sayısı</span>
                                                                                        <span className="text-sm font-bold text-slate-900">
                                                                                            {/* TEFAS doesn't give investor count easily here, using Pay Adedi as proxy for size */}
                                                                                            {new Intl.NumberFormat('tr-TR').format(detailedFunds[fund.code].SONPAYADEDI)} Pay
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-sm text-red-500">
                                                                                    Veri yüklenemedi.
                                                                                </div>
                                                                            )}

                                                                            <div className="mt-4">
                                                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Getiri Performansı</h4>
                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                    <div className="text-center bg-slate-50 p-2 rounded">
                                                                                        <span className="block text-xs text-slate-400">1 Ay</span>
                                                                                        <span className={`font-bold text-sm ${fund.return1m > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.return1m ? parseFloat(fund.return1m).toFixed(2) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-center bg-slate-50 p-2 rounded">
                                                                                        <span className="block text-xs text-slate-400">6 Ay</span>
                                                                                        <span className={`font-bold text-sm ${fund.return6m > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.return6m ? parseFloat(fund.return6m).toFixed(2) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-center bg-slate-50 p-2 rounded">
                                                                                        <span className="block text-xs text-slate-400">1 Yıl</span>
                                                                                        <span className={`font-bold text-sm ${fund.return1y > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.return1y ? parseFloat(fund.return1y).toFixed(2) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-center bg-slate-50 p-2 rounded">
                                                                                        <span className="block text-xs text-slate-400">3 Yıl</span>
                                                                                        <span className={`font-bold text-sm ${fund.return3y > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.return3y ? parseFloat(fund.return3y).toFixed(2) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-center bg-slate-50 p-2 rounded">
                                                                                        <span className="block text-xs text-slate-400">5 Yıl</span>
                                                                                        <span className={`font-bold text-sm ${fund.return5y > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                            %{fund.return5y ? parseFloat(fund.return5y).toFixed(2) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Aradığınız kriterlere uygun fon bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
