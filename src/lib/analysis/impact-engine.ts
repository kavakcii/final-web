/**
 * FinAi Financial Impact Engine (Etki Motoru) - Phase 3
 * 
 * Deterministic Financial Impact Assessment Layer that runs prior to any downstream AI generation.
 * 
 * Core Philosophy:
 * 1. Verified Data / Factor → Causal Financial Impact Evaluation.
 * 2. Multi-Criteria Assessment per factor:
 *    - Direction: positive | negative | neutral | unknown
 *    - Magnitude: high | medium | low | unknown
 *    - Directness: DIRECT_COMPANY | SECTOR | MACRO | MARKET
 *    - Financial Impact: Primary & Secondary Transmission Channels (Revenue, Margins, Operating Profit, Financing Cost, Cash Flow, etc.)
 *    - Freshness: REALTIME | RECENT | HISTORICAL | STALE
 *    - Persistence: TRANSITORY | PERSISTENT | STRUCTURAL
 *    - Source Reliability: Tier 1 (Official KAP/Audited Financials) -> Tier 4 (Unverified)
 *    - Confidence: 0 - 100
 *    - Causal Chain: Data Trigger → Event → Transmission Channel → Company → Financial Implication → Net Assessment
 * 3. Conflicting Forces Preservation:
 *    - Does NOT cancel out positive vs negative forces (No naive +1/-1 math).
 *    - Detects tensions (e.g. Operating growth vs Financing burden; Net income vs Cash flow divergence).
 *    - Evaluates relative prominence based on multi-dimensional weighting.
 * 4. Zero Synthetic Data:
 *    - Missing fields are preserved as null / UNAVAILABLE. No speculation.
 * 5. Strict Boundaries:
 *    - NO single composite "Health Score" or numerical stock score.
 *    - NO Buy / Sell / Hold recommendations.
 *    - NO future price targets or direction guarantees.
 */

import {
  AnalysisFactor,
  AssembledDataPackage,
  EvaluatedImpactFactor,
  FinancialImpactDetail,
  CauseEffectChain,
  ImpactConflict,
  ImpactEngineResult,
  ImpactSynthesisSummary,
  ImpactTransmissionChannel,
  ImpactDirection,
  ImpactMagnitude,
  FactorRelevance,
  FactorPersistence,
  FactorFreshness
} from './types';
import { NewsImpactRules } from '@/lib/news-impact-matrix';

export class FinancialImpactEngine {
  public static readonly VERSION = '1.0.0';

  /**
   * Main entry point: Evaluates an assembled data package and its qualitative factors
   */
  public static evaluate(
    dataPackage: AssembledDataPackage,
    baseFactors?: AnalysisFactor[]
  ): ImpactEngineResult {
    const symbol = dataPackage.symbol.toUpperCase();
    const evaluatedFactors: EvaluatedImpactFactor[] = [];

    // 1. Evaluate Financial Statement Waterfall
    const statementFactors = this.evaluateFinancialWaterfall(dataPackage);
    evaluatedFactors.push(...statementFactors);

    // 2. Evaluate Sector Positioning
    const sectorFactors = this.evaluateSectorContext(dataPackage);
    evaluatedFactors.push(...sectorFactors);

    // 3. Evaluate News Impact through Causal Transmission
    const newsFactors = this.evaluateNewsImpact(dataPackage);
    evaluatedFactors.push(...newsFactors);

    // 4. Evaluate Macro & Economic Calendar Transmission
    const macroFactors = this.evaluateMacroCalendar(dataPackage);
    evaluatedFactors.push(...macroFactors);

    // 5. Evaluate Dividend & Cash Distribution Capacity
    const dividendFactors = this.evaluateDividendCapacity(dataPackage);
    evaluatedFactors.push(...dividendFactors);

    // 6. Evaluate FX & Commodity Exposure Dynamics
    const fxCommodityFactors = this.evaluateFxAndCommodity(dataPackage);
    evaluatedFactors.push(...fxCommodityFactors);

    // 7. Evaluate Technical & Volume Context (Supportive Role Only)
    const technicalFactors = this.evaluateTechnicalContext(dataPackage);
    evaluatedFactors.push(...technicalFactors);

    // 8. Evaluate Corporate Actions & KAP Context
    const corporateFactors = this.evaluateCorporateActions(dataPackage);
    evaluatedFactors.push(...corporateFactors);

    // 9. Incorporate or upgrade any existing base factors if provided
    if (baseFactors && baseFactors.length > 0) {
      for (const base of baseFactors) {
        // Prevent duplicate IDs
        if (!evaluatedFactors.some(ef => ef.id === base.id)) {
          evaluatedFactors.push(this.upgradeBaseFactor(base, symbol));
        }
      }
    }

    // 10. Detect and evaluate Conflicting Financial Forces (Tensions)
    const conflicts = this.detectAndEvaluateConflicts(evaluatedFactors, symbol);

    // 11. Segregate into Dominant Drivers, Counter Drivers, and Neutral/Uncertain
    const dominantDrivers = evaluatedFactors.filter(
      f => f.impactDirection === 'positive' && f.relativeWeightScore >= 60
    ).sort((a, b) => b.relativeWeightScore - a.relativeWeightScore);

    const counterDrivers = evaluatedFactors.filter(
      f => f.impactDirection === 'negative' && f.relativeWeightScore >= 60
    ).sort((a, b) => b.relativeWeightScore - a.relativeWeightScore);

    const neutralOrUncertain = evaluatedFactors.filter(
      f => f.impactDirection === 'neutral' || f.impactDirection === 'unknown' || f.relativeWeightScore < 60
    ).sort((a, b) => b.relativeWeightScore - a.relativeWeightScore);

    // 12. Build Deterministic Synthesis Summary
    const synthesisSummary = this.buildSynthesisSummary(
      dataPackage,
      dominantDrivers,
      counterDrivers,
      conflicts,
      evaluatedFactors
    );

    return {
      engineVersion: this.VERSION,
      evaluatedAt: new Date().toISOString(),
      symbol,
      evaluatedFactors,
      dominantDrivers,
      counterDrivers,
      neutralOrUncertain,
      conflicts,
      synthesisSummary
    };
  }

  // ============================================================================
  // DOMAIN 1: FINANCIAL STATEMENT WATERFALL EVALUATION
  // Satışlar → marjlar → faaliyet kârlılığı → finansman giderleri → kur etkisi → vergi → tek seferlik gelir/gider → net kâr → nakit akışı
  // ============================================================================
  private static evaluateFinancialWaterfall(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const trends = pkg.historicalTrends;
    const latestQ = pkg.statements?.latestQuarter;

    if (!trends && !latestQ) {
      return factors;
    }

    // 1.1 Top-Line Revenue Dynamics
    const revMetric = trends?.growthAnalysis?.metrics?.['revenue'];
    if (revMetric && revMetric.latestYoY?.yoyGrowthRate != null) {
      const rate = revMetric.latestYoY.yoyGrowthRate;
      const dir: ImpactDirection = rate > 15 ? 'positive' : (rate < -5 ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = Math.abs(rate) > 30 ? 'high' : (Math.abs(rate) > 10 ? 'medium' : 'low');

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_REVENUE_WATERFALL`,
        factorType: 'FINANCIAL',
        title: 'Hasılat Büyüme Dinamiği (Üst Satır)',
        explanation: `Şirketin hasılatı yıllık bazda %${rate >= 0 ? '+' : ''}${rate.toFixed(1)} değişim kaydetti. Büyüme yönü: ${revMetric.trendDirection}.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'Finansal Tablolar (KAP/Denetlenmiş Raporlar)',
        metricKey: 'revenueYoY',
        metricValue: rate,
        financialImpact: {
          primaryChannel: 'REVENUE',
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Üst satır gelir hacmi ${rate >= 0 ? 'genişleme' : 'daralma'} göstererek faaliyet ölçeğini belirlemektedir.`,
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: `Hasılat YoY: %${rate.toFixed(1)}`,
          event: `Dönemsel satış hacmi ve fiyatlama dinamikleri`,
          transmissionChannel: 'REVENUE',
          affectedEntity: symbol,
          financialImplication: rate >= 0 
            ? 'Pazar payı ve operasyonel hacim korunarak üst satır nakit üretimine temel oluşturuyor.' 
            : 'Satış hacmindeki gerileme marjlar ve sabit maliyet absorpsiyonu üzerinde baskı yaratabilir.',
          netAssessment: `Gelir büyümesi operasyonel kârlılık şelalesinin başlangıç itici gücüdür.`
        },
        confidence: 95
      }));
    }

    // 1.2 Gross Margin & Cost Absorption (Brüt Kârlılık)
    const grossMarginTrend = trends?.metricDirections?.['grossMargin'];
    if (grossMarginTrend) {
      const isPos = grossMarginTrend === 'IMPROVING';
      const isNeg = grossMarginTrend === 'DETERIORATING';
      const dir: ImpactDirection = isPos ? 'positive' : (isNeg ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = grossMarginTrend === 'VOLATILE' ? 'high' : 'medium';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_GROSS_MARGIN_WATERFALL`,
        factorType: 'FINANCIAL',
        title: 'Maliyet Baskısı ve Brüt Marj Gelişimi',
        explanation: `Satışların maliyeti ve hammadde/girdi fiyatları karşısında brüt kâr marjı ${isPos ? 'iyileşme' : (isNeg ? 'daralma' : 'dengeli')} seyretmektedir.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'Finansal Rasyo Motoru',
        metricKey: 'grossMarginTrend',
        metricValue: grossMarginTrend,
        financialImpact: {
          primaryChannel: 'GROSS_MARGIN',
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Maliyet enflasyonu ve fiyatlama gücü dengesi brüt marj seviyesine yansımaktadır.`,
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: `Brüt Marj Eğilimi: ${grossMarginTrend}`,
          event: `Girdi maliyetleri ve satış fiyatı geçişkenliği`,
          transmissionChannel: 'GROSS_MARGIN',
          affectedEntity: symbol,
          financialImplication: isPos 
            ? 'Şirket girdi maliyetlerindeki artışı satış fiyatlarına yansıtabilmekte ve birim kârlılığını artırmaktadır.' 
            : 'Maliyet baskısı fiyatlara tam yansıtılamadığı için brüt kârlılık marjı sıkışmaktadır.',
          netAssessment: `Brüt marj gücü operasyonel faaliyet kârının korunabilirliği için birincil kalkandır.`
        },
        confidence: 95
      }));
    }

    // 1.3 Core Operating Profit (Faaliyet Kârı / FAVÖK)
    const ebitdaGrowth = trends?.growthAnalysis?.metrics?.['ebitda'];
    if (ebitdaGrowth && ebitdaGrowth.latestYoY?.yoyGrowthRate != null) {
      const rate = ebitdaGrowth.latestYoY.yoyGrowthRate;
      const dir: ImpactDirection = rate > 15 ? 'positive' : (rate < -5 ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = Math.abs(rate) > 30 ? 'high' : 'medium';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_OPERATING_PROFIT_WATERFALL`,
        factorType: 'FINANCIAL',
        title: 'Çekirdek Faaliyet Kârlılığı (FAVÖK Dinamiği)',
        explanation: `Şirketin esas faaliyetlerinden elde ettiği nakit yaratma potansiyelini gösteren FAVÖK yıllık bazda %${rate >= 0 ? '+' : ''}${rate.toFixed(1)} değişim gösterdi.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'STRUCTURAL',
        sourceReliability: 95,
        source: 'Finansal Tablolar (KAP/Denetlenmiş Raporlar)',
        metricKey: 'ebitdaYoY',
        metricValue: rate,
        financialImpact: {
          primaryChannel: 'OPERATING_PROFIT',
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Operasyonel verimlilik ve esas faaliyet kâr üretimi gücü.`,
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: `FAVÖK YoY: %${rate.toFixed(1)}`,
          event: `Operasyonel faaliyet kârlılığı performansı`,
          transmissionChannel: 'OPERATING_PROFIT',
          affectedEntity: symbol,
          financialImplication: rate >= 0 
            ? 'Şirketin çekirdek iş kolu güçlü nakit akışı üretme kapasitesini sürdürüyor.' 
            : 'Esas faaliyet marjlarındaki daralma finansman yükünü karşılama kapasitesini zorlayabilir.',
          netAssessment: `Şirketin finansal sağlığının en temel operasyonel göstergesidir.`
        },
        confidence: 95
      }));
    }

    // 1.4 Financing Expenses & Debt Burden (Finansman Gideri / Borçluluk)
    const leverageTrend = trends?.metricDirections?.['debtToAssets'] || trends?.metricDirections?.['financialLeverage'];
    if (leverageTrend) {
      const isHighLeverage = leverageTrend === 'IMPROVING' ? false : (leverageTrend === 'DETERIORATING' ? true : false);
      const dir: ImpactDirection = isHighLeverage ? 'negative' : 'positive';
      const mag: ImpactMagnitude = isHighLeverage ? 'high' : 'medium';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_FINANCING_BURDEN`,
        factorType: 'FINANCIAL',
        title: 'Finansman Giderleri ve Kaldıraç Baskısı',
        explanation: `Şirketin borçluluk ve kaldıraç yapısı ${isHighLeverage ? 'artış eğiliminde olup net kâr üzerinde finansman gideri baskısı oluşturmaktadır' : 'kontrol altında ve dengeli bir seyir izlemektedir'}.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Finansal Bilanço Analizi',
        metricKey: 'debtTrend',
        metricValue: leverageTrend,
        financialImpact: {
          primaryChannel: 'FINANCING_COST',
          secondaryChannels: ['BALANCE_SHEET', 'NET_INCOME'],
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Faiz oranları ortamında borç servis maliyeti ve net kâr erozyonu riski.`,
          isCashFlowImpacting: true,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `Kaldıraç Eğilimi: ${leverageTrend}`,
          event: `Borçluluk düzeyi ve faiz gideri yükümlülükleri`,
          transmissionChannel: 'FINANCING_COST',
          affectedEntity: symbol,
          financialImplication: isHighLeverage 
            ? 'Yüksek finansman giderleri operasyonel faaliyet kârının net kâra dönüşüm oranını düşürmektedir.' 
            : 'Düşük borçluluk seviyesi yüksek faiz ortamında şirkete operasyonel esneklik sağlamaktadır.',
          netAssessment: `Faiz ortamında net kârı faaliyet kârından ayrıştıran en kritik finansal kanaldır.`
        },
        conflictGroup: 'OPERATING_VS_FINANCING',
        confidence: 90
      }));
    }

    // 1.5 Cash Flow vs Net Income Divergence (Kâr Kalitesi & Nakit Üretimi)
    const latestCF = trends?.cashFlowTrends?.[0];
    if (latestCF && latestCF.freeCashFlow != null && latestCF.operatingCashFlow != null) {
      const fcf = latestCF.freeCashFlow;
      const cfo = latestCF.operatingCashFlow;
      const isPositiveFCF = fcf > 0;
      const isPositiveCFO = cfo > 0;

      const dir: ImpactDirection = (isPositiveFCF && isPositiveCFO) ? 'positive' : (!isPositiveCFO ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = Math.abs(fcf) > 1_000_000_000 ? 'high' : 'medium';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_CASH_FLOW_DIVERGENCE`,
        factorType: 'FINANCIAL',
        title: 'Nakit Akım Kalitesi ve Serbest Nakit Üretimi (FCF)',
        explanation: `İşletme faaliyetlerinden nakit akışı ${isPositiveCFO ? 'pozitif (+)' : 'negatif (-)'} olup, yatırım harcamaları sonrası serbest nakit akımı (FCF) ${isPositiveFCF ? 'pozitif nakit fazlası' : 'nakit açığı'} vermektedir.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'STRUCTURAL',
        sourceReliability: 95,
        source: 'Nakit Akım Tablosu (KAP/Denetlenmiş Raporlar)',
        metricKey: 'freeCashFlow',
        metricValue: fcf,
        financialImpact: {
          primaryChannel: 'CASH_FLOW',
          secondaryChannels: ['CAPITAL_STRUCTURE', 'BALANCE_SHEET'],
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Muhasebe kârının gerçek nakde dönüşme kabiliyeti ve kendi kendini finanse edebilme gücü.`,
          isCashFlowImpacting: true,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: `CFO: ${cfo.toLocaleString('tr-TR')} ₺, FCF: ${fcf.toLocaleString('tr-TR')} ₺`,
          event: `İşletme sermayesi döngüsü ve serbest nakit üretimi`,
          transmissionChannel: 'CASH_FLOW',
          affectedEntity: symbol,
          financialImplication: isPositiveFCF 
            ? 'Güçlü serbest nakit akışı borç ödeme, temettü dağıtma ve özkaynak büyümesini dış finansmana ihtiyaç duymadan destekler.' 
            : 'Negatif serbest nakit akışı işletme sermayesi ihtiyacını veya borçlanma gereksinimini artırabilir.',
          netAssessment: `Nakit akımı bilançonun likidite dayanıklılığını belirleyen nihai gerçeklik testidir.`
        },
        conflictGroup: 'PROFIT_VS_CASH_FLOW',
        confidence: 95
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 2: SECTOR COMPARATIVE EVALUATION
  // Sektör gelişmesi → talep/maliyet/rekabet → şirket → finansal sonuç
  // ============================================================================
  private static evaluateSectorContext(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const sector = pkg.sectorContext;

    if (!sector || !sector.comparisons || sector.comparisons.length === 0) {
      return factors;
    }

    // Examine Net Margin vs Sector Median
    const marginComp = sector.comparisons.find(c => c.key === 'netMargin' || c.metric === 'netMargin');
    if (marginComp && marginComp.companyValue != null && marginComp.sectorMedian != null) {
      const diff = marginComp.difference ?? (marginComp.companyValue - marginComp.sectorMedian);
      const isOutperforming = diff > 0.02; // 2% higher than sector median
      const isUnderperforming = diff < -0.02;
      const dir: ImpactDirection = isOutperforming ? 'positive' : (isUnderperforming ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = Math.abs(diff) > 0.05 ? 'high' : 'medium';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_SECTOR_MARGIN_POSITION`,
        factorType: 'SECTOR',
        title: 'Sektör Ortalamasına Göre Kârlılık Konumu',
        explanation: `Şirketin net kâr marjı (%${(marginComp.companyValue * 100).toFixed(1)}), ${sector.sectorName} sektörü medyanının (%${(marginComp.sectorMedian * 100).toFixed(1)}) ${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)} puan ${diff >= 0 ? 'üzerinde' : 'altında'} konumlanmaktadır.`,
        relevance: 'SECTOR',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Sektör Karşılaştırma Motoru (SectorComparisonEngine)',
        metricKey: 'netMarginVsSector',
        metricValue: diff,
        benchmarkValue: marginComp.sectorMedian,
        financialImpact: {
          primaryChannel: 'SECTOR_COMPETITION',
          secondaryChannels: ['OPERATING_PROFIT', 'NET_INCOME'],
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Sektörel rekabet gücü ve birim kârlılık avantajı / dezavantajı.`,
          isCashFlowImpacting: false,
          isOperational: true
        },
        causeEffectChain: {
          dataTrigger: `Firma Marjı: %${(marginComp.companyValue * 100).toFixed(1)} vs Sektör: %${(marginComp.sectorMedian * 100).toFixed(1)}`,
          event: `Sektörel kârlılık benchmark kıyaslaması`,
          transmissionChannel: 'SECTOR_COMPETITION',
          affectedEntity: `${symbol} & ${sector.sectorName}`,
          financialImplication: isOutperforming 
            ? 'Şirket sektör geneline kıyasla daha yüksek fiyatlama gücüne ve maliyet kontrolüne sahiptir.' 
            : 'Sektör medyanının altında kalan marjlar rekabet baskısının veya daha yüksek maliyet yapısının göstergesidir.',
          netAssessment: `Sektör bağlamında göreceli operasyonel verimlilik düzeyini belgeler.`
        },
        confidence: 90
      }));
    }

    // Examine Valuation Multiple vs Sector Median (P/E or EV/EBITDA)
    const peComp = sector.comparisons.find(c => c.key === 'pe' || c.metric === 'pe');
    if (peComp && peComp.companyValue != null && peComp.sectorMedian != null && peComp.companyValue > 0) {
      const peRatio = peComp.companyValue / peComp.sectorMedian;
      const isDiscounted = peRatio < 0.8;
      const isPremium = peRatio > 1.3;
      const dir: ImpactDirection = isDiscounted ? 'positive' : (isPremium ? 'negative' : 'neutral');
      const mag: ImpactMagnitude = (isDiscounted || isPremium) ? 'medium' : 'low';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_SECTOR_VALUATION_PE`,
        factorType: 'VALUATION',
        title: 'Sektörel F/K Çarpanı Göreceli Değerlemesi',
        explanation: `Şirketin F/K oranı (${peComp.companyValue.toFixed(1)}x), ${sector.sectorName} sektör medyanına (${peComp.sectorMedian.toFixed(1)}x) kıyasla %${((peRatio - 1) * 100).toFixed(0)} ${peRatio > 1 ? 'primli' : 'iskontolu'} çarpan seviyesindedir.`,
        relevance: 'SECTOR',
        impactDirection: dir,
        magnitude: mag,
        freshness: 'RECENT',
        persistence: 'TRANSITORY',
        sourceReliability: 90,
        source: 'Sektör Karşılaştırma Motoru',
        metricKey: 'peRatioVsSector',
        metricValue: peComp.companyValue,
        benchmarkValue: peComp.sectorMedian,
        financialImpact: {
          primaryChannel: 'VALUATION_MULTIPLE',
          estimatedDirection: dir,
          estimatedMagnitude: mag,
          description: `Sektör akranlarına göre göreceli fiyatlama çarpanı seviyesi.`,
          isCashFlowImpacting: false,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `Şirket F/K: ${peComp.companyValue.toFixed(1)}x vs Sektör: ${peComp.sectorMedian.toFixed(1)}x`,
          event: `Piyasa fiyatlama çarpanı kıyaslaması`,
          transmissionChannel: 'VALUATION_MULTIPLE',
          affectedEntity: symbol,
          financialImplication: isDiscounted 
            ? 'Hisse sektör ortalamasına kıyasla çarpan bazında iskontolu işlem görmektedir.' 
            : (isPremium ? 'Hisse sektör ortalamasına kıyasla çarpan bazında primli değerlenmektedir.' : 'Değerleme sektör ortalamasıyla uyumludur.'),
          netAssessment: `Fiyatlama çarpanı seviyesi şirketin kâr büyümesi beklentileriyle dengelenmelidir.`
        },
        conflictGroup: 'VALUATION_VS_GROWTH',
        confidence: 85
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 3: NEWS IMPACT EVALUATION VIA CAUSAL TRANSMISSION
  // Haber → olay → sektör → şirket → finansal kanal → olası etki
  // ============================================================================
  private static evaluateNewsImpact(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const newsList = pkg.relevantNews || [];

    for (const news of newsList) {
      const title = news.title || '';
      const summary = news.description || '';
      const text = `${title} ${summary}`.toLowerCase();

      // Match against NewsImpactRules to determine causal relevance and transmission channel
      let matchedRule = NewsImpactRules.find(r => r.keywordRegex.test(text));
      let channel: ImpactTransmissionChannel = 'MARKET_SENTIMENT';
      let direction: ImpactDirection = 'neutral';
      let magnitude: ImpactMagnitude = 'low';

      // Determine transmission channel and impact
      if (/faiz|enflasyon|tcmb|tüfe|üfe/i.test(text)) {
        channel = 'FINANCING_COST';
        magnitude = 'medium';
      } else if (/petrol|opec|akaryakıt|brent/i.test(text)) {
        channel = 'GROSS_MARGIN';
        magnitude = (symbol === 'THYAO' || symbol === 'PGSUS' || symbol === 'TUPRS') ? 'high' : 'medium';
      } else if (/ihracat|dış ticaret|kur|dolar|euro/i.test(text)) {
        channel = 'FX_GAIN_LOSS';
        magnitude = 'medium';
      } else if (/sipariş|ihale|sözleşme|anlaşma|satış/i.test(text)) {
        channel = 'REVENUE';
        direction = 'positive';
        magnitude = 'medium';
      } else if (/ceza|soruşturma|dava|grev|kesinti/i.test(text)) {
        channel = 'ONE_OFF';
        direction = 'negative';
        magnitude = 'medium';
      }

      // Infer direction if news has sentiment
      if (news.sentiment === 'bullish') direction = 'positive';
      else if (news.sentiment === 'bearish') direction = 'negative';

      // Source reliability tier
      const sourceStr = typeof news.source === 'string'
        ? news.source
        : (typeof (news.source as any)?.name === 'string' ? (news.source as any).name : 'Piyasa Haber Akışı');

      const reliability = sourceStr.toLowerCase().includes('kap') ? 95
        : (sourceStr.toLowerCase().includes('bloomberg') || sourceStr.toLowerCase().includes('reuters') ? 90 : 75);

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_NEWS_${news.id || Math.abs(this.simpleHash(title))}`,
        factorType: 'NEWS',
        title: title.length > 80 ? title.substring(0, 77) + '...' : title,
        explanation: summary || title,
        relevance: (news as any).relevanceTier || 'DIRECT_COMPANY',
        impactDirection: direction,
        magnitude: magnitude,
        freshness: 'REALTIME',
        persistence: 'TRANSITORY',
        sourceReliability: reliability,
        source: sourceStr,
        provenanceRef: news.link,
        eventDate: news.pubDate,
        financialImpact: {
          primaryChannel: channel,
          estimatedDirection: direction,
          estimatedMagnitude: magnitude,
          description: `Haber akışının ${channel} kanalı üzerinden yaratabileceği olası etki.`,
          isCashFlowImpacting: channel === 'REVENUE' || channel === 'GROSS_MARGIN' || channel === 'ONE_OFF',
          isOperational: channel === 'REVENUE' || channel === 'GROSS_MARGIN'
        },
        causeEffectChain: {
          dataTrigger: news.title,
          event: `Dış haber ve kurumsal gelişme`,
          transmissionChannel: channel,
          affectedEntity: symbol,
          financialImplication: `Haber gelişmesi ${channel} dinamikleri üzerinde ${direction} yönlü duyarlılık oluşturabilir.`,
          netAssessment: matchedRule?.description || 'Haber akışının kısa vadeli algı ve operasyonel beklentiler üzerindeki yansımasıdır.'
        },
        confidence: reliability
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 4: MACRO & ECONOMIC CALENDAR EVALUATION
  // Makro gelişme → ekonomi → sektör → şirket → finansal etki
  // ============================================================================
  private static evaluateMacroCalendar(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const events = pkg.relevantCalendarEvents || [];

    for (const evt of events) {
      const eventName = evt.event || '';
      const country = evt.country || 'TR';
      const text = `${eventName}`.toLowerCase();

      let channel: ImpactTransmissionChannel = 'MARKET_SENTIMENT';
      let direction: ImpactDirection = 'neutral';
      let magnitude: ImpactMagnitude = 'low';

      if (/faiz|interest rate|policy rate/i.test(text)) {
        channel = 'FINANCING_COST';
        magnitude = 'high';
      } else if (/tüfe|cpi|enflasyon|inflation/i.test(text)) {
        channel = 'GROSS_MARGIN';
        magnitude = 'medium';
      } else if (/opec|petrol|oil/i.test(text)) {
        channel = 'GROSS_MARGIN';
        magnitude = (symbol === 'THYAO' || symbol === 'PGSUS') ? 'high' : 'medium';
      }

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_MACRO_${Math.abs(this.simpleHash(eventName))}`,
        factorType: 'MACRO_CALENDAR',
        title: `Makro Gelişme: ${eventName} (${country})`,
        explanation: `${country} kaynaklı ${eventName} makroekonomik göstergesi sektör ve sermaye maliyeti dinamiklerini etkileme potansiyeline sahiptir.`,
        relevance: 'MACRO',
        impactDirection: direction,
        magnitude: magnitude,
        freshness: 'RECENT',
        persistence: 'STRUCTURAL',
        sourceReliability: 90,
        source: 'Ekonomik Takvim (TCMB/Fed/Finnhub)',
        eventDate: evt.dateFormatted,
        financialImpact: {
          primaryChannel: channel,
          estimatedDirection: direction,
          estimatedMagnitude: magnitude,
          description: `Makro göstergenin ${channel} ve iskonto oranları üzerindeki dolaylı etkisi.`,
          isCashFlowImpacting: channel === 'FINANCING_COST',
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `${eventName} (${country})`,
          event: `Makroekonomik veri / Para politikası kararı`,
          transmissionChannel: channel,
          affectedEntity: `${symbol} (Makro kanal)`,
          financialImplication: `Makro ortamdaki değişim genel finansman maliyetleri ve talep eğilimleri üzerinden şirkete yansır.`,
          netAssessment: `Şirkete doğrudan değil, makro-sektörel aktarım mekanizması üzerinden etki eder.`
        },
        confidence: 85
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 5: DIVIDEND & CASH DISTRIBUTION CAPACITY EVALUATION
  // Kârlılık → nakit üretimi → nakit pozisyonu → dağıtım kapasitesi → temettü kararı → şirket açısından anlamı
  // ============================================================================
  private static evaluateDividendCapacity(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const actions = pkg.corporateActions;

    if (!actions) return factors;

    const histCount = actions.historicalDividendsCount || 0;
    const latestDivs = actions.latestDividends || [];
    const hasHistory = histCount > 0 && latestDivs.length > 0;

    if (hasHistory) {
      const latest = latestDivs[0];
      const divAmount = latest?.amount != null ? Number(latest.amount) : null;
      const dateStr = latest?.date || latest?.paymentDate || '';

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_DIVIDEND_CAPACITY`,
        factorType: 'CORPORATE_ACTION',
        title: 'Temettü Dağıtım Kültürü ve Nakit Getiri Kapasitesi',
        explanation: `Şirketin geçmişte ${histCount} adet temettü ödeme kaydı bulunmaktadır. En son dağıtım: ${divAmount != null ? divAmount.toFixed(2) + ' ₺' : 'Kayıtlı'} (${dateStr}).`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'medium',
        freshness: 'RECENT',
        persistence: 'PERSISTENT',
        sourceReliability: 95,
        source: 'KAP & Kurumsal Eylemler Arşivi',
        metricKey: 'historicalDividendsCount',
        metricValue: histCount,
        financialImpact: {
          primaryChannel: 'CAPITAL_STRUCTURE',
          secondaryChannels: ['CASH_FLOW'],
          estimatedDirection: 'positive',
          estimatedMagnitude: 'medium',
          description: `Nakit kâr payı dağıtma kabiliyeti şirketin serbest nakit üretimini ve hissedar getirisini tescil eder.`,
          isCashFlowImpacting: true,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `Geçmiş Temettü Adedi: ${histCount}`,
          event: `Nakit kâr dağıtım politikası ve sermaye getirisi`,
          transmissionChannel: 'CAPITAL_STRUCTURE',
          affectedEntity: symbol,
          financialImplication: 'Düzenli nakit temettü dağıtımı, şirketin kârlılığını nakde dönüştürebildiğini ve nakit akışının sağlıklı olduğunu gösterir.',
          netAssessment: `Kârlılık ve nakit fazlasının hissedar değerine dönüştürülme kapasitesini yansıtır.`
        },
        confidence: 95
      }));
    } else {
      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_DIVIDEND_RETENTION`,
        factorType: 'CORPORATE_ACTION',
        title: 'Kâr Dağıtım / Kârı Bünyede Tutma Durumu',
        explanation: `Şirketin yakın dönemde düzenli nakit temettü dağıtım geçmişi bulunmamaktadır; kârlar büyüme ve yatırımların finansmanında bünyede tutulmaktadır.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'neutral',
        magnitude: 'low',
        freshness: 'HISTORICAL',
        persistence: 'PERSISTENT',
        sourceReliability: 90,
        source: 'Kurumsal Eylemler Kayıtları',
        financialImpact: {
          primaryChannel: 'CAPITAL_STRUCTURE',
          estimatedDirection: 'neutral',
          estimatedMagnitude: 'low',
          description: `Kârın nakit olarak dağıtılmayıp şirket bünyesinde yeniden yatırıma yönlendirilmesi.`,
          isCashFlowImpacting: false,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `Temettü geçmişi: 0 kayıt`,
          event: `Kârın bünyede tutulması (retained earnings)`,
          transmissionChannel: 'CAPITAL_STRUCTURE',
          affectedEntity: symbol,
          financialImplication: 'Şirket sermayesini işletme sermayesi veya yatırım harcamalarında kullanarak dış borçlanma ihtiyacını azaltmaktadır.',
          netAssessment: `Temettü verimi arayan yatırımcılar için sınırlı nakit akışı sunarken, büyüme finansmanını destekler.`
        },
        confidence: 90
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 6: FX & COMMODITY SENSITIVITY EVALUATION
  // Petrol → maliyet/gider → marj → kârlılık → şirket etkisi (veya kur ihracat/borç)
  // ============================================================================
  private static evaluateFxAndCommodity(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const exposure = pkg.fxCommodityExposure;

    if (!exposure) return factors;

    // 6.1 Commodity Dynamics (Oil / Brent)
    if (exposure.brentPetrol != null) {
      const brentPrice = exposure.brentPetrol;
      const sectorLower = (pkg.sector || '').toLowerCase();
      const isAviation = symbol === 'THYAO' || symbol === 'PGSUS' || sectorLower.includes('havacılık') || sectorLower.includes('ulaştırma');
      const isRefinery = symbol === 'TUPRS' || sectorLower.includes('rafineri') || sectorLower.includes('petrol');

      if (isAviation) {
        // Oil is primarily a COST / EXPENSE channel for airlines (Jet fuel ~ 30-40% of OpEx)
        factors.push(this.createEvaluatedFactor({
          id: `${symbol}_IMP_COMMODITY_OIL_COST`,
          factorType: 'FX_COMMODITY',
          title: 'Petrol / Yakıt Maliyeti Duyarlılığı (Brent)',
          explanation: `Brent petrol (${brentPrice} $/varil) havacılık sektöründe operasyonel giderlerin (OpEx) yaklaşık %30-%40'ını oluşturan jet yakıtı maliyetlerini doğrudan belirler.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: brentPrice > 85 ? 'negative' : (brentPrice < 70 ? 'positive' : 'neutral'),
          magnitude: 'high',
          freshness: 'REALTIME',
          persistence: 'TRANSITORY',
          sourceReliability: 95,
          source: 'Emtia Verileri (Yahoo Finance/Piyasa)',
          metricKey: 'brentPetrol',
          metricValue: brentPrice,
          financialImpact: {
            primaryChannel: 'GROSS_MARGIN',
            secondaryChannels: ['OPERATING_PROFIT', 'CASH_FLOW'],
            estimatedDirection: brentPrice > 85 ? 'negative' : (brentPrice < 70 ? 'positive' : 'neutral'),
            estimatedMagnitude: 'high',
            description: `Petrol fiyatındaki dalgalanmalar doğrudan yakıt gideri ve brüt faaliyet marjı üzerinden kârlılığa yansır.`,
            isCashFlowImpacting: true,
            isOperational: true
          },
          causeEffectChain: {
            dataTrigger: `Brent Petrol: ${brentPrice} $/varil`,
            event: `Küresel enerji piyasası fiyatlaması`,
            transmissionChannel: 'GROSS_MARGIN',
            affectedEntity: symbol,
            financialImplication: brentPrice > 85
              ? 'Yüksek petrol fiyatları yakıt maliyetlerini artırarak birim yolcu başına kâr marjını baskılar.'
              : 'Ilımlı petrol fiyatları maliyet avantajı sağlayarak operasyonel marjları destekler.',
            netAssessment: `Petrol fiyatı havacılık şirketleri için en kritik dışsal maliyet değişkenidir.`
          },
          confidence: 95
        }));
      } else if (isRefinery) {
        // Oil is primarily REVENUE & REFINERY MARGIN channel
        factors.push(this.createEvaluatedFactor({
          id: `${symbol}_IMP_COMMODITY_OIL_REFINERY`,
          factorType: 'FX_COMMODITY',
          title: 'Rafineri Marjı ve Ham Petrol Döngüsü',
          explanation: `Brent petrol (${brentPrice} $/varil) rafineri ürün crack marjlarını ve stok kâr/zarar dinamiklerini şekillendirir.`,
          relevance: 'DIRECT_COMPANY',
          impactDirection: 'neutral',
          magnitude: 'high',
          freshness: 'REALTIME',
          persistence: 'PERSISTENT',
          sourceReliability: 95,
          source: 'Emtia Verileri',
          metricKey: 'brentPetrol',
          metricValue: brentPrice,
          financialImpact: {
            primaryChannel: 'REVENUE',
            secondaryChannels: ['GROSS_MARGIN'],
            estimatedDirection: 'neutral',
            estimatedMagnitude: 'high',
            description: `Rafineri işleme marjı ve stok değerleme etkisi.`,
            isCashFlowImpacting: true,
            isOperational: true
          },
          causeEffectChain: {
            dataTrigger: `Brent Petrol: ${brentPrice} $`,
            event: `Ham petrol arz-talep dengesi`,
            transmissionChannel: 'REVENUE',
            affectedEntity: symbol,
            financialImplication: 'Ürün fiyatları ile ham petrol arasındaki marj (crack spread) rafineri kârlılığını belirler.',
            netAssessment: `Rafineri sektörü için gelir ve ürün marjı belirleyicisidir.`
          },
          confidence: 95
        }));
      }
    }

    // 6.2 FX Exposure (USD/TRY & EUR/TRY)
    if (exposure.usdTry != null) {
      const isFxSensitive = exposure.exposureType === 'FX_SENSITIVE';
      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_FX_EXPOSURE`,
        factorType: 'FX_COMMODITY',
        title: 'Döviz Kuru Pozisyonu ve Parite Hassasiyeti',
        explanation: `USD/TRY (${exposure.usdTry?.toFixed(2) ?? 'N/A'}) ve EUR/TRY (${exposure.eurTry?.toFixed(2) ?? 'N/A'}) hareketleri şirketin ${isFxSensitive ? 'döviz gelirleri ve açık/fazla pozisyonu' : 'iç pazar odaklı yapısı'} üzerinden finansal tablolarına yansımaktadır.`,
        relevance: isFxSensitive ? 'DIRECT_COMPANY' : 'MACRO',
        impactDirection: isFxSensitive ? 'positive' : 'neutral',
        magnitude: isFxSensitive ? 'high' : 'low',
        freshness: 'REALTIME',
        persistence: 'STRUCTURAL',
        sourceReliability: 95,
        source: 'Piyasa Döviz Kurları (TCMB/Yahoo)',
        metricKey: 'usdTry',
        metricValue: exposure.usdTry,
        financialImpact: {
          primaryChannel: 'FX_GAIN_LOSS',
          secondaryChannels: ['REVENUE', 'FINANCING_COST'],
          estimatedDirection: isFxSensitive ? 'positive' : 'neutral',
          estimatedMagnitude: isFxSensitive ? 'high' : 'low',
          description: `Kur hareketlerinin ihracat gelirleri, ithal girdi maliyeti ve net döviz pozisyonu kâr/zararı üzerindeki bileşik etkisi.`,
          isCashFlowImpacting: false,
          isOperational: isFxSensitive
        },
        causeEffectChain: {
          dataTrigger: `USD/TRY: ${exposure.usdTry?.toFixed(2)}`,
          event: `Döviz kuru hareketi`,
          transmissionChannel: 'FX_GAIN_LOSS',
          affectedEntity: symbol,
          financialImplication: isFxSensitive 
            ? 'Döviz bazlı gelirler kur artışında TL hasılatı ve faaliyet marjlarını büyütürken, döviz borcu finansman giderini artırabilir.' 
            : 'Şirketin iç pazar odaklı olması kur hareketlerinin doğrudan etkisini sınırlandırır.',
          netAssessment: `Şirketin döviz varlık/yükümlülük dengesi kur şoklarına karşı kırılganlığı veya avantajı belirler.`
        },
        confidence: 90
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 7: TECHNICAL & VOLUME CONTEXT (SUPPORTIVE ROLE ONLY)
  // Fiyat + Hacim + Destekleyici Göstergeler (Kesin yön üretmez)
  // ============================================================================
  private static evaluateTechnicalContext(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const mkt = pkg.marketData;

    if (!mkt || mkt.currentPrice == null) return factors;

    const price = mkt.currentPrice;
    const high52 = mkt.high52w;
    const low52 = mkt.low52w;

    if (high52 != null && low52 != null && high52 > low52) {
      const rangePos = ((price - low52) / (high52 - low52)) * 100;
      const isNearHigh = rangePos > 85;
      const isNearLow = rangePos < 20;

      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_TECHNICAL_52W_POSITION`,
        factorType: 'VALUATION',
        title: 'Teknik Konum: 52 Haftalık Fiyat Aralığı',
        explanation: `Hisse mevcut ${price} ₺ fiyatı ile 52 haftalık zirve (${high52} ₺) ve dip (${low52} ₺) aralığının %${rangePos.toFixed(0)} seviyesinde işlem görmektedir.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: isNearHigh ? 'positive' : (isNearLow ? 'negative' : 'neutral'),
        magnitude: 'medium',
        freshness: 'REALTIME',
        persistence: 'TRANSITORY',
        sourceReliability: 95,
        source: 'BIST Piyasa Verileri',
        metricKey: 'price52wPercentile',
        metricValue: rangePos,
        financialImpact: {
          primaryChannel: 'MARKET_SENTIMENT',
          secondaryChannels: ['VALUATION_MULTIPLE'],
          estimatedDirection: isNearHigh ? 'positive' : (isNearLow ? 'negative' : 'neutral'),
          estimatedMagnitude: 'medium',
          description: `Piyasa fiyatlama momentumu ve psikolojik direnç/destek bölgeleri. Destekleyici veridir; geleceğe dönük kesin yön teşkil etmez.`,
          isCashFlowImpacting: false,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: `Fiyat: ${price} ₺ (52h: ${low52} - ${high52} ₺)`,
          event: `Piyasa takas ve fiyatlama dengesi`,
          transmissionChannel: 'MARKET_SENTIMENT',
          affectedEntity: symbol,
          financialImplication: 'Fiyatın 52 haftalık bandın neresinde olduğu piyasa algısını ve işlem likiditesini gösterir.',
          netAssessment: `Teknik veri analizde tek başına yön tayin etmez; temel finansal verilerle birlikte destekleyici bağlam olarak ele alınır.`
        },
        confidence: 85
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 8: CORPORATE ACTIONS & KAP CONTEXT EVALUATION
  // ============================================================================
  private static evaluateCorporateActions(pkg: AssembledDataPackage): EvaluatedImpactFactor[] {
    const factors: EvaluatedImpactFactor[] = [];
    const symbol = pkg.symbol;
    const kap = pkg.kapContext;

    if (kap && kap.hasExactProfile) {
      factors.push(this.createEvaluatedFactor({
        id: `${symbol}_IMP_KAP_REGISTRY`,
        factorType: 'CORPORATE_ACTION',
        title: 'Kamuyu Aydınlatma Platformu (KAP) Üyelik ve Şeffaflık Tescili',
        explanation: `Şirket, Borsa İstanbul ve MKK bünyesinde doğrulanmış resmî KAP profil ve bildirim kaydına sahiptir.`,
        relevance: 'DIRECT_COMPANY',
        impactDirection: 'positive',
        magnitude: 'low',
        freshness: 'RECENT',
        persistence: 'STRUCTURAL',
        sourceReliability: 100,
        source: 'Kamuyu Aydınlatma Platformu (KAP)',
        provenanceRef: kap.kapProfileUrl || undefined,
        financialImpact: {
          primaryChannel: 'CAPITAL_STRUCTURE',
          estimatedDirection: 'positive',
          estimatedMagnitude: 'low',
          description: `Kurumsal yönetim ve bilgi şeffaflığı güvencesi.`,
          isCashFlowImpacting: false,
          isOperational: false
        },
        causeEffectChain: {
          dataTrigger: 'Resmî KAP Kaydı',
          event: `Kurumsal şeffaflık ve mevzuat uyumu`,
          transmissionChannel: 'CAPITAL_STRUCTURE',
          affectedEntity: symbol,
          financialImplication: 'Doğrulanmış KAP varlığı, şirketin yasal bildirimlerinin ve denetlenmiş mali tablolarının güvenilirliğini teyit eder.',
          netAssessment: `Birincil resmi veri kaynağı olarak analizin güven temelidir.`
        },
        confidence: 100
      }));
    }

    return factors;
  }

  // ============================================================================
  // DOMAIN 9: CONFLICT & TENSION RESOLUTION ENGINE
  // Karşıt faktörleri silmez, göreceli ağırlık matrisi ile önem sırasını belirler
  // ============================================================================
  private static detectAndEvaluateConflicts(
    factors: EvaluatedImpactFactor[],
    symbol: string
  ): ImpactConflict[] {
    const conflicts: ImpactConflict[] = [];

    // 1. Conflict Group: OPERATING_VS_FINANCING
    // (Güçlü operasyonel kâr / FAVÖK büyümesi vs Yüksek finansman gideri / kaldıraç)
    const opProfit = factors.find(f => f.financialImpact.primaryChannel === 'OPERATING_PROFIT' && f.impactDirection === 'positive');
    const finCost = factors.find(f => f.financialImpact.primaryChannel === 'FINANCING_COST' && f.impactDirection === 'negative');

    if (opProfit && finCost) {
      opProfit.isConflicted = true;
      finCost.isConflicted = true;
      const dominantSide = opProfit.relativeWeightScore >= finCost.relativeWeightScore ? 'positive' : 'negative';

      conflicts.push({
        id: `${symbol}_CONF_OP_VS_FIN`,
        category: 'Operasyonel Güç vs. Finansman Yükü',
        positiveFactor: opProfit,
        negativeFactor: finCost,
        dialecticSummary: `Şirketin çekirdek iş kolunda güçlü faaliyet kârlılığı (FAVÖK) üretmesine karşın, yüksek borçluluk kaynaklı finansman giderleri net kârı baskılamaktadır.`,
        relativeResolution: dominantSide === 'positive'
          ? `Operasyonel faaliyet kârı ağırlık puanı (${opProfit.relativeWeightScore.toFixed(0)}) finansman gideri baskısından (${finCost.relativeWeightScore.toFixed(0)}) daha yüksek olup, şirketin esas faaliyet nakdi faiz yükünü karşılayabilecek tampona sahiptir.`
          : `Finansman gideri yükü (${finCost.relativeWeightScore.toFixed(0)}) operasyonel kâr üretiminin (${opProfit.relativeWeightScore.toFixed(0)}) üzerinde baskı kurmakta ve net kâr erozyonu yaratmaktadır.`,
        dominantSide
      });
    }

    // 2. Conflict Group: PROFIT_VS_CASH_FLOW
    // (Büyüyen hasılat / muhasebe kârı vs Negatif serbest nakit akışı FCF)
    const revenueFactor = factors.find(f => f.financialImpact.primaryChannel === 'REVENUE' && f.impactDirection === 'positive');
    const cashFlowFactor = factors.find(f => f.financialImpact.primaryChannel === 'CASH_FLOW' && f.impactDirection === 'negative');

    if (revenueFactor && cashFlowFactor) {
      revenueFactor.isConflicted = true;
      cashFlowFactor.isConflicted = true;
      const dominantSide = cashFlowFactor.relativeWeightScore >= revenueFactor.relativeWeightScore ? 'negative' : 'positive';

      conflicts.push({
        id: `${symbol}_CONF_REV_VS_FCF`,
        category: 'Büyüme vs. Nakit Üretimi Ayrışması',
        positiveFactor: revenueFactor,
        negativeFactor: cashFlowFactor,
        dialecticSummary: `Satış gelirleri büyürken nakit akımının negatif seyretmesi, büyümenin işletme sermayesi veya yoğun sermaye harcamaları (CapEx) tarafından tüketildiğine işaret eder.`,
        relativeResolution: `Nakit akımı doğrudan likiditeye (${cashFlowFactor.relativeWeightScore.toFixed(0)}) dayandığı için, muhasebe satış büyümesi (${revenueFactor.relativeWeightScore.toFixed(0)}) nakde dönüşene kadar dikkatle izlenmelidir.`,
        dominantSide
      });
    }

    // 3. Conflict Group: VALUATION_VS_GROWTH
    // (Güçlü operasyonel büyüme vs Sektöre göre primli çarpanlar)
    const growthFactor = factors.find(f => (f.financialImpact.primaryChannel === 'REVENUE' || f.financialImpact.primaryChannel === 'OPERATING_PROFIT') && f.impactDirection === 'positive');
    const valFactor = factors.find(f => f.financialImpact.primaryChannel === 'VALUATION_MULTIPLE' && f.impactDirection === 'negative');

    if (growthFactor && valFactor) {
      growthFactor.isConflicted = true;
      valFactor.isConflicted = true;
      const dominantSide = growthFactor.relativeWeightScore >= valFactor.relativeWeightScore ? 'positive' : 'negative';

      conflicts.push({
        id: `${symbol}_CONF_GROWTH_VS_VAL`,
        category: 'Büyüme Dinamiği vs. Primli Değerleme',
        positiveFactor: growthFactor,
        negativeFactor: valFactor,
        dialecticSummary: `Şirketin operasyonel performansı güçlü olmakla birlikte, hisse fiyatı sektör akranlarına kıyasla primli çarpanlarla değerlenmektedir.`,
        relativeResolution: dominantSide === 'positive'
          ? `Yüksek büyüme hızı (${growthFactor.relativeWeightScore.toFixed(0)}) değerleme primini (${valFactor.relativeWeightScore.toFixed(0)}) orta vadede telafi etme potansiyeline sahiptir.`
          : `Primli çarpanlar (${valFactor.relativeWeightScore.toFixed(0)}) operasyonel büyümenin büyük kısmını fiyatlamış olabilir.`,
        dominantSide
      });
    }

    return conflicts;
  }

  // ============================================================================
  // DOMAIN 10: SYNTHESIS & TENSION SUMMARY
  // ============================================================================
  private static buildSynthesisSummary(
    pkg: AssembledDataPackage,
    dominant: EvaluatedImpactFactor[],
    counter: EvaluatedImpactFactor[],
    conflicts: ImpactConflict[],
    allFactors: EvaluatedImpactFactor[]
  ): ImpactSynthesisSummary {
    const directCount = allFactors.filter(f => f.directness === 'DIRECT_COMPANY').length;
    const macroSectorCount = allFactors.filter(f => f.directness === 'MACRO' || f.directness === 'SECTOR').length;

    const dominantForcesSummary = dominant.length > 0
      ? dominant.slice(0, 3).map(f => f.title).join('; ')
      : 'Belirgin birincil pozitif itici güç tespit edilmedi.';

    const counterForcesSummary = counter.length > 0
      ? counter.slice(0, 3).map(f => f.title).join('; ')
      : 'Belirgin birincil negatif baskı unsuru tespit edilmedi.';

    let primaryTension: string | null = null;
    if (conflicts.length > 0) {
      primaryTension = conflicts[0].dialecticSummary;
    } else if (dominant.length > 0 && counter.length > 0) {
      primaryTension = `Operasyonel faktörler (${dominant[0].title}) ile maliyet/dışsal etkenler (${counter[0].title}) arasındaki denge.`;
    }

    const completeness = pkg.dataQuality.status === 'VALID' ? 'HIGH' : (pkg.dataQuality.status === 'WARNING' ? 'MODERATE' : 'LOW');

    return {
      dominantForcesSummary,
      counterForcesSummary,
      primaryTension,
      directCompanyFactorsCount: directCount,
      macroSectorFactorsCount: macroSectorCount,
      conflictsCount: conflicts.length,
      dataCompletenessRating: completeness
    };
  }

  // ============================================================================
  // MULTI-CRITERIA FACTOR FACTORY & WEIGHTING
  // ============================================================================
  private static createEvaluatedFactor(params: {
    id: string;
    factorType: AnalysisFactor['factorType'];
    title: string;
    explanation: string;
    relevance: FactorRelevance;
    impactDirection: ImpactDirection;
    magnitude: ImpactMagnitude;
    freshness: FactorFreshness;
    persistence: FactorPersistence;
    sourceReliability: number;
    source: string;
    provenanceRef?: string;
    eventDate?: string;
    metricKey?: string;
    metricValue?: number | string | null;
    benchmarkValue?: number | string | null;
    financialImpact: FinancialImpactDetail;
    causeEffectChain: CauseEffectChain;
    conflictGroup?: string;
    confidence: number;
  }): EvaluatedImpactFactor {
    const weight = this.computeMultiCriteriaWeight({
      relevance: params.relevance,
      magnitude: params.magnitude,
      persistence: params.persistence,
      freshness: params.freshness,
      sourceReliability: params.sourceReliability
    });

    return {
      id: params.id,
      factorType: params.factorType,
      title: params.title,
      explanation: params.explanation,
      relevance: params.relevance,
      directness: params.relevance,
      impactDirection: params.impactDirection,
      magnitude: params.magnitude,
      freshness: params.freshness,
      persistence: params.persistence,
      sourceReliability: params.sourceReliability,
      source: params.source,
      provenanceRef: params.provenanceRef,
      eventDate: params.eventDate,
      metricKey: params.metricKey,
      metricValue: params.metricValue,
      benchmarkValue: params.benchmarkValue,
      financialImpact: params.financialImpact,
      causeEffectChain: params.causeEffectChain,
      confidence: params.confidence,
      relativeWeightScore: weight,
      isConflicted: false,
      conflictGroup: params.conflictGroup
    };
  }

  /**
   * Deterministic Multi-Criteria Weight Score (0 - 100)
   * Formula: (Directness * 0.30) + (Magnitude * 0.25) + (Persistence * 0.20) + (Freshness * 0.15) + (Reliability * 0.10)
   */
  public static computeMultiCriteriaWeight(params: {
    relevance: FactorRelevance;
    magnitude: ImpactMagnitude;
    persistence: FactorPersistence;
    freshness: FactorFreshness;
    sourceReliability: number;
  }): number {
    const directnessMultiplier: Record<FactorRelevance, number> = {
      DIRECT_COMPANY: 1.0,
      SECTOR: 0.70,
      MACRO: 0.50,
      MARKET: 0.30
    };

    const magnitudeMultiplier: Record<ImpactMagnitude, number> = {
      high: 1.0,
      medium: 0.65,
      low: 0.35,
      unknown: 0.15
    };

    const persistenceMultiplier: Record<FactorPersistence, number> = {
      STRUCTURAL: 1.0,
      PERSISTENT: 0.75,
      TRANSITORY: 0.40
    };

    const freshnessMultiplier: Record<FactorFreshness, number> = {
      REALTIME: 1.0,
      RECENT: 0.85,
      HISTORICAL: 0.50,
      STALE: 0.20
    };

    const d = directnessMultiplier[params.relevance] ?? 0.5;
    const m = magnitudeMultiplier[params.magnitude] ?? 0.5;
    const p = persistenceMultiplier[params.persistence] ?? 0.5;
    const f = freshnessMultiplier[params.freshness] ?? 0.5;
    const r = Math.min(Math.max(params.sourceReliability, 0), 100) / 100;

    const weightedScore = (d * 0.30) + (m * 0.25) + (p * 0.20) + (f * 0.15) + (r * 0.10);
    return Math.round(weightedScore * 100);
  }

  /**
   * Upgrades a legacy AnalysisFactor into an EvaluatedImpactFactor
   */
  private static upgradeBaseFactor(factor: AnalysisFactor, symbol: string): EvaluatedImpactFactor {
    let channel: ImpactTransmissionChannel = 'MARKET_SENTIMENT';
    if (factor.factorType === 'FINANCIAL') channel = 'OPERATING_PROFIT';
    else if (factor.factorType === 'VALUATION') channel = 'VALUATION_MULTIPLE';
    else if (factor.factorType === 'SECTOR') channel = 'SECTOR_COMPETITION';
    else if (factor.factorType === 'FX_COMMODITY') channel = 'FX_GAIN_LOSS';
    else if (factor.factorType === 'CORPORATE_ACTION') channel = 'CAPITAL_STRUCTURE';

    const weight = this.computeMultiCriteriaWeight({
      relevance: factor.relevance,
      magnitude: factor.magnitude,
      persistence: factor.persistence,
      freshness: factor.freshness,
      sourceReliability: factor.sourceReliability
    });

    return {
      ...factor,
      directness: factor.relevance,
      financialImpact: {
        primaryChannel: channel,
        estimatedDirection: factor.impactDirection,
        estimatedMagnitude: factor.magnitude,
        description: factor.explanation,
        isCashFlowImpacting: channel === 'OPERATING_PROFIT',
        isOperational: channel === 'OPERATING_PROFIT'
      },
      causeEffectChain: {
        dataTrigger: factor.metricKey ? `${factor.metricKey}: ${factor.metricValue}` : factor.title,
        event: factor.title,
        transmissionChannel: channel,
        affectedEntity: symbol,
        financialImplication: factor.explanation,
        netAssessment: `Faktörün ${channel} kanalı üzerinden şirkete yansımasıdır.`
      },
      confidence: factor.sourceReliability,
      relativeWeightScore: weight,
      isConflicted: false
    };
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
