/**
 * FinAI Common API Response & Error Standards
 */

import { NextResponse } from 'next/server';

export interface FinAiApiMeta {
  source: string;
  retrievedAt: string;
  currency?: string;
  financialCurrency?: string;
  priceCurrency?: string;
  dataStatus?: 'AVAILABLE' | 'PARTIAL' | 'NOT_APPLICABLE' | 'DATA_UNAVAILABLE';
  validationStatus?: 'VALIDATED' | 'WARNING' | 'INVALID';
  total?: number;
  count?: number;
  [key: string]: any;
}

export interface FinAiSuccessResponse<T> {
  success: true;
  symbol?: string;
  data: T;
  meta: FinAiApiMeta;
}

export interface FinAiErrorResponse {
  success: false;
  symbol?: string;
  data: null;
  error: {
    code: 'INVALID_SYMBOL' | 'NOT_FOUND' | 'DATA_UNAVAILABLE' | 'INTERNAL_ERROR' | 'UNPROCESSABLE_ENTITY';
    message: string;
  };
}

/**
 * Sanitizes an object so NaN, Infinity, and undefined are strictly converted to null
 */
export function sanitizeNulls<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) return null;
      }
      return value;
    })
  );
}

export function apiSuccess<T>(data: T, meta: Partial<FinAiApiMeta> = {}, symbol?: string, status: number = 200) {
  const payload: FinAiSuccessResponse<T> = {
    success: true,
    ...(symbol ? { symbol } : {}),
    data: sanitizeNulls(data),
    meta: {
      source: 'FinAi Historical Data Architecture',
      retrievedAt: new Date().toISOString(),
      dataStatus: 'AVAILABLE',
      validationStatus: 'VALIDATED',
      ...meta
    }
  };

  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}

export function apiError(
  code: 'INVALID_SYMBOL' | 'NOT_FOUND' | 'DATA_UNAVAILABLE' | 'INTERNAL_ERROR' | 'UNPROCESSABLE_ENTITY',
  message: string,
  symbol?: string,
  status: number = 400
) {
  const payload: FinAiErrorResponse = {
    success: false,
    ...(symbol ? { symbol } : {}),
    data: null,
    error: {
      code,
      message
    }
  };

  return NextResponse.json(payload, { status });
}
