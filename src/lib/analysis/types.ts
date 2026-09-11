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

  // Phase 9: Standardized Provenance & Data Payload Hashes
  standardProvenance?: StandardProvenanceItem[];
  rawPayloadHashes?: Record<string, string>;
  provenancePackage?: ProvenanceAuditPackage;

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
  version?: number;
  previous_snapshot_id?: string | null;
  change_diff?: SnapshotComparisonResult | null;
  change_summary?: CausalChangeNarrative | null;
  standard_provenance?: StandardProvenanceItem[];
  provenance_package?: ProvenanceAuditPackage;
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
  sourceStatus?: SourceStatus;
  primaryProvenanceId?: string;
  verificationBasis?: string;
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
  standardProvenance?: StandardProvenanceItem[];
  provenancePackage?: ProvenanceAuditPackage;

  // Guardrail & Quality Audit
  guardrail: {
    decision: GuardrailDecision;
    isPublishable: boolean;
    violationsCount: number;
    warningsCount: number;
    warnings: string[];
    validatedClaimsCount: number;
  };

  // Phase 10: Quality Evaluator & Calibration
  qualityEvaluation?: QualityEvaluationResult;

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

// ============================================================================
// PHASE 8: ANALYSIS HISTORY & VERSIONING TYPES
// ============================================================================

export type FactorChangeType = 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';

export interface FactorDiffItem {
  factorId: string;
  title: string;
  changeType: FactorChangeType;
  transmissionChannel: string;
  previousDirection?: ImpactDirection | string | null;
  currentDirection?: ImpactDirection | string | null;
  previousMagnitude?: ImpactMagnitude | string | null;
  currentMagnitude?: ImpactMagnitude | string | null;
  directionChanged: boolean;
  magnitudeChanged: boolean;
  explanation: string;
  source?: string;
}

export interface FinancialMetricDiff {
  metric: string;
  label: string;
  previousValue: number | string | null;
  currentValue: number | string | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  isMaterial: boolean;
}

export interface CausalChangeNarrative {
  whatChanged: string;            // Ne değişti?
  whyItChanged: string;           // Neden değişti?
  implicationForAnalysis: string; // Analize etkisi
  keyDriversSummary: string[];
}

export interface SnapshotComparisonResult {
  symbol: string;
  hasChanged: boolean;
  baseSnapshotId: string | null;
  baseVersion: number | null;
  baseTimestamp: string | null;
  baseFingerprint: string | null;
  targetSnapshotId: string;
  targetVersion: number;
  targetTimestamp: string;
  targetFingerprint: string;

  // Impact Balance Shift (Qualitative only - NO numerical scores)
  impactBalanceShift: {
    previousBalance: ImpactBalanceRating | string | null;
    currentBalance: ImpactBalanceRating | string | null;
    hasShifted: boolean;
    explanation: string;
  };

  // Data Differences
  dataChanges: {
    priceDiff?: {
      previous: number | null;
      current: number | null;
      changePercent: number | null;
    };
    isNewFinancialPeriod: boolean;
    previousPeriodEnd?: string | null;
    currentPeriodEnd?: string | null;
    financialMetricsDiff: FinancialMetricDiff[];
    newNewsCount: number;
    newNewsHeadlines: string[];
    dividendChangesCount: number;
    macroEventsDiff: string[];
  };

  // Factor Differences
  factorChanges: {
    added: FactorDiffItem[];
    removed: FactorDiffItem[];
    changed: FactorDiffItem[];
    unchanged: FactorDiffItem[];
    totalAdded: number;
    totalRemoved: number;
    totalChanged: number;
    totalUnchanged: number;
  };

  // Causal Narrative
  causalNarrative: CausalChangeNarrative;

  // Trigger Metadata Connection
  triggerContext?: {
    triggerType?: string;
    triggerReason?: string;
    triggerEventId?: string;
  };

  comparedAt: string;
}

export interface AnalysisHistoryItem {
  id: string;
  version: number;
  symbol: string;
  companyName: string;
  createdAt: string;
  dataTimestamp: string;
  fingerprint: string;
  previousSnapshotId: string | null;
  status: string;
  triggerReason?: string;
  triggerType?: string;
  impactBalance?: string;
  guardrailStatus?: string;
  changeSummary?: CausalChangeNarrative | null;
  price?: number | null;
  periodEnd?: string | null;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  symbol: string;
  companyName: string;
  totalSnapshots: number;
  currentVersion: number;
  snapshots: AnalysisHistoryItem[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// PHASE 9: PROVENANCE & TRANSPARENCY (VERİ KAYNAĞI İZLENEBİLİRLİĞİ)
// ============================================================================

/**
 * Qualitative operational verification status for a data source.
 * Strict Rule: No numeric reliability scores!
 */
export type SourceStatus = 'VERIFIED' | 'STALE' | 'MISSING' | 'UNAVAILABLE' | 'CONFLICT';

/**
 * Official source hierarchy tier for deterministic conflict resolution
 * Tier 1: KAP, Audited Financials, Official Corporate Registry
 * Tier 2: Borsa Istanbul (BIST), Central Bank (TCMB), TURKSTAT (TÜİK)
 * Tier 3: Market Data Providers (Yahoo Finance, TradingView, Google News RSS, Finnet)
 */
export type SourceHierarchyTier = 'PRIMARY_OFFICIAL' | 'SECONDARY_VERIFIED' | 'MARKET_DATA_PROVIDER';

export type RelatedDataType =
  | 'FINANCIAL_STATEMENTS'
  | 'HISTORICAL_PRICES'
  | 'COMPANY_PROFILE'
  | 'NEWS'
  | 'MACRO_CALENDAR'
  | 'FX_COMMODITY'
  | 'CORPORATE_ACTIONS'
  | 'SECTOR_PEERS';

/**
 * Standardized, fully traceable provenance item representing a single verified input feed.
 */
export interface StandardProvenanceItem {
  id: string; // Unique source identifier (e.g., 'kap_consolidated_statements', 'bist_daily_prices')
  sourceName: string; // Human readable official name
  provider: string; // Underlying provider / gateway
  tier: SourceHierarchyTier;
  tierLabelTr: string; // 'Birincil Resmî Bildirim' | 'Doğrulanmış İkincil Kaynak' | 'Piyasa Veri Sağlayıcısı'
  url?: string; // Verified public URL or search portal (NEVER fabricated)
  fetchedAt: string; // ISO 8601 timestamp when fetched
  dataTimestamp?: string | null; // Period end or market trade date
  freshness: FactorFreshness;
  sourceStatus: SourceStatus;
  rawPayloadHash: string; // Deterministic SHA-256 hash of the exact raw payload
  relatedDataType: RelatedDataType;
  recordCount?: number;
  notes?: string[];
}

/**
 * Traceable link connecting an extracted qualitative factor to verified data inputs
 */
export interface FactorProvenanceMapping {
  factorId: string;
  factorTitle: string;
  primaryProvenanceId: string;
  secondaryProvenanceIds?: string[];
  sourceStatus: SourceStatus;
  verificationBasis: string; // Concrete verifiable field or formula (e.g., 'quarterly[0].revenueYoY')
}

/**
 * Deterministic resolution record when two sources provide differing data points
 */
export interface DataConflictResolution {
  metric: string;
  sources: string[];
  values: Record<string, any>;
  selectedSource: string;
  resolvedValue: any;
  resolutionBasis: string; // Justification based on official hierarchy
  resolvedAt: string;
}

/**
 * Full provenance audit package attached to an analysis package or response
 */
export interface ProvenanceAuditPackage {
  symbol: string;
  assembledAt: string;
  overallStatus: SourceStatus;
  items: StandardProvenanceItem[];
  factorMappings: FactorProvenanceMapping[];
  conflictsResolved: DataConflictResolution[];
  unverifiedDataPoints: string[];
}

/**
 * Phase 10: Quality Evaluator & Production Hardening Contracts
 */
export type QualityDecision = 'PASS' | 'WARN' | 'REJECT';

export type QualityIssueCode =
  | 'MISSING_EVIDENCE'
  | 'BROKEN_CAUSAL_CHAIN'
  | 'UNSUPPORTED_SPECULATION'
  | 'IMPACT_BALANCE_MISMATCH'
  | 'SOURCE_MISMATCH'
  | 'DUPLICATE_FACTOR'
  | 'DEGRADED_DATA_ASSERTION'
  | 'UNVERIFIED_PRICE_TARGET'
  | 'INVESTMENT_ADVICE_PATTERN';

export interface QualityIssue {
  code: QualityIssueCode;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  factorId?: string;
  channel?: string;
  snippet?: string;
}

export interface FactorDeduplicationReport {
  originalFactorCount: number;
  deduplicatedFactorCount: number;
  groupedFactors: {
    eventKey: string;
    channel: string;
    mergedCount: number;
    survivingTitle: string;
  }[];
}

export interface CausalChainValidationReport {
  totalFactorsChecked: number;
  validChainsCount: number;
  brokenChainsCount: number;
  details: {
    factorTitle: string;
    hasTrigger: boolean;
    hasChannel: boolean;
    hasFinancialImplication: boolean;
    isComplete: boolean;
  }[];
}

export interface QualityEvaluationResult {
  evaluatorVersion: string;
  evaluatedAt: string;
  decision: QualityDecision;
  isPublishable: boolean;
  issues: QualityIssue[];
  warnings: string[];
  causalChainReport: CausalChainValidationReport;
  deduplicationReport: FactorDeduplicationReport;
  degradedDataNotice?: string;
}
