"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Info, MinusCircle } from 'lucide-react';

export type FinAiStatusType =
  | 'available'
  | 'AVAILABLE'
  | 'partial'
  | 'PARTIAL'
  | 'not_applicable'
  | 'NOT_APPLICABLE'
  | 'insufficient_data'
  | 'insufficient_history'
  | 'INSUFFICIENT_HISTORY'
  | 'negative_input'
  | 'NEGATIVE_DENOMINATOR'
  | 'ZERO_DENOMINATOR'
  | 'CURRENCY_MISMATCH'
  | 'DATA_UNAVAILABLE'
  | 'unavailable'
  | 'validation_failed'
  | 'VALIDATED';

interface DataStatusBadgeProps {
  status: FinAiStatusType | string;
  labelOverride?: string;
  className?: string;
  showIcon?: boolean;
}

export function getStatusConfig(status: string) {
  const norm = String(status || '').toLowerCase();

  switch (norm) {
    case 'available':
    case 'validated':
    case 'active':
    case 'success':
      return {
        label: 'Doğrulandı',
        icon: CheckCircle2,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };

    case 'partial':
    case 'warning':
      return {
        label: 'Kısmi Veri',
        icon: AlertTriangle,
        bg: 'bg-amber-50 text-amber-700 border-amber-200'
      };

    case 'not_applicable':
      return {
        label: 'Sektör Dışı',
        icon: MinusCircle,
        bg: 'bg-slate-100 text-slate-600 border-slate-200'
      };

    case 'insufficient_history':
      return {
        label: 'Yetersiz Geçmiş',
        icon: Info,
        bg: 'bg-blue-50 text-blue-700 border-blue-200'
      };

    case 'currency_mismatch':
      return {
        label: 'Döviz Ayrımı',
        icon: AlertTriangle,
        bg: 'bg-purple-50 text-purple-700 border-purple-200'
      };

    case 'negative_denominator':
    case 'negative_input':
      return {
        label: 'Negatif Girdi',
        icon: MinusCircle,
        bg: 'bg-amber-50 text-amber-800 border-amber-300'
      };

    case 'zero_denominator':
      return {
        label: 'Sıfır Bölen',
        icon: MinusCircle,
        bg: 'bg-slate-100 text-slate-700 border-slate-300'
      };

    case 'data_unavailable':
    case 'unavailable':
    case 'insufficient_data':
    case 'not_found':
      return {
        label: 'Veri Mevcut Değil',
        icon: Info,
        bg: 'bg-slate-50 text-slate-500 border-slate-200'
      };

    case 'validation_failed':
    case 'failed':
    case 'invalid':
    case 'inactive':
      return {
        label: 'Kullanılamıyor',
        icon: XCircle,
        bg: 'bg-rose-50 text-rose-700 border-rose-200'
      };

    default:
      return {
        label: status || '—',
        icon: Info,
        bg: 'bg-slate-100 text-slate-600 border-slate-200'
      };
  }
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  status,
  labelOverride,
  className,
  showIcon = true
}) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider',
        config.bg,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{labelOverride || config.label}</span>
    </span>
  );
};
