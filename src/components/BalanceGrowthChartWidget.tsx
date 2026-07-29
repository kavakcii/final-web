"use client";

import { useState, useMemo } from "react";
import { TrendingUp, LineChart, Calendar, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUser } from "@/components/providers/UserProvider";

export function BalanceGrowthChartWidget() {
    const { portfolioHistory = [] } = useUser();
    const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | 'YTD' | '1Y'>('1M');

    // Demonstrative growth curve / historical data structure ready for API
    const chartData = useMemo(() => {
        if (portfolioHistory && portfolioHistory.length > 3) {
            return portfolioHistory.map((item: any) => ({
                date: item.date || item.created_at?.slice(5, 10) || "Tarih",
                balance: Number(item.total_value || item.value || 0)
            }));
        }

        // Demo representation structure for UI initialization
        return [
            { date: "01 Tem", balance: 120000 },
            { date: "05 Tem", balance: 123500 },
            { date: "10 Tem", balance: 121800 },
            { date: "15 Tem", balance: 127400 },
            { date: "20 Tem", balance: 131200 },
            { date: "25 Tem", balance: 129800 },
            { date: "Bugün", balance: 135400 }
        ];
    }, [portfolioHistory]);

    const latestBalance = chartData[chartData.length - 1]?.balance || 0;
    const initialBalance = chartData[0]?.balance || 1;
    const growthPercent = (((latestBalance - initialBalance) / initialBalance) * 100).toFixed(2);

    return (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <LineChart className="w-4 h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B] tracking-tight">Varlık Gelişim Grafiği</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bakiye Seyri ve Trend</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        {(['1W', '1M', '3M', 'YTD', '1Y'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all ${timeRange === range ? 'bg-[#00008B] text-white shadow-sm' : 'text-slate-500 hover:text-[#00008B]'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sub Stats */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seçili Dönem Büyüme</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-2xl font-black text-[#00008B]">
                                ₺{latestBalance.toLocaleString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <ArrowUpRight className="w-3.5 h-3.5" /> +%{growthPercent}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chart Box */}
                <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00008B" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#00008B" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#00008B',
                                    borderColor: '#00008B',
                                    borderRadius: '16px',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 139, 0.3)'
                                }}
                                formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR')}`, 'Bakiye']}
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#00008B"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
