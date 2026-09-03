"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PortfolioService, HistoryRange } from "@/lib/portfolio-service";
import { useUser } from "@/components/providers/UserProvider";

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export function BalanceGrowthChartWidget() {
    const { myAssets = [], prices = {} } = useUser();
    const [timeRange] = useState<HistoryRange>('1W');
    const [historyPoints, setHistoryPoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Canlı portföy piyasa değeri
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

    // V2 portfolio_history snapshot verilerini çek
    const fetchHistory = useCallback(async (range: HistoryRange) => {
        setLoading(true);
        try {
            const data = await PortfolioService.getHistory(range);
            setHistoryPoints(data ?? []);
        } catch {
            setHistoryPoints([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(timeRange);
    }, [timeRange, fetchHistory]);

    // Grafik noktalarını oluştur
    const displayChartData = useMemo(() => {
        if (historyPoints.length === 0) return [];
        const mapped = historyPoints.map((item: any) => ({
            date: formatDate(item.snapshot_date),
            balance: Number(item.total_value ?? 0)
        }));

        // Canlı bugünün noktasını grafiğe ekle
        if (liveTotalValue > 0) {
            const todayLabel = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', timeZone: 'Europe/Istanbul' });
            const lastIndex = mapped.length - 1;
            if (mapped[lastIndex].date === todayLabel) {
                mapped[lastIndex] = { ...mapped[lastIndex], balance: liveTotalValue };
            } else {
                mapped.push({ date: todayLabel, balance: liveTotalValue });
            }
        }
        return mapped;
    }, [historyPoints, liveTotalValue]);

    // Sermayeden arındırılmış birikimli günlük net getiri (TWR) hesabı
    const { periodReturnPct, isPositive } = useMemo(() => {
        if (historyPoints.length < 2) {
            return { periodReturnPct: 0, isPositive: true };
        }

        let compound = 1.0;
        let hasValidDaily = false;

        historyPoints.forEach((item: any) => {
            if (item.daily_return_pct !== null && item.daily_return_pct !== undefined) {
                compound *= (1 + Number(item.daily_return_pct) / 100);
                hasValidDaily = true;
            }
        });

        if (hasValidDaily) {
            const pct = (compound - 1) * 100;
            return { periodReturnPct: pct, isPositive: pct >= 0 };
        }

        // Eğer günlük net getiri henüz oluşmadıysa
        const firstVal = Number(historyPoints[0]?.total_value || 0);
        const lastVal = liveTotalValue > 0 ? liveTotalValue : Number(historyPoints[historyPoints.length - 1]?.total_value || 0);
        if (firstVal > 0) {
            const fallbackPct = ((lastVal - firstVal) / firstVal) * 100;
            return { periodReturnPct: fallbackPct, isPositive: fallbackPct >= 0 };
        }

        return { periodReturnPct: 0, isPositive: true };
    }, [historyPoints, liveTotalValue]);

    const latestBalance = liveTotalValue > 0
        ? liveTotalValue
        : (displayChartData[displayChartData.length - 1]?.balance ?? 0);

    // En az 2 tarihsel snapshot noktası yoksa "Grafik Başlıyor" mesajı ver
    const hasEnoughSnapshots = historyPoints.length >= 2;

    return (
        <div className="w-full bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 pb-2 sm:pb-3 shadow-sm flex flex-col justify-between h-full min-h-[230px] sm:min-h-[270px] min-w-0">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center shrink-0">
                            <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-base font-black text-[#00008B] tracking-tight truncate">Varlık Gelişimi</h3>
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Günlük Kapanış Snapshot</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-extrabold text-[#00008B] bg-[#00008B]/5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-2xl border border-[#00008B]/10">
                        <span>7 Gün</span>
                    </div>
                </div>

                {/* --- Yüklenme Durumu --- */}
                {loading && (
                    <div className="flex items-center justify-center h-36 sm:h-48">
                        <div className="w-5 h-5 border-2 border-[#00008B] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* --- Yetersiz Snapshot / Yeni Kullanıcı Durumu --- */}
                {!loading && !hasEnoughSnapshots && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-[#00008B]/40" />
                        </div>
                        <div className="text-center max-w-xs px-4">
                            <p className="text-xs font-black text-slate-700">Grafik Başlıyor</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                Veriler her gün 23:59 TSİ'de otomatik kaydedilir. İlk performans grafiğiniz yarın oluşacaktır.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- Yeterli Veri Var: Stat Bilgisi --- */}
                {!loading && hasEnoughSnapshots && (
                    <div className="flex items-center justify-between mb-1 px-0.5">
                        <div>
                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Net Portföy Getirisi
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
                                    {isPositive ? '+' : ''}{periodReturnPct.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Grafik --- */}
            {!loading && hasEnoughSnapshots && (
                <div className="flex-1 w-full min-h-[140px] pt-1 -mb-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayChartData} margin={{ top: 5, right: 2, left: -22, bottom: 0 }}>
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
            )}
        </div>
    );
}

