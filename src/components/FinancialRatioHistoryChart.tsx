"use client";

import { useState, useMemo } from 'react';
import { HistoricalTrendPoint } from '@/lib/sector-comparison-engine';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

interface Props {
  historicalTrend: HistoricalTrendPoint[];
  symbol: string;
  currency?: string;
}

export default function FinancialRatioHistoryChart({ historicalTrend, symbol, currency = '₺' }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<'roe' | 'roa' | 'netMargin' | 'income' | 'revenue' | 'ebitda' | 'debtToAssets'>('roe');

  const metricConfigs = {
    roe: { title: 'Özkaynak Kârlılığı (ROE)', unit: '%', key: 'roe', format: 'percent' },
    roa: { title: 'Aktif Kârlılık (ROA)', unit: '%', key: 'roa', format: 'percent' },
    netMargin: { title: 'Net Kâr Marjı', unit: '%', key: 'netMargin', format: 'percent' },
    income: { title: 'Net Dönem Kârı', unit: currency, key: 'netIncome', format: 'money' },
    revenue: { title: 'Satış Gelirleri', unit: currency, key: 'revenue', format: 'money' },
    ebitda: { title: 'FAVÖK', unit: currency, key: 'ebitda', format: 'money' },
    debtToAssets: { title: 'Borç / Toplam Varlıklar', unit: '%', key: 'debtToAssets', format: 'percent' }
  };

  const chartData = useMemo(() => {
    if (!historicalTrend || historicalTrend.length === 0) return [];
    return historicalTrend.map(pt => ({
      periodLabel: pt.periodLabel,
      roe: pt.roe,
      roa: pt.roa,
      netMargin: pt.netMargin,
      debtToAssets: pt.debtToAssets,
      revenue: pt.revenue != null ? pt.revenue / 1_000_000 : null, // Convert to Millions for chart scale
      ebitda: pt.ebitda != null ? pt.ebitda / 1_000_000 : null,
      netIncome: pt.netIncome != null ? pt.netIncome / 1_000_000 : null
    }));
  }, [historicalTrend]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
        Yeterli tarihsel veri bulunamadı.
      </div>
    );
  }

  const currentCfg = metricConfigs[selectedMetric];
  const currentKey = currentCfg.key;
  const validValues = chartData.map((d: any) => d[currentKey]).filter((v: any) => v != null && !isNaN(v));
  
  let minY = validValues.length > 0 ? Math.min(...validValues) : 0;
  let maxY = validValues.length > 0 ? Math.max(...validValues) : 100;
  
  if (minY === maxY) {
    minY = minY * 0.9;
    maxY = maxY * 1.1;
  }
  const rangeY = maxY - minY || 1;

  return (
    <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-sm">
      {/* Metric Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00008B]" />
          <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
            {symbol} Tarihsel Finansal Trend ({currentCfg.title})
          </h4>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'roe', label: 'ROE (%)' },
            { id: 'roa', label: 'ROA (%)' },
            { id: 'netMargin', label: 'Net Marj (%)' },
            { id: 'income', label: `Net Kâr (${currency})` },
            { id: 'revenue', label: `Gelir (${currency})` },
            { id: 'ebitda', label: `FAVÖK (${currency})` },
            { id: 'debtToAssets', label: 'Borç/Varlık (%)' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setSelectedMetric(btn.id as any)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap",
                selectedMetric === btn.id
                  ? "bg-[#00008B] text-white border-[#00008B] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Chart Bars / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
        {chartData.map((pt: any, idx: number) => {
          const val = pt[currentKey];
          const isMoney = currentCfg.format === 'money';
          const heightPercent = val != null ? Math.max(10, Math.min(100, ((val - minY) / rangeY) * 100)) : 0;

          return (
            <div key={idx} className="bg-white border border-slate-200/90 p-3 rounded-xl flex flex-col justify-between space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00008B]" />
                {pt.periodLabel}
              </span>

              {/* Bar Visualizer */}
              <div className="h-14 bg-slate-100 rounded-lg relative overflow-hidden flex items-end p-1">
                {val != null ? (
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-md transition-all duration-500",
                      val >= 0 ? "bg-gradient-to-t from-[#00008B] to-sky-500" : "bg-gradient-to-t from-rose-600 to-rose-400"
                    )}
                  />
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold m-auto">Veri Yok</span>
                )}
              </div>

              <div className="text-right">
                <span className={cn(
                  "text-xs font-black tracking-tight",
                  val != null ? (val >= 0 ? "text-[#00008B]" : "text-rose-600") : "text-slate-400"
                )}>
                  {val != null 
                    ? (isMoney ? `${val.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M ${currency}` : `%${val.toFixed(2)}`) 
                    : 'Veri Yok'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
