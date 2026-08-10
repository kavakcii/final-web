"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { TrendingUp, LineChart, Lock, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PortfolioService, HistoryRange } from "@/lib/portfolio-service";
import { useUser } from "@/components/providers/UserProvider";

// Belirli bir aralık için kaç günlük veri geretiği
const RANGE_DAYS: Record<HistoryRange, number> = {
    '1W':  7,
    '1M':  30,
    '3M':  90,
    'YTD': 180, // En fazla 180 gün YTD sayılır
    '1Y':  365
};

const RANGE_LABELS: Record<HistoryRange, string> = {
    '1W':  '7 Gün',
    '1M':  '1 Ay',
    '3M':  '3 Ay',
    'YTD': 'Yıl Başından',
    '1Y':  '1 Yıl'
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function daysBetween(dateStr: string): number {
    const first = new Date(dateStr + 'T00:00:00').getTime();
    const now   = new Date().getTime();
    return Math.floor((now - first) / (1000 * 60 * 60 * 24));
}

export function BalanceGrowthChartWidget() {
    const { myAssets = [], prices = {} } = useUser();
    const [timeRange, setTimeRange] = useState<HistoryRange>('1W');
    const [chartData, setChartData] = useState<{ date: string; balance: number }[]>([]);
    const [firstDate, setFirstDate]   = useState<string | null>(null);
    const [loading, setLoading]       = useState(true);
    const [daysSinceFirst, setDaysSinceFirst] = useState<number>(0);

    // Portföyüm sayfası ile %100 birebir canlı değer hesaplaması
    const liveTotalValue = useMemo(() => {
        if (!myAssets || myAssets.length === 0) return 0;
        let val = 0;
        myAssets.forEach((asset: any) => {
            const symKey = asset.symbol ? asset.symbol.toUpperCase().trim() : "";
            const cleanSymKey = symKey.replace(/\.IS$/, '');
            const currentPrice = prices[symKey] ?? prices[cleanSymKey] ?? prices[`${cleanSymKey}.IS`] ?? asset.avgCost ?? 0;
            val += currentPrice * asset.quantity;
        });
        return val;
    }, [myAssets, prices]);

    // İlk kayıt tarihini çek → kaç gün geçmiş?
    useEffect(() => {
        PortfolioService.getFirstSnapshotDate().then(date => {
            setFirstDate(date);
            if (date) setDaysSinceFirst(daysBetween(date));
        });
    }, []);

    // Seçili range değiştikçe veri çek
    const fetchHistory = useCallback(async (range: HistoryRange) => {
        setLoading(true);
        try {
            const data = await PortfolioService.getHistory(range);
            const mapped: { date: string; balance: number }[] = data.map((item: any) => ({
                date:    formatDate(item.snapshot_date),
                balance: Number(item.total_value ?? 0)
            }));

            // Seçili zaman diliminin sol ucuna sentetik başlangıç noktası ekle.
            // Grafik her zaman soldan başlar; yeni veriler geldikçe çizgi sağa büyür.
            if (mapped.length > 0) {
                const firstValue = mapped[0].balance;
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
                const startDate = new Date(now);
                if (range === '1W')       startDate.setDate(now.getDate() - 7);
                else if (range === '1M')  startDate.setDate(now.getDate() - 30);
                else if (range === '3M')  startDate.setDate(now.getDate() - 90);
                else if (range === 'YTD') startDate.setMonth(0, 1);
                else                      startDate.setFullYear(now.getFullYear() - 1);

                const startLabel = startDate.toLocaleDateString('tr-TR', {
                    day: '2-digit', month: 'short', timeZone: 'Europe/Istanbul'
                });
                if (mapped[0].date !== startLabel) {
                    mapped.unshift({ date: startLabel, balance: firstValue });
                }
            }

            setChartData(mapped);
        } catch {
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(timeRange);
    }, [timeRange, fetchHistory]);

    // Bu range için yeterli veri var mı?
    const isRangeUnlocked = (range: HistoryRange): boolean => {
        if (!firstDate) return false;
        return daysSinceFirst >= RANGE_DAYS[range];
    };

    // Canlı değeri bugünkü son noktaya senkronize et
    const displayChartData = useMemo(() => {
        if (chartData.length === 0) return [];
        const copy = [...chartData];
        if (liveTotalValue > 0) {
            const todayLabel = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', timeZone: 'Europe/Istanbul' });
            const lastIndex = copy.length - 1;
            if (copy[lastIndex].date === todayLabel) {
                copy[lastIndex] = { ...copy[lastIndex], balance: liveTotalValue };
            } else {
                copy.push({ date: todayLabel, balance: liveTotalValue });
            }
        }
        return copy;
    }, [chartData, liveTotalValue]);

    const latestBalance  = liveTotalValue > 0 ? liveTotalValue : (displayChartData[displayChartData.length - 1]?.balance ?? 0);
    const initialBalance = displayChartData[0]?.balance ?? 1;
    const growthPercent  = initialBalance > 0
        ? (((latestBalance - initialBalance) / initialBalance) * 100).toFixed(2)
        : '0.00';
    const isPositive = parseFloat(growthPercent) >= 0;

    const hasData = displayChartData.length > 0;

    // Yeni kullanıcı durumu: hiç veri yok
    const isNewUser = !firstDate && !loading;

    return (
        <div className="w-full bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm flex flex-col justify-between h-full min-w-0">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center shrink-0">
                            <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-base font-black text-[#00008B] tracking-tight truncate">Varlık Gelişimi</h3>
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Günlük Kapanış</p>
                        </div>
                    </div>

                    {/* Tüm Günler Etiketi */}
                    <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-extrabold text-[#00008B] bg-[#00008B]/5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-2xl border border-[#00008B]/10">
                        <span>7 Gün</span>
                    </div>
                </div>

                {/* --- Yeni Kullanıcı Durumu --- */}
                {isNewUser && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-[#00008B]/40" />
                        </div>
                        <div className="text-center max-w-xs">
                            <p className="text-xs font-black text-slate-700">Grafik Başlıyor</p>
                            <p className="text-[10px] text-slate-400">Veriler her gece 23:59'da kaydedilir.</p>
                        </div>
                    </div>
                )}

                {/* --- Yüklenme Durumu --- */}
                {!isNewUser && loading && (
                    <div className="flex items-center justify-center h-32 sm:h-44">
                        <div className="w-5 h-5 border-2 border-[#00008B] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* --- Veri Yok / Kilitli Dönem --- */}
                {!isNewUser && !loading && !hasData && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <Lock className="w-5 h-5 text-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 text-center">
                            Henüz yeterli veri yok.
                        </p>
                    </div>
                )}

                {/* --- Grafik --- */}
                {!isNewUser && !loading && hasData && (
                    <>
                        {/* İstatistik */}
                        <div className="flex items-center justify-between mb-2 px-0.5">
                            <div>
                                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Değişim
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                                    <span className="text-sm sm:text-2xl font-black text-[#00008B] truncate">
                                        ₺{latestBalance.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                    <span className={`flex items-center text-[9px] sm:text-xs font-black px-1 sm:px-2 py-0.5 rounded border ${
                                        isPositive
                                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                            : 'text-red-500 bg-red-50 border-red-200'
                                    }`}>
                                        {isPositive ? '+' : ''}{growthPercent}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-32 sm:h-44 w-full pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#00008B" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#00008B" stopOpacity={0.0}  />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 700 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 700 }}
                                        width={42}
                                        domain={['dataMin', 'dataMax']}
                                        tickFormatter={(v: number) => v >= 1000000 ? `₺${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₺${(v/1000).toFixed(0)}k` : `₺${v}`}
                                        tickCount={4}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#00008B',
                                            borderColor:     '#00008B',
                                            borderRadius:    '12px',
                                            color:           '#ffffff',
                                            fontSize:        '10px',
                                            fontWeight:      'bold',
                                            boxShadow:       '0 10px 25px -5px rgba(0, 0, 139, 0.3)'
                                        }}
                                        labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: 2 }}
                                        itemStyle={{ color: '#ffffff' }}
                                        formatter={(value: any) => [
                                            `₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                                            ''
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#00008B"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#00008B', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
