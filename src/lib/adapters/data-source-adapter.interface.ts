/**
 * FinAI Data Source Adapter Interface - Stage 5B
 * Source-Independent Contract for External Financial Data Ingestion
 */

import { 
  FinancialPeriodData, 
  HistoricalDividendRecord, 
  PerShareData, 
  SectorInfo 
} from '@/types/financials';

export interface AdapterRawProvenance {
  source: string;
  sourceUrl?: string;
  endpoint: string;
  responseHash: string;
  httpStatus: number;
  fetchedAt: string;
  rawPayload: any;
}

export interface AdapterCompanyMetadata {
  symbol: string;
  cleanSymbol: string;
  companyName: string;
  sectorInfo: SectorInfo;
  currency: string;
  financialCurrency: string;
}

export interface AdapterFinancialStatements {
  metadata: AdapterCompanyMetadata;
  quarters: FinancialPeriodData[];
  annuals: FinancialPeriodData[];
  dividends: HistoricalDividendRecord[];
  perShare: PerShareData;
  provenance: AdapterRawProvenance[];
}

export interface IDataSourceAdapter {
  readonly sourceName: string;
  
  /**
   * Fetches full historical financial statements (Quarterly + Annual for IS, BS, CF)
   */
  getFinancialStatements(cleanSymbol: string): Promise<AdapterFinancialStatements>;

  /**
   * Fetches historical cash dividend payment history
   */
  getDividends(cleanSymbol: string): Promise<HistoricalDividendRecord[]>;

  /**
   * Fetches basic company profile and metadata
   */
  getMetadata(cleanSymbol: string): Promise<AdapterCompanyMetadata>;
}
