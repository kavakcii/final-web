"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, LineChart, Lock, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PortfolioService, HistoryRange } from "@/lib/portfolio-service";

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
    const [timeRange, setTimeRange] = useState<HistoryRange>('1W');
    const [chartData, setChartData] = useState<{ date: string; balance: number }[]>([]);
    const [firstDate, setFirstDate]   = useState<string | null>(null);
    const [loading, setLoading]       = useState(true);
    const [daysSinceFirst, setDaysSinceFirst] = useState<number>(0);

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

    const latestBalance  = chartData[chartData.length - 1]?.balance ?? 0;
    const initialBalance = chartData[0]?.balance ?? 1;
    const growthPercent  = initialBalance > 0
        ? (((latestBalance - initialBalance) / initialBalance) * 100).toFixed(2)
        : '0.00';
    const isPositive = parseFloat(growthPercent) >= 0;

    const hasData = chartData.length > 0;

    // Yeni kullanıcı durumu: hiç veri yok
    const isNewUser = !firstDate && !loading;

    return (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <LineChart className="w-4 h-4 text-[#00008B]" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#00008B] tracking-tight">Varlık Gelişim Grafiği</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Günlük Kapanış Değeri</p>
                        </div>
                    </div>

                    {/* Zaman Filtresi */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        {(['1W', '1M', '3M', 'YTD', '1Y'] as HistoryRange[]).map((range) => {
                            const unlocked = isRangeUnlocked(range);
                            const isActive = timeRange === range;
                            return (
                                <button
                                    key={range}
                                    onClick={() => { if (unlocked) setTimeRange(range); }}
                                    title={
                                        unlocked
                                            ? RANGE_LABELS[range]
                                            : `${RANGE_DAYS[range]} günlük veri birikince açılır`
                                    }
                                    className={`relative px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all flex items-center gap-1 ${
                                        isActive && unlocked
                                            ? 'bg-[#00008B] text-white shadow-sm'
                                            : unlocked
                                                ? 'text-slate-500 hover:text-[#00008B]'
                                                : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    {!unlocked && <Lock className="w-2.5 h-2.5" />}
                                    {range}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* --- Yeni Kullanıcı Durumu --- */}
                {isNewUser && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-[#00008B]/40" />
                        </div>
                        <div className="text-center max-w-xs">
                            <p className="text-sm font-black text-slate-700 mb-1">Grafik Oluşmaya Başlıyor</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Her gün gece <span className="font-bold text-slate-600">23:59</span>&apos;da portföyünüzün kapanış değeri otomatik olarak kaydedilir.
                            </p>
                            <div className="mt-4 space-y-2">
                                {(['1W', '1M', '3M', 'YTD', '1Y'] as HistoryRange[]).map(r => (
                                    <div key={r} className="flex items-center gap-2 justify-between text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 font-bold text-[#00008B]">
                                            <Clock className="w-3 h-3" />
                                            {r}
                                        </span>
                                        <span>
                                            {r === '1W'
                                                ? '7 gün sonra açılır'
                                                : r === '1M'
                                                    ? '30 gün sonra açılır'
                                                    : r === '3M'
                                                        ? '3 ay sonra açılır'
                                                        : r === 'YTD'
                                                            ? 'Yıl ilerledikçe zenginleşir'
                                                            : '1 yıl sonra tam dolar'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Yüklenme Durumu --- */}
                {!isNewUser && loading && (
                    <div className="flex items-center justify-center h-44">
                        <div className="w-6 h-6 border-2 border-[#00008B] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* --- Veri Yok / Kilitli Dönem --- */}
                {!isNewUser && !loading && !hasData && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Lock className="w-6 h-6 text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 text-center">
                            Bu dönem için henüz yeterli veri birikimedi.
                            <br />
                            <span className="text-slate-300">
                                {RANGE_DAYS[timeRange]} günlük veri birikince açılır.
                            </span>
                        </p>
                    </div>
                )}

                {/* --- Grafik --- */}
                {!isNewUser && !loading && hasData && (
                    <>
                        {/* İstatistik */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    {RANGE_LABELS[timeRange]} Değişim
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-2xl font-black text-[#00008B]">
                                        ₺{latestBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className={`flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-lg border ${
                                        isPositive
                                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                            : 'text-red-500 bg-red-50 border-red-200'
                                    }`}>
                                        {isPositive ? '+' : ''}{growthPercent}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-300 block">
                                    {chartData.length} günlük veri
                                </span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-44 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                        width={90}
                                        domain={['dataMin', 'dataMax']}
                                        tickFormatter={(v: number) => `₺${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        tickCount={5}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#00008B',
                                            borderColor:     '#00008B',
                                            borderRadius:    '16px',
                                            color:           '#ffffff',
                                            fontSize:        '11px',
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
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: '#00008B', strokeWidth: 2, stroke: '#fff' }}
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
