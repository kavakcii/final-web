"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingDown, RefreshCw, Trophy, Brain, AlertTriangle, ArrowRightCircle } from "lucide-react";
import { getQuickScenario, analyzeInvestorProfile, UserAction } from "@/lib/behavioral-engine";

interface BehavioralTestProps {
    onFinish?: (actions: UserAction[]) => void;
}

export const BehavioralTest: React.FC<BehavioralTestProps> = ({ onFinish }) => {
    const scenario = useMemo(() => getQuickScenario(), []);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [actions, setActions] = useState<UserAction[]>([]);
    const [balance, setBalance] = useState(100000);
    const [position, setPosition] = useState(1); // Start INVESTED
    const [result, setResult] = useState<any>(null);

    // Simulation Loop - 500ms for high speed
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && currentTime < scenario.length - 1 && position === 1) {
            interval = setInterval(() => {
                setCurrentTime(prev => prev + 1);
                // Update live balance based on current price change
                const currentPrice = scenario[currentTime].price;
                const startPrice = scenario[0].price;
                setBalance(100000 * (currentPrice / startPrice));
            }, 500);
        } else if (currentTime >= scenario.length - 1 || position === 0) {
            handleFinish();
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentTime, position]);

    const handleSell = () => {
        const currentPrice = scenario[currentTime].price;
        const newActions = [
            { time: 0, price: scenario[0].price, type: 'BUY' as const },
            { time: currentTime, price: currentPrice, type: 'SELL' as const }
        ];
        setActions(newActions);
        setPosition(0);
        setIsPlaying(false);
    };

    const handleFinish = () => {
        setIsPlaying(false);
        // If they never sold, record it as a hold
        const finalActions = actions.length > 0 ? actions : [
            { time: 0, price: scenario[0].price, type: 'BUY' as const }
        ];
        const analysis = analyzeInvestorProfile(finalActions);
        setResult(analysis);
    };

    const visibleData = scenario.slice(0, currentTime + 1);
    const currentEvent = scenario[currentTime]?.event;

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
            {/* High Stakes Header */}
            <div className="bg-[#00008B] p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-20deg] translate-x-10"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Stres Testi: Çıkış Stratejisi</p>
                        <h2 className="text-xl font-black italic">SATIŞ ZAMANLAMASI</h2>
                    </div>
                </div>
                
                <div className="flex gap-8 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Anlık Portföy Değeri</p>
                        <p className={`text-2xl font-black ${balance >= 100000 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {balance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Chart Area - Full line visibility focused */}
                <div className="h-[300px] w-full relative bg-slate-50/50 rounded-3xl border border-slate-100 p-4 overflow-hidden">
                    <AnimatePresence>
                        {currentEvent && (
                            <motion.div 
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 right-4 z-20 px-6 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"
                            >
                                <Zap className="w-4 h-4 fill-white" /> {currentEvent}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visibleData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                            <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke={balance >= 100000 ? "#10b981" : "#ef4444"} 
                                strokeWidth={5} 
                                dot={false} 
                                isAnimationActive={false} // Fast updates
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Single Big Action Button */}
                <div className="flex gap-4">
                    {!isPlaying && !result && (
                        <button 
                            onClick={() => setIsPlaying(true)}
                            className="w-full py-8 bg-[#00008B] text-white rounded-[24px] font-black uppercase tracking-widest text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                        >
                            <Brain className="w-6 h-6" /> TESTİ BAŞLAT (ZATEN İÇERİDESİNİZ)
                        </button>
                    )}

                    {isPlaying && (
                        <button 
                            onClick={handleSell}
                            className="w-full py-10 bg-red-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xl transition-all shadow-2xl shadow-red-600/40 hover:bg-red-700 animate-bounce-subtle flex flex-col items-center justify-center"
                        >
                            <span className="text-[10px] opacity-70 mb-1">TEHLİKE ANINDA</span>
                            SATIŞ YAP VE ÇIK!
                        </button>
                    )}
                </div>

                {/* Fast Result View */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Trophy className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">KARAR ANALİZİ</h3>
                                    <p className="text-sm font-bold text-slate-500">Reflekslerinizi ölçtük.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Psikolojik Teşhis</p>
                                    <p className="text-lg font-bold text-slate-200 leading-relaxed">{result.description}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onFinish?.(actions)}
                                    className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                                >
                                    Analizi Onayla <ArrowRightCircle className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
