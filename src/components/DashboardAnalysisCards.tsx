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
            badge: 'Güvenli Liman',
            analysis: {
                title: "Fed Politikaları ve Jeopolitik Riskler Arasında Yön Arayışı",
                summary: "2026 yılı başında Altın (XAUUSD), majör merkez bankalarının faiz indirim döngüleri ve devam eden jeopolitik gerilimler arasında sıkışmış durumda. Yatırımcılar, Fed'in 'bekle-gör' politikasının ne kadar süreceğini ve enflasyon verilerinin kalıcılığını fiyatlamaya çalışıyor. Teknik olarak kritik destek seviyelerinin üzerinde kalıcılık, yukarı yönlü iştahı koruyor.",
                scenarios: [
                    {
                        title: "Enflasyonun Beklenti Altı Gelmesi",
                        desc: "Reel faizlerin düşmesiyle birlikte Altın'ın fırsat maliyeti azalır ve 2.400$ üzerine doğru yeni bir ivme kazanabilir.",
                        type: "positive"
                    },
                    {
                        title: "Şahin Fed Açıklamaları",
                        desc: "Faiz indirimlerinin ötelenmesi durumunda güçlü Dolar baskısı ile 2.250$ seviyelerine doğru düzeltme görülebilir.",
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
            badge: 'Endüstriyel & Değerli',
            analysis: {
                title: "Endüstriyel Talep ve Yeşil Enerji Dönüşümü",
                summary: "Gümüş, hem değerli metal statüsü hem de güneş enerjisi ve elektrikli araç sektöründeki artan endüstriyel kullanımıyla ayrışmaya devam ediyor. Altın/Gümüş rasyosundaki değişimler, Gümüş'ün potansiyel olarak Altın'dan daha iyi performans gösterebileceği dönemlere işaret ediyor.",
                scenarios: [
                    {
                        title: "Küresel İmalat Verilerinde İyileşme",
                        desc: "Çin ve ABD sanayi üretiminin artması, fiziki gümüş talebini artırarak fiyatları yukarı çekecektir.",
                        type: "positive"
                    },
                    {
                        title: "Resesyon Endişeleri",
                        desc: "Ekonomik durgunluk sinyalleri, endüstriyel talebi baskılayarak Gümüş'ü Altın'a kıyasla daha negatif etkileyebilir.",
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
            badge: 'Rezerv Para',
            analysis: {
                title: "TCMB Sıkı Duruşu ve Kur Korumalı Mevduat Dengesi",
                summary: "Dolar/TL kuru, TCMB'nin sıkı para politikası ve enflasyonla mücadele kararlılığı gölgesinde dengeli bir seyir izliyor. Rezerv biriktirme stratejisi ve KKM çıkışları, kur üzerindeki ana belirleyiciler olmaya devam ediyor. Oynaklık düşük seyretse de enflasyon farkı yakından izleniyor.",
                scenarios: [
                    {
                        title: "Erken Faiz İndirimi Sinyali",
                        desc: "Enflasyonda kalıcı düşüş görülmeden yapılacak erken bir gevşeme, kur üzerindeki yukarı yönlü baskıyı artırabilir.",
                        type: "negative"
                    },
                    {
                        title: "Yabancı Sermaye Girişi",
                        desc: "Kredi notu artışları ve gri listeden çıkış sonrası artan yabancı ilgisi, kurda stabilizasyonu ve reel değerlenmeyi destekler.",
                        type: "positive"
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
            badge: 'Avrupa Bölgesi',
            analysis: {
                title: "ECB Faiz Kararları ve Euro/Dolar Paritesi Etkisi",
                summary: "Euro/TL, büyük ölçüde EUR/USD paritesindeki hareketlerden etkileniyor. Avrupa Merkez Bankası'nın (ECB) faiz indirimlerinde Fed'den daha hızlı davranması Euro'yu baskılasa da, Türkiye'nin Avrupa ile olan güçlü ticaret hacmi Euro talebini canlı tutuyor.",
                scenarios: [
                    {
                        title: "Euro Bölgesi Toparlanması",
                        desc: "Almanya ve Euro Bölgesi PMI verilerinin iyileşmesi, Euro'yu küresel ölçekte güçlendirerek TL karşısında da değer kazandırabilir.",
                        type: "positive"
                    },
                    {
                        title: "Paritede Geri Çekilme",
                        desc: "ABD ekonomisinin Avrupa'dan daha güçlü kalması, EUR/USD paritesini aşağı çekerek Euro/TL'de daha yatay bir seyire neden olabilir.",
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
                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
                                            {item.badge}
                                        </span>
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
                                            {scenario.title}
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
