"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingDown, TrendingUp, AlertCircle, RefreshCw, Trophy, Brain } from "lucide-react";
import { getSmoothScenario, analyzeInvestorProfile, UserAction, SimulationPoint } from "@/lib/behavioral-engine";

export const BehavioralTest: React.FC = () => {
    const scenario = useMemo(() => getSmoothScenario(), []);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [actions, setActions] = useState<UserAction[]>([]);
    const [balance, setBalance] = useState(100000);
    const [position, setPosition] = useState(0); // 0: Cash, 1: Invested
    const [result, setResult] = useState<any>(null);

    // Simulation Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && currentTime < 60) {
            interval = setInterval(() => {
                setCurrentTime(prev => prev + 1);
            }, 1000);
        } else if (currentTime >= 60) {
            handleFinish();
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentTime]);

    const handleAction = (type: 'BUY' | 'SELL') => {
        const currentPrice = scenario[currentTime].price;
        if (type === 'BUY' && position === 0) {
            setPosition(1);
            setActions([...actions, { time: currentTime, price: currentPrice, type: 'BUY' }]);
        } else if (type === 'SELL' && position === 1) {
            setPosition(0);
            const buyAction = [...actions].reverse().find(a => a.type === 'BUY');
            if (buyAction) {
                const profit = (currentPrice / buyAction.price - 1) * balance;
                setBalance(prev => prev + profit);
            }
            setActions([...actions, { time: currentTime, price: currentPrice, type: 'SELL' }]);
        }
    };

    const handleFinish = () => {
        setIsPlaying(false);
        const analysis = analyzeInvestorProfile(actions);
        setResult(analysis);
    };

    const visibleData = scenario.slice(0, currentTime + 1);
    const currentEvent = scenario[currentTime]?.event;

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
            {/* Header / Stats */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center animate-pulse">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canlı Simülasyon</p>
                        <h2 className="text-xl font-black">Piyasa Şoku Testi</h2>
                    </div>
                </div>
                
                <div className="flex gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bakiye</p>
                        <p className="text-2xl font-black text-emerald-400">{balance.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Süre</p>
                        <p className="text-2xl font-black">00:{currentTime.toString().padStart(2, '0')}</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Chart Area */}
                <div className="h-[350px] w-full relative bg-slate-50/50 rounded-3xl border border-slate-100 p-4">
                    <AnimatePresence>
                        {currentEvent && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"
                            >
                                <AlertCircle className="w-4 h-4" /> {currentEvent}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visibleData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                            <Tooltip 
                                content={({ payload }) => (
                                    payload?.[0] ? (
                                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-2xl">
                                            Fiyat: {payload[0].value} ₺
                                        </div>
                                    ) : null
                                )}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                dot={false} 
                                animationDuration={300}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    {!isPlaying && !result && (
                        <button 
                            onClick={() => setIsPlaying(true)}
                            className="w-full py-6 bg-[#00008B] text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3"
                        >
                            <Brain className="w-5 h-5" /> Testi Başlat (60 Saniye)
                        </button>
                    )}

                    {isPlaying && (
                        <>
                            <button 
                                onClick={() => handleAction('BUY')}
                                disabled={position === 1}
                                className={`flex-1 py-6 rounded-[24px] font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${position === 1 ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white hover:scale-[1.02]'}`}
                            >
                                <TrendingUp className="w-5 h-5" /> Alım Yap
                            </button>
                            <button 
                                onClick={() => handleAction('SELL')}
                                disabled={position === 0}
                                className={`flex-1 py-6 rounded-[24px] font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${position === 0 ? 'bg-slate-100 text-slate-400' : 'bg-red-500 text-white hover:scale-[1.02]'}`}
                            >
                                <TrendingDown className="w-5 h-5" /> Hepsini Sat
                            </button>
                        </>
                    )}
                </div>

                {/* Results View */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-50 border border-blue-100 rounded-[32px] p-8 space-y-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                    <Trophy className="w-8 h-8 text-[#00008B]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#00008B] uppercase italic">Analiz Tamamlandı</h3>
                                    <p className="text-sm font-bold text-slate-500">Davranışsal Yatırımcı Profiliniz</p>
                                </div>
                            </div>
                            
                            <div className="pt-4 space-y-4">
                                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Teşhis</p>
                                    <p className="text-lg font-bold text-slate-800 leading-relaxed">{result.description}</p>
                                </div>
                                <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">FinAi Önerisi</p>
                                    <p className="text-lg font-bold leading-relaxed">{result.recommendation}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-4 mt-4 bg-white border border-blue-100 text-[#00008B] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/50 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" /> Testi Tekrarla
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
