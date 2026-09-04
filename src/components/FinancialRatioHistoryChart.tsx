"use client";

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, HelpCircle, Info, Activity, ShieldCheck } from 'lucide-react';
import { EDUCATIONAL_METRICS, HistoricalPeriodMetrics } from '@/lib/historical-analysis-engine';

interface Props {
  historicalData?: {
    periods: HistoricalPeriodMetrics[];
    growthAnalysis?: any;
    educationalDefinitions?: any;
  } | null;
  historicalTrend?: any[]; // Legacy fallback
  symbol: string;
  currency?: string;
}

export default function FinancialRatioHistoryChart({
  historicalData,
  historicalTrend,
  symbol,
  currency = '₺'
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'profitability' | 'cashFlow' | 'leverage' | 'liquidity' | 'efficiency'>('profitability');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('netMargin');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Category Configuration
  const categoryConfigs: Record<string, { label: string; metrics: string[] }> = {
    profitability: {
      label: 'Kârlılık & Marjlar',
      metrics: ['grossMargin', 'operatingMargin', 'ebitdaMargin', 'netMargin', 'roe', 'roa']
    },
    cashFlow: {
      label: 'Nakit Akışı & Gelir',
      metrics: ['revenue', 'ebitda', 'netIncome', 'operatingCashFlow', 'freeCashFlow', 'fcfMargin']
    },
    leverage: {
      label: 'Kaldıraç & Borç',
      metrics: ['debtToAssets', 'debtToEquity', 'netDebtToEBITDA']
    },
    liquidity: {
      label: 'Likidite',
      metrics: ['currentRatio', 'quickRatio']
    },
    efficiency: {
      label: 'Verimlilik & Devir Hızı',
      metrics: ['assetTurnover', 'inventoryTurnover', 'receivablesTurnover']
    }
  };

  // Metric metadata
  const metricMeta: Record<string, { title: string; unit: string; format: 'percent' | 'money' | 'multiple' | 'ratio' }> = {
    grossMargin: { title: 'Brüt Kâr Marjı', unit: '%', format: 'percent' },
    operatingMargin: { title: 'Faaliyet Kâr Marjı', unit: '%', format: 'percent' },
    ebitdaMargin: { title: 'FAVÖK Marjı', unit: '%', format: 'percent' },
    netMargin: { title: 'Net Kâr Marjı', unit: '%', format: 'percent' },
    roe: { title: 'Özkaynak Kârlılığı (ROE)', unit: '%', format: 'percent' },
    roa: { title: 'Aktif Kârlılık (ROA)', unit: '%', format: 'percent' },
    revenue: { title: 'Satış Gelirleri', unit: currency, format: 'money' },
    ebitda: { title: 'FAVÖK', unit: currency, format: 'money' },
    netIncome: { title: 'Net Dönem Kârı', unit: currency, format: 'money' },
    operatingCashFlow: { title: 'İşletme Nakit Akışı (OCF)', unit: currency, format: 'money' },
    freeCashFlow: { title: 'Serbest Nakit Akışı (FCF)', unit: currency, format: 'money' },
    fcfMargin: { title: 'Serbest Nakit Akış Marjı', unit: '%', format: 'percent' },
    debtToAssets: { title: 'Borç / Toplam Varlıklar', unit: '%', format: 'percent' },
    debtToEquity: { title: 'Finansal Borç / Özkaynak', unit: 'Oran', format: 'ratio' },
    netDebtToEBITDA: { title: 'Net Borç / FAVÖK', unit: 'x', format: 'multiple' },
    currentRatio: { title: 'Cari Oran', unit: 'Oran', format: 'ratio' },
    quickRatio: { title: 'Asit-Test Oranı', unit: 'Oran', format: 'ratio' },
    assetTurnover: { title: 'Aktif Devir Hızı', unit: 'x', format: 'multiple' },
    inventoryTurnover: { title: 'Stok Devir Hızı', unit: 'x', format: 'multiple' },
    receivablesTurnover: { title: 'Alacak Devir Hızı', unit: 'x', format: 'multiple' }
  };

  // Standardize periods
  const periodsData = useMemo(() => {
    if (historicalData?.periods && historicalData.periods.length > 0) {
      return historicalData.periods;
    }
    if (historicalTrend && historicalTrend.length > 0) {
      return historicalTrend.map((pt: any) => ({
        periodLabel: pt.periodLabel,
        grossMargin: (pt.grossProfit != null && pt.revenue != null && pt.revenue > 0) ? (pt.grossProfit / pt.revenue) * 100 : null,
        operatingMargin: null,
        ebitdaMargin: (pt.ebitda != null && pt.revenue != null && pt.revenue > 0) ? (pt.ebitda / pt.revenue) * 100 : null,
        netMargin: pt.netMargin,
        roe: pt.roe,
        roa: pt.roa,
        revenue: pt.revenue,
        ebitda: pt.ebitda,
        netIncome: pt.netIncome,
        operatingCashFlow: null,
        freeCashFlow: null,
        fcfMargin: null,
        debtToAssets: pt.debtToAssets,
        debtToEquity: null,
        netDebtToEBITDA: null,
        currentRatio: null,
        quickRatio: null,
        assetTurnover: null,
        inventoryTurnover: null,
        receivablesTurnover: null,
        statuses: {}
      }));
    }
    return [];
  }, [historicalData, historicalTrend]);

  if (!periodsData || periodsData.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100">
        Tarihsel finansal trend verisi bulunamadı.
      </div>
    );
  }

  const currentMeta = metricMeta[selectedMetricKey] || { title: selectedMetricKey, unit: '', format: 'ratio' };
  const currentEdu = (EDUCATIONAL_METRICS as any)[selectedMetricKey] || null;

  // Extract values for chart scaling
  const chartItems = periodsData.map((p: any) => {
    const rawVal = p[selectedMetricKey];
    let displayVal: number | null = rawVal;
    let formattedText = '—';
    const statusObj = p.statuses?.[selectedMetricKey];
    const isSectorDisabled = statusObj?.status === 'not_applicable';

    if (isSectorDisabled) {
      formattedText = 'Sektör Dışı';
      displayVal = null;
    } else if (rawVal != null && !isNaN(rawVal) && isFinite(rawVal)) {
      if (currentMeta.format === 'money') {
        const inMillions = rawVal / 1_000_000;
        formattedText = `${inMillions.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M ${currency}`;
        displayVal = inMillions;
      } else if (currentMeta.format === 'percent') {
        formattedText = `%${rawVal.toFixed(2)}`;
      } else if (currentMeta.format === 'multiple') {
        formattedText = `${rawVal.toFixed(2)}x`;
      } else {
        formattedText = rawVal.toFixed(2);
      }
    } else if (statusObj?.status === 'negative_input') {
      formattedText = 'Negatif Girdi';
    } else if (statusObj?.status === 'insufficient_history') {
      formattedText = 'Yetersiz Geçmiş Veri';
    } else if (statusObj?.status === 'insufficient_data') {
      formattedText = 'Eksik Veri';
    } else if (statusObj?.status === 'validation_failed' || statusObj?.status === 'unavailable') {
      formattedText = 'Kullanılamıyor';
    } else {
      formattedText = 'Eksik Veri';
    }

    return {
      periodLabel: p.periodLabel,
      rawVal,
      displayVal,
      formattedText,
      isSectorDisabled,
      status: statusObj?.status || (rawVal != null ? 'available' : 'unavailable'),
      reason: statusObj?.reason || ''
    };
  });

  const validValues = chartItems.map(d => d.displayVal).filter((v: any) => v != null && !isNaN(v)) as number[];
  let minY = validValues.length > 0 ? Math.min(...validValues) : 0;
  let maxY = validValues.length > 0 ? Math.max(...validValues) : 100;

  if (minY === maxY) {
    minY = minY * 0.9;
    maxY = maxY * 1.1;
  }
  const rangeY = maxY - minY || 1;

  return (
    <div className="space-y-4 bg-slate-50/70 p-5 rounded-3xl border border-slate-200/90 shadow-sm">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00008B]" />
          <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
            {symbol} Tarihsel Finansal Trend Analizi
          </h4>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Object.keys(categoryConfigs).map(catKey => {
            const cat = categoryConfigs[catKey];
            const isCatActive = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => {
                  setSelectedCategory(catKey as any);
                  setSelectedMetricKey(categoryConfigs[catKey].metrics[0]);
                }}
                className={cn(
                  "px-3 py-1 text-[11px] font-black rounded-xl transition-all border whitespace-nowrap",
                  isCatActive
                    ? "bg-[#00008B] text-white border-[#00008B] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-2xl border border-slate-200/70">
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryConfigs[selectedCategory].metrics.map(metricKey => {
            const meta = metricMeta[metricKey];
            const isActive = selectedMetricKey === metricKey;
            return (
              <button
                key={metricKey}
                onClick={() => setSelectedMetricKey(metricKey)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border whitespace-nowrap",
                  isActive
                    ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                {meta?.title || metricKey}
              </button>
            );
          })}
        </div>

        {/* Educational Info Button */}
        {currentEdu && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#00008B] hover:bg-blue-100 text-[10px] font-black border border-blue-200 transition-all shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showTooltip ? 'Bilgiyi Gizle' : 'Rasyo Rehberi'}
          </button>
        )}
      </div>

      {/* Educational Tooltip Accordion */}
      {showTooltip && currentEdu && (
        <div className="bg-blue-950 text-white p-4 rounded-2xl space-y-2.5 text-xs shadow-lg border border-blue-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-blue-800 pb-2">
            <span className="font-black text-blue-200 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Info className="w-4 h-4 text-sky-400" />
              {currentEdu.name} Rehberi
            </span>
            <span className="text-[10px] font-mono bg-blue-900 px-2 py-0.5 rounded text-sky-300">
              Formül: {currentEdu.formula}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
            <div>
              <strong className="text-sky-300 block mb-0.5">Ne Ölçer?</strong>
              <p className="text-blue-100 font-medium">{currentEdu.whatItMeasures}</p>
            </div>
            <div>
              <strong className="text-emerald-300 block mb-0.5">Nasıl Yorumlanır?</strong>
              <p className="text-blue-100 font-medium">{currentEdu.howToInterpret}</p>
            </div>
            <div>
              <strong className="text-amber-300 block mb-0.5">Sektörel Dikkat:</strong>
              <p className="text-blue-100 font-medium">{currentEdu.sectorCaution}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart Bars / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
        {chartItems.map((pt, idx) => {
          const val = pt.displayVal;
          const heightPercent = val != null ? Math.max(12, Math.min(100, ((val - minY) / rangeY) * 100)) : 0;

          return (
            <div
              key={idx}
              className={cn(
                "bg-white border p-3 rounded-2xl flex flex-col justify-between space-y-2 shadow-sm transition-all hover:shadow-md",
                pt.isSectorDisabled ? "border-slate-200 bg-slate-50/50" : "border-slate-200/90"
              )}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00008B]" />
                {pt.periodLabel}
              </span>

              {/* Bar Visualizer */}
              <div className="h-16 bg-slate-100 rounded-xl relative overflow-hidden flex items-end p-1">
                {val != null ? (
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-lg transition-all duration-500",
                      val >= 0
                        ? "bg-gradient-to-t from-[#00008B] to-sky-500 shadow-sm"
                        : "bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm"
                    )}
                  />
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold m-auto text-center px-1">
                    {pt.formattedText}
                  </span>
                )}
              </div>

              {/* Text Value */}
              <div className="text-right">
                <span
                  className={cn(
                    "text-xs font-black tracking-tight block truncate",
                    val != null
                      ? (val >= 0 ? "text-[#00008B]" : "text-rose-600")
                      : "text-slate-400 text-[10px]"
                  )}
                  title={pt.reason || pt.formattedText}
                >
                  {pt.formattedText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
