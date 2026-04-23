"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Asset {
    symbol: string;
    quantity: number;
    avgCost: number;
    type: string;
}

interface PortfolioHeatmapProps {
    assets: Asset[];
    prices?: Record<string, number>;
}

export function PortfolioHeatmap({ assets = [], prices = {} }: PortfolioHeatmapProps) {
    // Generate some mock/random daily change data if not provided by API
    // In a real scenario, this would come from your finance API
    const getChangePercent = (symbol: string) => {
        // Deterministic pseudo-random change based on symbol name for consistent UI demo
        const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 10) - 4.5; // Results between -4.5% and +4.5%
    };

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest">Henüz Varlık Yok</p>
            </div>
        );
    }

    // Limit to top 12 assets to keep the mini grid clean
    const displayAssets = assets.slice(0, 12);

    return (
        <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-[#00008B]/5 pb-2">
                <h4 className="text-[9px] font-black text-[#00008B] uppercase tracking-widest">Portföy Isı Haritası</h4>
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
                    <div className="w-2 h-2 bg-rose-500 rounded-sm" />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 flex-1">
                {displayAssets.map((asset, i) => {
                    const change = getChangePercent(asset.symbol);
                    const isPositive = change >= 0;
                    
                    // Intensity calculation
                    const opacity = Math.min(Math.abs(change) / 5 + 0.3, 1);
                    const bgColor = isPositive 
                        ? `rgba(16, 185, 129, ${opacity})` // emerald-500
                        : `rgba(244, 63, 94, ${opacity})`; // rose-500

                    return (
                        <motion.div
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.1, zIndex: 10 }}
                            className="relative aspect-square rounded-md cursor-help flex flex-col items-center justify-center overflow-hidden group/item"
                            style={{ backgroundColor: bgColor }}
                        >
                            <span className="text-[8px] font-black text-white drop-shadow-sm truncate w-full text-center px-1">
                                {asset.symbol.split(':')[1] || asset.symbol}
                            </span>
                            <span className="text-[7px] font-bold text-white/80 leading-none">
                                {isPositive ? '+' : ''}{change.toFixed(1)}%
                            </span>

                            {/* Tooltip on hover */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover/item:opacity-20 transition-opacity" />
                        </motion.div>
                    );
                })}
                
                {/* Empty slots to fill 4x3 grid */}
                {Array.from({ length: Math.max(0, 12 - displayAssets.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-md bg-slate-50 border border-slate-100/50" />
                ))}
            </div>

            <div className="mt-3 flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>Düşük Hacim</span>
                <div className="flex-1 mx-2 h-[2px] bg-gradient-to-r from-rose-500 via-slate-200 to-emerald-500 rounded-full" />
                <span>Yüksek Hacim</span>
            </div>
        </div>
    );
}
