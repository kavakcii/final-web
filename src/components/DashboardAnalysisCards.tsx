"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function DashboardAnalysisCards() {
    const [marketData, setMarketData] = useState<any>({});

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                // Fetch Gold, Silver, USD, Euro
                const res = await fetch('/api/finance?symbols=XAUUSD=X,XAGUSD=X,USDTRY=X,EURTRY=X');
                const data = await res.json();
                if (data.results) {
                    const map: any = {};
                    data.results.forEach((r: any) => {
                        map[r.symbol] = r;
                    });
                    setMarketData(map);
                }
            } catch (e) {
                console.error("Market data fetch failed", e);
            }
        };
        fetchMarketData();
    }, []);

    const cards = [
        {
            name: 'Altın (Ons)',
            symbol: 'XAUUSD',
            apiSymbol: 'XAUUSD=X',
            unit: '$',
            analysis: {
                title: "Dünyadaki Gerginlikler ve Faiz Kararları",
                summary: "Altın fiyatları şu an iki büyük güç arasında. Bir yanda dünyadaki savaş ve gerginlikler fiyatı yukarı itiyor, diğer yanda bankaların faiz kararları baskı oluşturuyor. Özetle: Faizler düşerse altın değerlenir, faizler yüksek kalırsa fiyatlar bir süre daha yerinde sayabilir.",
                scenarios: [
                    {
                        desc: "Faizler beklenenden önce düşerse, altının getirisi artar ve fiyatı hızla yükselebilir.",
                        type: "positive"
                    },
                    {
                        desc: "Faiz indirimleri ertelenirse, dolar güçlenir ve altın fiyatları bir miktar geri çekilebilir.",
                        type: "negative"
                    }
                ],
                tags: ['#FED', '#XAU', '#Emtia']
            }
        },
        {
            name: 'Gümüş (Ons)',
            symbol: 'XAGUSD',
            apiSymbol: 'XAGUSD=X',
            unit: '$',
            analysis: {
                title: "Sanayi ve Teknoloji Talebi",
                summary: "Gümüş sadece bir yatırım aracı değil, aynı zamanda sanayide (güneş panelleri, elektrikli araçlar) kullanılan önemli bir maddedir. Dünya ekonomisi büyüdükçe ve teknoloji geliştikçe gümüşe olan ihtiyaç artar. Bu yüzden gümüş, bazen altından daha hızlı değer kazanabilir.",
                scenarios: [
                    {
                        desc: "Fabrikaların üretimi artarsa gümüşe olan ihtiyaç artar ve fiyatlar yükselir.",
                        type: "positive"
                    },
                    {
                        desc: "Ekonomik durgunluk olursa fabrikalar yavaşlar, bu da gümüş fiyatlarını olumsuz etkiler.",
                        type: "negative"
                    }
                ],
                tags: ['#XAG', '#Sanayi', '#Enerji']
            }
        },
        {
            name: 'ABD Doları',
            symbol: 'USDTRY',
            apiSymbol: 'USDTRY=X',
            unit: '₺',
            analysis: {
                title: "Merkez Bankası Kontrolü ve Dengeli Seyir",
                summary: "Dolar şu anda Merkez Bankası'nın sıkı kontrolü altında. Banka, enflasyonu düşürmek için faizleri yüksek tutarak doların aşırı değerlenmesini engelliyor. Yani doların aniden fırlaması istenmiyor. Şu an için dolarda sakin ve dengeli bir hareket bekleniyor.",
                scenarios: [
                    {
                        desc: "Yabancı yatırımcıların Türkiye'ye güvenip para getirmesi, doların ateşini düşürür ve sabit tutar.",
                        type: "positive"
                    },
                    {
                        desc: "Enflasyon düşmezse ve erken faiz indirimi yapılırsa, dolar tekrar yukarı yönlü hareketlenebilir.",
                        type: "negative"
                    }
                ],
                tags: ['#USD', '#TCMB', '#Forex']
            }
        },
        {
            name: 'Euro',
            symbol: 'EURTRY',
            apiSymbol: 'EURTRY=X',
            unit: '₺',
            analysis: {
                title: "Avrupa Ekonomisi ve Ticaret Dengesi",
                summary: "Euro'nun değeri, Avrupa ekonomisinin gücüne bağlıdır. Türkiye en çok ihracatı Avrupa'ya yaptığı için Euro bizim için önemlidir. Şu an Avrupa'da işler biraz yavaş ilerliyor, bu da Euro'nun dolar karşısında biraz zayıf kalmasına neden oluyor.",
                scenarios: [
                    {
                        desc: "Avrupa ekonomisi toparlanırsa Euro değer kazanır ve TL karşısında da güçlenir.",
                        type: "positive"
                    },
                    {
                        desc: "Amerika ekonomisi Avrupa'dan daha güçlü kalmaya devam ederse, Euro yerinde sayabilir.",
                        type: "negative"
                    }
                ],
                tags: ['#EUR', '#ECB', '#Parite']
            }
        }
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {cards.map((item, idx) => {
                const data = marketData[item.apiSymbol];
                const price = data?.regularMarketPrice;
                const change = data?.regularMarketChangePercent;
                const isUp = change >= 0;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col h-full group"
                    >
                        {/* Card Header */}
                        <div className="bg-[#1e293b] px-6 py-5 flex items-center justify-between border-b border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                        {item.name}
                                    </h3>
                                    <span className="text-slate-400 text-xs mt-1">
                                        {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Görünümü
                                    </span>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                {price ? (
                                    <div className="flex flex-col items-end">
                                        <div className="text-2xl font-bold text-white tracking-tight">
                                            {price.toFixed(2)} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            %{Math.abs(change).toFixed(2)}
                                        </div>
                                    </div>
                                ) : (
                                    <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                                )}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex flex-col gap-6 flex-1 bg-white">
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg mb-2">{item.analysis.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {item.analysis.summary}
                                </p>
                            </div>

                            {/* Scenarios Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                                {item.analysis.scenarios.map((scenario, sIdx) => (
                                    <div 
                                        key={sIdx} 
                                        className={`p-4 rounded-xl border ${
                                            scenario.type === 'positive' 
                                                ? 'bg-green-50 border-green-100' 
                                                : 'bg-red-50 border-red-100'
                                        }`}
                                    >
                                        <h5 className={`font-bold text-sm mb-1 ${
                                            scenario.type === 'positive' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                            {scenario.type === 'positive' ? 'Pozitif Beklenti' : 'Negatif Beklenti'}
                                        </h5>
                                        <p className={`text-xs ${
                                            scenario.type === 'positive' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {scenario.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Tags */}
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                                {item.analysis.tags.map((tag, tIdx) => (
                                    <span key={tIdx} className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                        {tag}
                                    </span>
                                ))}
                                <Link 
                                    href={`/dashboard/analysis?q=${item.symbol}`}
                                    className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    Detaylı Analiz <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
