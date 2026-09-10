/**
 * FinAi Analysis System Core Type Contracts
 * 
 * Defines standardized data contracts for:
 * 1. Analysis Factor: Structured event-impact units (Data -> Event -> Channel -> Company -> Financial Result)
 * 2. Assembled Data Package: Fully verified, deterministic, multi-source analytical bundle
 * 3. Analysis Snapshot: Immutable point-in-time state of an analysis for tracking and change detection
 */

import { SectorCategory } from '@/types/financials';
import { HistoricalEngineResult } from '@/types/historical-engine-types';
import { MetricComparison } from '@/lib/sector-comparison-engine';
import { EnrichedNewsItem } from '@/app/api/news/route';
import { CatalogCalendarEvent } from '@/lib/calendar-catalog';

export type FactorType =
  | 'FINANCIAL'
  | 'VALUATION'
  | 'SECTOR'
  | 'NEWS'
  | 'MACRO_CALENDAR'
  | 'FX_COMMODITY'
  | 'CORPORATE_ACTION';

export type FactorRelevance =
  | 'DIRECT_COMPANY'
  | 'SECTOR'
  | 'MACRO'
  | 'MARKET';

export type ImpactDirection =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'unknown';

export type ImpactMagnitude =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type FactorFreshness =
  | 'REALTIME'
  | 'RECENT'
  | 'HISTORICAL'
  | 'STALE';

export type FactorPersistence =
  | 'TRANSITORY'
  | 'PERSISTENT'
  | 'STRUCTURAL';

/**
 * Structured unit representing a single analyzed factor.
 * Supports: Data -> Event -> Impact Channel -> Sector/Company -> Financial Result -> Potential Impact
 */
export interface AnalysisFactor {
  id: string;
  factorType: FactorType;
  title: string;
  explanation: string;
  relevance: FactorRelevance;
  impactDirection: ImpactDirection;
  magnitude: ImpactMagnitude;
  freshness: FactorFreshness;
  persistence: FactorPersistence;
  sourceReliability: number; // 0 - 100
  source: string;
  provenanceRef?: string;
  eventDate?: string;
  metricKey?: string;
  metricValue?: number | string | null;
  benchmarkValue?: number | string | null;
  metadata?: Record<string, any>;
}

export interface CompanyMarketContext {
  currentPrice: number | null;
  changePercent: number | null;
  high52w: number | null;
  low52w: number | null;
  volume: number | null;
  lastTradeDate: string | null;
  marketCap: number | null;
  currency: string;
  isMarketOpen: boolean;
  priceSource: string;
  priceTimestamp: string;
}

export interface StatementsPackage {
  latestQuarter: any | null;
  latestAnnual: any | null;
  allQuartersCount: number;
  allAnnualsCount: number;
  quarters: any[];
  annuals: any[];
  ttm: any | null;
  currency: string;
  isRestated: boolean;
  validationStatus: string;
}

export interface SectorContextPackage {
  category: SectorCategory;
  sectorName: string;
  peersCount: number;
  unsupportedMetrics: string[];
  comparisons: MetricComparison[];
}

export interface CorporateActionsPackage {
  historicalDividendsCount: number;
  latestDividends: any[];
  historicalSplitsCount: number;
  splits: any[];
  upcomingDividends: any[];
}

export interface FxCommodityExposurePackage {
  usdTry: number | null;
  eurTry: number | null;
  goldGram: number | null;
  brentPetrol: number | null;
  exposureType: 'FX_SENSITIVE' | 'COMMODITY_SENSITIVE' | 'DOMESTIC_TL' | 'BALANCED';
  exposureNotes: string[];
}

export interface KapContextPackage {
  hasExactProfile: boolean;
  kapProfileUrl: string | null;
  kapDisclosuresUrl: string;
  source: 'KAP_MEMBER_REGISTRY' | 'FALLBACK_SEARCH';
}

export interface DataQualityReport {
  score: number; // 0 - 100
  status: 'VALID' | 'WARNING' | 'INSUFFICIENT_DATA';
  hasProfile: boolean;
  hasPrices: boolean;
  hasStatements: boolean;
  hasRatios: boolean;
  notes: string[];
}

export interface DataFreshnessReport {
  assembledAt: string;
  priceDate: string | null;
  financialPeriodEnd: string | null;
  newsLatestDate: string | null;
  macroEventLatestDate: string | null;
  isStale: boolean;
  staleReasons: string[];
}

export interface ProvenanceRecord {
  source: string;
  endpoint?: string;
  fetchedAt: string;
  dataDate?: string;
  provider: string;
  reliabilityScore: number; // 0 - 100
  rawReference?: string;
  isFallback: boolean;
}

/**
 * Complete verified analytical data package created by the Data Assembler.
 * Feeds into the Factor Extractor, Snapshot Service, and downstream AI Analyzer.
 */
export interface AssembledDataPackage {
  symbol: string;
  companyName: string;
  sector: string;
  orchestratorVersion: string;
  assembledAt: string;
  fingerprint: string; // SHA-256 deterministic hash of core inputs

  // Domain Bundles
  companyProfile: any | null;
  marketData: CompanyMarketContext;
  statements: StatementsPackage;
  historicalTrends: HistoricalEngineResult | null;
  sectorContext: SectorContextPackage;
  relevantNews: EnrichedNewsItem[];
  relevantCalendarEvents: CatalogCalendarEvent[];
  corporateActions: CorporateActionsPackage;
  earningsCalendar: {
    expectedDate: string | null;
    daysLeft: number | null;
    source: string;
  };
  fxCommodityExposure: FxCommodityExposurePackage;
  kapContext: KapContextPackage;

  // Metadata & Integrity
  dataQuality: DataQualityReport;
  dataFreshness: DataFreshnessReport;
  provenance: Record<string, ProvenanceRecord>;
  conflicts: string[];

  // Phase 3: Impact Engine Result (Optional for backward compatibility)
  impactAnalysis?: ImpactEngineResult;
}

/**
 * Financial transmission channels for causal impact mapping
 */
export type ImpactTransmissionChannel =
  | 'REVENUE'
  | 'GROSS_MARGIN'
  | 'OPERATING_PROFIT'
  | 'FINANCING_COST'
  | 'FX_GAIN_LOSS'
  | 'TAX'
  | 'ONE_OFF'
  | 'NET_INCOME'
  | 'CASH_FLOW'
  | 'BALANCE_SHEET'
  | 'CAPITAL_STRUCTURE'
  | 'SECTOR_COMPETITION'
  | 'VALUATION_MULTIPLE'
  | 'MARKET_SENTIMENT';

/**
 * Structured causal chain: Data -> Event -> Transmission Channel -> Company -> Financial Result -> Net Assessment
 */
export interface CauseEffectChain {
  dataTrigger: string;
  event: string;
  transmissionChannel: ImpactTransmissionChannel;
  affectedEntity: string;
  financialImplication: string;
  netAssessment: string;
}

/**
 * Detailed financial impact assessment
 */
export interface FinancialImpactDetail {
  primaryChannel: ImpactTransmissionChannel;
  secondaryChannels?: ImpactTransmissionChannel[];
  estimatedDirection: ImpactDirection;
  estimatedMagnitude: ImpactMagnitude;
  description: string;
  isCashFlowImpacting: boolean;
  isOperational: boolean;
}

/**
 * Evaluated Impact Factor: Extends AnalysisFactor with deterministic multi-criteria scoring
 */
export interface EvaluatedImpactFactor extends AnalysisFactor {
  directness: FactorRelevance;
  financialImpact: FinancialImpactDetail;
  causeEffectChain: CauseEffectChain;
  confidence: number; // 0 - 100
  relativeWeightScore: number; // Multi-criteria score (0 - 100) based on directness + magnitude + persistence + freshness + reliability
  isConflicted: boolean;
  conflictGroup?: string;
  supportingDataPoint?: string | null;
}

/**
 * A pair of conflicting financial factors (e.g. rising revenues vs surging financial expenses)
 */
export interface ImpactConflict {
  id: string;
  category: string;
  positiveFactor: EvaluatedImpactFactor;
  negativeFactor: EvaluatedImpactFactor;
  dialecticSummary: string;
  relativeResolution: string; // Narrative explaining which factor has higher directness/persistence
  dominantSide: 'positive' | 'negative' | 'balanced';
}

/**
 * Synthesis of overall impact balance across dominant and counter drivers
 */
export interface ImpactSynthesisSummary {
  dominantForcesSummary: string;
  counterForcesSummary: string;
  primaryTension: string | null;
  directCompanyFactorsCount: number;
  macroSectorFactorsCount: number;
  conflictsCount: number;
  dataCompletenessRating: 'HIGH' | 'MODERATE' | 'LOW';
}

/**
 * Complete deterministic result produced by the Financial Impact Engine
 */
export interface ImpactEngineResult {
  engineVersion: string;
  evaluatedAt: string;
  symbol: string;
  evaluatedFactors: EvaluatedImpactFactor[];
  dominantDrivers: EvaluatedImpactFactor[];
  counterDrivers: EvaluatedImpactFactor[];
  neutralOrUncertain: EvaluatedImpactFactor[];
  conflicts: ImpactConflict[];
  synthesisSummary: ImpactSynthesisSummary;
}

/**
 * Snapshot record stored in Supabase `analysis_snapshots` table
 */
export interface AnalysisSnapshotRecord {
  id: string;
  symbol: string;
  company_name: string;
  created_at: string;
  data_timestamp: string;
  snapshot_version: number;
  orchestrator_version: string;
  fingerprint: string;
  data_package: AssembledDataPackage;
  factors: AnalysisFactor[];
  source_provenance: Record<string, ProvenanceRecord>;
  data_freshness: DataFreshnessReport;
  data_quality: DataQualityReport;
  relevant_events: any[];
  status: 'ASSEMBLED' | 'ANALYZED' | 'ARCHIVED';
  impact_analysis?: ImpactEngineResult;
  ai_analysis?: AIAnalysisResult;
  guardrail_status?: GuardrailDecision;
  guardrail_report?: QualityAuditReport;
  update_reason?: string;
  trigger_type?: string;
  trigger_event_id?: string;
  previous_fingerprint?: string;
}

/**
 * Change difference comparison between two snapshots
 */
export interface SnapshotDiffResult {
  hasChanged: boolean;
  previousSnapshotId: string | null;
  previousTimestamp: string | null;
  currentTimestamp: string;
  priceDiffPercent: number | null;
  isNewStatementPeriod: boolean;
  newFinancialPeriodEnd?: string;
  newNewsCount: number;
  newFactorsCount: number;
  changesSummary: string[];
}

// ============================================================================
// PHASE 4: AI ANALYSIS ENGINE & FINAI SYSTEM PROMPT TYPES
// ============================================================================

export type ImpactBalanceRating = 'Pozitif' | 'Negatif' | 'Nötr';

export interface AIKeyFactorSummary {
  title: string;
  transmissionChannel: ImpactTransmissionChannel | string;
  direction: 'positive' | 'negative' | 'neutral';
  causalExplanation: string; // Olay -> Kanal -> Şirket -> Finansal Sonuç
  source: string;
}

export interface AIScenarios {
  baseline: string; // Mevcut durum sürerse
  optimistic: string; // Olumlu katalizörler gerçekleşirse
  cautious: string; // Riskler ağır basarsa
}

export interface AISourceReference {
  source: string;
  details: string;
  url?: string;
}

/**
 * Structured Output of the FinAi AI Analysis Engine
 */
export interface AIAnalysisResult {
  symbol: string;
  companyName: string;
  generatedAt: string;
  modelUsed: string;
  promptVersion: string;
  snapshotFingerprint: string;

  // Main narrative sections
  generalOverview: string; // Genel Durum
  impactBalance: ImpactBalanceRating; // Etki Dengesi (No numeric score)
  impactBalanceReasoning: string; // Etki Dengesi Gerekçesi

  // Core impact factors explained causally
  keyFactors: AIKeyFactorSummary[]; // Ana Etkiler

  // Narrative synthesis
  detailedCommentary: string; // FinAi Yorumu (ilişkileri açıklayan derin analiz)

  // Scenarios (Conditional, not predictive)
  scenarios: AIScenarios; // Senaryolar

  // What to watch
  watchItems: string[]; // Nelere Dikkat Edilmeli?

  // Financial Education Note
  educationalTakeaway: string; // Finansal Eğiticilik Notu

  // Data Transparency & Provenance
  dataUncertainties: string[]; // Veri eksikliği veya belirsizlik notları
  sourceReferences: AISourceReference[]; // Kaynak Referansları

  // Performance & Caching
  isCached: boolean;
  rawResponse?: string;

  // Phase 5: Quality & Safety Audit Report
  guardrailReport?: QualityAuditReport;
}

/**
 * Filtered, strictly verified context passed to Gemini (NO raw data dump)
 */
export interface AIAnalysisContext {
  symbol: string;
  companyName: string;
  sector: string;
  priceContext: {
    price: number | null;
    currency: string;
    changePercent: number | null;
    high52w: number | null;
    low52w: number | null;
  };
  waterfallSummary: {
    revenueYoY?: number | null;
    grossMarginTrend?: string;
    ebitdaYoY?: number | null;
    leverageTrend?: string;
    operatingCashFlow?: number | null;
    freeCashFlow?: number | null;
  };
  sectorComparisons: Array<{
    metricName: string;
    companyValue: string;
    sectorMedian: string;
    difference: string;
    status: string;
  }>;
  dominantPositiveDrivers: Array<{
    title: string;
    channel: string;
    explanation: string;
    causalChain: string;
    source: string;
  }>;
  counterNegativeDrivers: Array<{
    title: string;
    channel: string;
    explanation: string;
    causalChain: string;
    source: string;
  }>;
  conflictingTensions: Array<{
    category: string;
    summary: string;
    resolution: string;
  }>;
  relevantNewsEvents: Array<{
    title: string;
    channel: string;
    direction: string;
    source: string;
  }>;
  macroTransmissions: Array<{
    event: string;
    channel: string;
    direction: string;
  }>;
  dividendCapacity: {
    hasHistory: boolean;
    count: number;
    description: string;
  };
  commodityFxExposure: {
    type: string;
    usdTry: number | null;
    brentPetrol: number | null;
    notes: string[];
  };
  kapStatus: {
    hasExactProfile: boolean;
    url: string | null;
  };
  dataQualityAndFreshness: {
    rating: string;
    priceDate: string | null;
    financialPeriodEnd: string | null;
    staleReasons: string[];
  };
  unavailableDataPoints: string[];
}

// ============================================================================
// PHASE 5: AI GUARDRAIL & QUALITY CONTROL TYPES
// ============================================================================

export type GuardrailDecision = 'PASS' | 'WARN' | 'REJECT';

export type GuardrailViolationCode =
  | 'SCHEMA_INVALID'
  | 'HALLUCINATED_DATA'
  | 'SOURCE_MISMATCH'
  | 'INVESTMENT_ADVICE'
  | 'TARGET_PRICE'
  | 'UNGROUNDED_CERTAINTY'
  | 'CAUSALITY_VIOLATION'
  | 'WATERFALL_INCOHERENCE'
  | 'IMPACT_BALANCE_CONTRADICTION'
  | 'UNAVAILABLE_DATA_USED';

export interface ValidatedClaim {
  claimText: string;
  category: 'PRICE' | 'FINANCIAL_METRIC' | 'DATE' | 'EVENT' | 'SOURCE' | 'CAUSALITY';
  groundedValue: string | number;
  sourceContext: string;
}

export interface GuardrailViolation {
  code: GuardrailViolationCode;
  message: string;
  field?: string;
  snippet?: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface QualityAuditReport {
  guardrailVersion: string;
  checkedAt: string;
  decision: GuardrailDecision;
  isPublishable: boolean;
  violations: GuardrailViolation[];
  warnings: string[];
  validatedClaims: ValidatedClaim[];
  unverifiedClaims: string[];
  sourceMismatches: string[];
  complianceViolations: string[];
  dataConsistencyIssues: string[];
  auditedSymbol: string;
  dataFingerprint: string;
}

// ============================================================================
// PHASE 6: PRODUCTION UI & API RESPONSE TYPES
// ============================================================================

export interface UIFactorDetail {
  id: string;
  title: string;
  channel: ImpactTransmissionChannel | string;
  channelTitleTr: string;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  causalExplanation: string;
  causeEffectChain?: string[];
  source: string;
  sourceUrl?: string;
  reliabilityScore: number;
  verified?: boolean;
}

export interface UIUpcomingEvent {
  title: string;
  category: 'CALENDAR' | 'DIVIDEND' | 'EARNINGS' | 'KAP' | string;
  date: string;
  impactChannel?: string;
  impact?: string;
  source?: string;
  relevanceExplanation: string;
}

export interface FinAiAnalysisResponse {
  success: boolean;
  symbol: string;
  companyName: string;
  sector: string;
  
  // Market & Price Data
  currentPrice: number | null;
  currency: string;
  priceDate: string;
  changePercent?: number;
  high52w?: number;
  low52w?: number;

  // Impact Balance
  impactBalance: ImpactBalanceRating;
  impactBalanceReasoning: string;

  // Overview & Narrative
  generalOverview: string;
  detailedCommentary: string;
  educationalTakeaway: string;

  // 4 Core Narrative Dimensions
  narrativeSections: {
    whatIsHappening: string; // Ne oluyor?
    whyItMatters: string;    // Neden önemli?
    factorsAtPlay: string;   // Şirketi hangi faktörler etkiliyor?
    whatCouldChange: string; // Ne değişebilir?
  };

  // Structured Factors
  positiveFactors: UIFactorDetail[];
  negativeFactors: UIFactorDetail[];
  neutralFactors: UIFactorDetail[];
  allFactors?: UIFactorDetail[];

  // Dialectic Tensions
  conflictingTensions: {
    category: string;
    summary: string;
    resolution: string;
  }[];

  // Scenarios
  scenarios: {
    baseline: string;
    optimistic: string;
    cautious: string;
  };

  // Watch Items
  watchItems: string[];

  // Upcoming Events
  upcomingEvents: UIUpcomingEvent[];

  // Peer Comparison
  peerComparison?: {
    summary: string;
    metrics: {
      name: string;
      companyValue: number | string | null;
      sectorAvg: number | string | null;
    }[];
  };

  // Data Quality & Uncertainties
  dataQualityRating: string;
  confidenceScore?: number;
  dataFreshnessNotes: string[];
  unavailableDataPoints: string[];
  snapshotAgeMinutes?: number;

  // Sources & Provenance
  sourceReferences: {
    source: string;
    details?: string;
    url?: string;
  }[];
  provenance?: string[];

  // Guardrail & Quality Audit
  guardrail: {
    decision: GuardrailDecision;
    isPublishable: boolean;
    violationsCount: number;
    warningsCount: number;
    warnings: string[];
    validatedClaimsCount: number;
  };

  // Snapshot Metadata
  snapshot: {
    fingerprint: string;
    status: string;
    generatedAt: string;
    modelUsed: string;
    isCached: boolean;
  };
}

// ============================================================================
// PHASE 7: UPDATE / TRIGGER ENGINE TYPES
// ============================================================================

export type TriggerType =
  | 'FINANCIAL_STATEMENT'
  | 'COMPANY_EVENT'
  | 'NEWS'
  | 'ECONOMIC_CALENDAR'
  | 'FX_CHANGE'
  | 'COMMODITY_CHANGE'
  | 'DIVIDEND_EVENT'
  | 'TECHNICAL_REGIME_CHANGE'
  | 'SCHEDULED_CHECK'
  | 'MANUAL_REQUEST';

export type TriggerReason =
  | 'NEW_FINANCIAL_STATEMENT'
  | 'MATERIAL_NEWS'
  | 'MACRO_EVENT'
  | 'FX_CHANGE'
  | 'COMMODITY_CHANGE'
  | 'DIVIDEND_EVENT'
  | 'COMPANY_EVENT'
  | 'TECHNICAL_REGIME_CHANGE'
  | 'SCHEDULED_MATERIAL_CHANGE'
  | 'MANUAL_REFRESH';

export type TriggerDecisionStatus =
  | 'TRIGGERED'
  | 'SKIPPED_UNCHANGED'
  | 'SKIPPED_NOT_MATERIAL'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_STALE'
  | 'LOCKED'
  | 'FAILED';

export interface TriggerEvaluationEvent {
  id: string;
  type: TriggerType;
  symbol: string;
  timestamp: string;
  source: string;
  payload?: any;
  headline?: string;
  metrics?: Record<string, any>;
}

export interface TriggerEvaluationResult {
  symbol: string;
  decision: TriggerDecisionStatus;
  primaryReason?: TriggerReason;
  mergedReasons?: TriggerReason[];
  isMaterial: boolean;
  materialityScore: number; // 0 to 1
  materialityExplanation: string;
  shouldCallAI: boolean;
  previousFingerprint?: string;
  newFingerprint?: string;
  fingerprintChanged: boolean;
  diffSummary?: string[];
  evaluatedAt: string;
  error?: string;
}

export interface AnalysisUpdateOptions {
  forceRefresh?: boolean;
  triggerReason?: TriggerReason | string;
  triggerType?: TriggerType | string;
  triggerEventId?: string;
  previousFingerprint?: string;
}

export interface ScheduledUpdateBatchSummary {
  startedAt: string;
  completedAt: string;
  totalEvaluated: number;
  triggeredCount: number;
  skippedUnchangedCount: number;
  skippedNotMaterialCount: number;
  skippedDuplicateCount: number;
  skippedStaleCount: number;
  lockedCount: number;
  failedCount: number;
  aiCallsCount: number;
  results: TriggerEvaluationResult[];
}



