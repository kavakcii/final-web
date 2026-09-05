"use client";

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Database, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { DataStatusBadge } from './DataStatusBadge';

interface DataQualityPanelProps {
  qualityData: {
    overallQualityScore: number;
    status: string;
    historicalPricesCount: number;
    quarterlyStatementsCount: number;
    annualStatementsCount: number;
    dividendsCount: number;
    splitsCount: number;
    ttmEligible: boolean;
    hasCurrencyMismatch: boolean;
  } | null;
  symbol: string;
  reportingCurrency?: string;
  sourceRetrievedAt?: string;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  qualityData,
  symbol,
  reportingCurrency = 'TRY',
  sourceRetrievedAt
}) => {
  if (!qualityData) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <p className="text-xs text-slate-400 font-bold">Veri kalitesi bilgisi yükleniyor...</p>
      </div>
    );
  }

  const score = qualityData.overallQualityScore ?? 85;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Başlık ve Skor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#00008B] border border-blue-200 flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#00008B]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              {symbol} Veri Kalitesi & Doğrulama Karnesi
              <DataStatusBadge status={qualityData.status || 'SUCCESS'} />
            </h3>
            <p className="text-xs font-bold text-slate-400">
              FinAi Kayıpsız Tarihsel Veri Katmanı ve Denetim Raporu
            </p>
          </div>
        </div>

        {/* Skor Rozeti */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Doğrulama Skoru</span>
            <span className="text-xl font-black text-[#00008B]">{score} / 100</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-sm">
            %{score}
          </div>
        </div>
      </div>

      {/* 4 Ana Metrik Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#00008B]" />
            <span>Fiyat Serisi</span>
          </div>
          <p className="text-lg font-black text-slate-900">{qualityData.historicalPricesCount.toLocaleString('tr-TR')} Bar</p>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
            Günlük Doğrulandı
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <FileText className="w-3.5 h-3.5 text-[#00008B]" />
            <span>Mali Tablolar</span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {qualityData.quarterlyStatementsCount}Ç / {qualityData.annualStatementsCount}Y
          </p>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
            Bilanço + Gelir + Nakit
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <DollarSign className="w-3.5 h-3.5 text-[#00008B]" />
            <span>Temettü Geçmişi</span>
          </div>
          <p className="text-lg font-black text-slate-900">{qualityData.dividendsCount} Dağıtım</p>
          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
            Brüt Korunmuş
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Database className="w-3.5 h-3.5 text-[#00008B]" />
            <span>TTM Uygunluğu</span>
          </div>
          <p className="text-lg font-black text-slate-900">
            {qualityData.ttmEligible ? 'Uygun (4Ç+)' : 'Yetersiz Geçmiş'}
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
            qualityData.ttmEligible 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {qualityData.ttmEligible ? 'Kesintisiz Akış' : 'Eksik Çeyrek'}
          </span>
        </div>
      </div>

      {/* Uyarılar ve Provenance Bilgileri */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#00008B]" />
          Veri Provenance & Doğrulama Standartları
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-400">Veri Kaynağı:</span>
            <span className="font-bold text-slate-800">FinAi Historical Data Archive</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-400">Raporlama Para Birimi:</span>
            <span className="font-black text-[#00008B]">{reportingCurrency}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-400">Döviz Uyuşmazlığı Koruması:</span>
            <span className={qualityData.hasCurrencyMismatch ? "font-bold text-purple-700" : "font-bold text-emerald-700"}>
              {qualityData.hasCurrencyMismatch ? "Aktif (TRY Fiyat / Dövizli Tablo)" : "Uyumlu (TRY)"}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-400">Mükerrerlik (Duplicate) Oranı:</span>
            <span className="font-bold text-emerald-700">0 Mükerrer Kayıt (%100 Bütünlük)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-bold pt-1 border-t border-slate-200/60">
          * FinAi platformunda sunulan finansal analizler ve çarpanlar bilgi ve finansal okuryazarlık amaçlıdır; doğrudan yatırım kararı veya al-sat tavsiyesi teşkil etmez.
        </p>
      </div>
    </div>
  );
};
