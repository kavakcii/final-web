/**
 * FinAi Analysis Change Diff Engine - Phase 8
 * 
 * Deterministic comparison engine between consecutive or arbitrary analysis snapshots.
 * Answers the core financial questions:
 * 1. "Ne değişti?" (What data & factors shifted?)
 * 2. "Neden değişti?" (What was the transmission channel?)
 * 3. "Analize etkisi nedir?" (How did the overall impact tone evolve?)
 * 
 * Core Principles:
 * - Deterministic, verified data diffing (No hallucinations).
 * - Qualitative impact balance shifts (POZİTİF, NEGATİF, DENGELİ / NÖTR) - NO numerical scores.
 * - Factor state machine: ADDED, REMOVED, CHANGED, UNCHANGED.
 * - Causal narrative derived directly from verified data differences.
 */

import {
  AnalysisSnapshotRecord,
  AssembledDataPackage,
  AnalysisFactor,
  FactorDiffItem,
  FactorChangeType,
  FinancialMetricDiff,
  SnapshotComparisonResult,
  CausalChangeNarrative,
  ImpactBalanceRating
} from './types';

export class AnalysisChangeDiffEngine {
  public static readonly VERSION = '1.0.0-phase8';

  /**
   * Compares an assembled data package and factors against a previous snapshot
   */
  public static computeDiff(
    previousSnapshot: AnalysisSnapshotRecord | null,
    currentPackage: AssembledDataPackage,
    currentFactors: AnalysisFactor[],
    options: {
      currentVersion?: number;
      targetSnapshotId?: string;
      triggerContext?: {
        triggerType?: string;
        triggerReason?: string;
        triggerEventId?: string;
      };
      currentImpactBalance?: ImpactBalanceRating | string;
    } = {}
  ): SnapshotComparisonResult {
    const symbol = currentPackage.symbol.toUpperCase();
    const currentVersion = options.currentVersion ?? ((previousSnapshot?.version ?? 0) + 1);
    const targetSnapshotId = options.targetSnapshotId ?? crypto.randomUUID();
    const comparedAt = new Date().toISOString();

    // 1. Initial snapshot scenario (no previous snapshot)
    if (!previousSnapshot) {
      return this.generateInitialSnapshotDiff(
        symbol,
        currentPackage,
        currentFactors,
        targetSnapshotId,
        currentVersion,
        comparedAt,
        options.triggerContext,
        options.currentImpactBalance
      );
    }

    const prevPackage = previousSnapshot.data_package;
    const prevFactors = previousSnapshot.factors || [];

    // 2. Data Differences
    const dataChanges = this.compareDataPackages(prevPackage, currentPackage);

    // 3. Factor Differences
    const factorChanges = this.compareFactors(prevFactors, currentFactors);

    // 4. Impact Balance Shift
    const impactBalanceShift = this.evaluateImpactBalanceShift(
      previousSnapshot,
      currentPackage,
      currentFactors,
      options.currentImpactBalance
    );

    // 5. Causal Narrative: "Ne değişti, neden değişti?"
    const causalNarrative = this.generateCausalNarrative(
      dataChanges,
      factorChanges,
      impactBalanceShift,
      currentPackage.companyName || symbol,
      options.triggerContext?.triggerReason
    );

    const hasChanged = Boolean(
      dataChanges.priceDiff?.changePercent !== 0 ||
      dataChanges.isNewFinancialPeriod ||
      dataChanges.newNewsCount > 0 ||
      factorChanges.totalAdded > 0 ||
      factorChanges.totalRemoved > 0 ||
      factorChanges.totalChanged > 0 ||
      impactBalanceShift.hasShifted
    );

    return {
      symbol,
      hasChanged,
      baseSnapshotId: previousSnapshot.id,
      baseVersion: previousSnapshot.version ?? 1,
      baseTimestamp: previousSnapshot.created_at,
      baseFingerprint: previousSnapshot.fingerprint,
      targetSnapshotId,
      targetVersion: currentVersion,
      targetTimestamp: currentPackage.assembledAt,
      targetFingerprint: currentPackage.fingerprint,
      impactBalanceShift,
      dataChanges,
      factorChanges,
      causalNarrative,
      triggerContext: options.triggerContext,
      comparedAt
    };
  }

  /**
   * Directly compares two existing historical snapshots
   */
  public static compareSnapshots(
    baseSnapshot: AnalysisSnapshotRecord,
    targetSnapshot: AnalysisSnapshotRecord
  ): SnapshotComparisonResult {
    const currentFactors = targetSnapshot.factors || [];
    const currentPackage = targetSnapshot.data_package;

    const currentBalance = targetSnapshot.ai_analysis?.impactBalance;

    return this.computeDiff(
      baseSnapshot,
      currentPackage,
      currentFactors,
      {
        currentVersion: targetSnapshot.version,
        targetSnapshotId: targetSnapshot.id,
        triggerContext: {
          triggerType: targetSnapshot.trigger_type,
          triggerReason: targetSnapshot.update_reason,
          triggerEventId: targetSnapshot.trigger_event_id
        },
        currentImpactBalance: currentBalance
      }
    );
  }

  // ==========================================================================
  // INTERNAL COMPARISON LOGIC
  // ==========================================================================

  private static compareDataPackages(
    prev: AssembledDataPackage | undefined,
    curr: AssembledDataPackage
  ) {
    // A. Price Comparison
    const prevPrice = prev?.marketData?.currentPrice ?? null;
    const currPrice = curr?.marketData?.currentPrice ?? null;
    let priceDiffPercent: number | null = null;
    if (prevPrice != null && currPrice != null && prevPrice > 0) {
      priceDiffPercent = Number((((currPrice - prevPrice) / prevPrice) * 100).toFixed(2));
    }

    // B. Financial Period
    const prevQuarter = prev?.statements?.latestQuarter?.periodEnd ?? null;
    const currQuarter = curr?.statements?.latestQuarter?.periodEnd ?? null;
    const isNewFinancialPeriod = Boolean(currQuarter && prevQuarter && currQuarter !== prevQuarter);

    // C. Key Financial Metrics Delta
    const financialMetricsDiff: FinancialMetricDiff[] = [];
    const prevMetrics = prev?.statements?.latestQuarter;
    const currMetrics = curr?.statements?.latestQuarter;

    if (prevMetrics && currMetrics) {
      // 1. Revenue
      this.pushMetricDiff(
        financialMetricsDiff,
        'revenue',
        'Net Satışlar (Hasılat)',
        prevMetrics.revenue,
        currMetrics.revenue,
        5.0
      );

      // 2. Gross Profit
      this.pushMetricDiff(
        financialMetricsDiff,
        'grossProfit',
        'Brüt Kâr',
        prevMetrics.grossProfit,
        currMetrics.grossProfit,
        5.0
      );

      // 3. Operating Income / EBITDA
      this.pushMetricDiff(
        financialMetricsDiff,
        'operatingIncome',
        'Faaliyet Kârı (EBITDA)',
        prevMetrics.operatingIncome,
        currMetrics.operatingIncome,
        7.0
      );

      // 4. Net Income
      this.pushMetricDiff(
        financialMetricsDiff,
        'netIncome',
        'Net Dönem Kârı',
        prevMetrics.netIncome,
        currMetrics.netIncome,
        10.0
      );
    }

    // D. News Delta
    const prevNewsIds = new Set((prev?.relevantNews || []).map(n => n.id));
    const newNews = (curr?.relevantNews || []).filter(n => !prevNewsIds.has(n.id));
    const newNewsHeadlines = newNews.map(n => n.title).slice(0, 5);

    // E. Dividend Delta
    const prevDivCount = prev?.corporateActions?.historicalDividendsCount || 0;
    const currDivCount = curr?.corporateActions?.historicalDividendsCount || 0;
    const dividendChangesCount = Math.max(0, currDivCount - prevDivCount);

    // F. Macro / Calendar Events Delta
    const prevCalendarEvents = new Set((prev?.relevantCalendarEvents || []).map(e => e.event));
    const macroEventsDiff = (curr?.relevantCalendarEvents || [])
      .filter(e => !prevCalendarEvents.has(e.event))
      .map(e => `${e.event} (${e.dateFormatted || e.country || 'Makro'})`)
      .slice(0, 5);

    return {
      priceDiff: {
        previous: prevPrice,
        current: currPrice,
        changePercent: priceDiffPercent
      },
      isNewFinancialPeriod,
      previousPeriodEnd: prevQuarter,
      currentPeriodEnd: currQuarter,
      financialMetricsDiff,
      newNewsCount: newNews.length,
      newNewsHeadlines,
      dividendChangesCount,
      macroEventsDiff
    };
  }

  private static pushMetricDiff(
    list: FinancialMetricDiff[],
    metric: string,
    label: string,
    prevVal: any,
    currVal: any,
    materialityThresholdPercent: number
  ) {
    const prevNum = typeof prevVal === 'number' ? prevVal : null;
    const currNum = typeof currVal === 'number' ? currVal : null;

    if (prevNum != null && currNum != null && prevNum !== 0) {
      const absChange = currNum - prevNum;
      const pctChange = Number(((absChange / Math.abs(prevNum)) * 100).toFixed(2));
      const isMaterial = Math.abs(pctChange) >= materialityThresholdPercent;

      list.push({
        metric,
        label,
        previousValue: prevNum,
        currentValue: currNum,
        absoluteChange: absChange,
        percentageChange: pctChange,
        isMaterial
      });
    }
  }

  private static compareFactors(
    prevFactors: AnalysisFactor[],
    currFactors: AnalysisFactor[]
  ) {
    const prevMap = new Map<string, AnalysisFactor>();
    for (const pf of prevFactors) {
      prevMap.set(pf.id, pf);
    }

    const added: FactorDiffItem[] = [];
    const removed: FactorDiffItem[] = [];
    const changed: FactorDiffItem[] = [];
    const unchanged: FactorDiffItem[] = [];

    const currSeen = new Set<string>();

    for (const cf of currFactors) {
      currSeen.add(cf.id);
      const pf = prevMap.get(cf.id);

      if (!pf) {
        // ADDED
        added.push({
          factorId: cf.id,
          title: cf.title,
          changeType: 'ADDED',
          transmissionChannel: cf.factorType || 'Operasyonel Dinamikler',
          currentDirection: cf.impactDirection,
          currentMagnitude: cf.magnitude,
          directionChanged: false,
          magnitudeChanged: false,
          explanation: `Yeni faktör analize dahil edildi: "${cf.title}" (${cf.impactDirection}).`,
          source: cf.source
        });
      } else {
        const directionChanged = pf.impactDirection !== cf.impactDirection;
        const magnitudeChanged = pf.magnitude !== cf.magnitude;

        if (directionChanged || magnitudeChanged) {
          // CHANGED
          let changeReason = `Faktör güncellendi: "${cf.title}".`;
          if (directionChanged) {
            changeReason += ` Yön: ${pf.impactDirection} -> ${cf.impactDirection}.`;
          }
          if (magnitudeChanged) {
            changeReason += ` Şiddet: ${pf.magnitude} -> ${cf.magnitude}.`;
          }

          changed.push({
            factorId: cf.id,
            title: cf.title,
            changeType: 'CHANGED',
            transmissionChannel: cf.factorType || 'Operasyonel Dinamikler',
            previousDirection: pf.impactDirection,
            currentDirection: cf.impactDirection,
            previousMagnitude: pf.magnitude,
            currentMagnitude: cf.magnitude,
            directionChanged,
            magnitudeChanged,
            explanation: changeReason,
            source: cf.source
          });
        } else {
          // UNCHANGED
          unchanged.push({
            factorId: cf.id,
            title: cf.title,
            changeType: 'UNCHANGED',
            transmissionChannel: cf.factorType || 'Operasyonel Dinamikler',
            previousDirection: pf.impactDirection,
            currentDirection: cf.impactDirection,
            previousMagnitude: pf.magnitude,
            currentMagnitude: cf.magnitude,
            directionChanged: false,
            magnitudeChanged: false,
            explanation: `Faktör durumunu koruyor (${cf.impactDirection}).`,
            source: cf.source
          });
        }
      }
    }

    // Identify REMOVED factors
    for (const pf of prevFactors) {
      if (!currSeen.has(pf.id)) {
        removed.push({
          factorId: pf.id,
          title: pf.title,
          changeType: 'REMOVED',
          transmissionChannel: pf.factorType || 'Operasyonel Dinamikler',
          previousDirection: pf.impactDirection,
          previousMagnitude: pf.magnitude,
          directionChanged: false,
          magnitudeChanged: false,
          explanation: `Faktör artık güncel analiz paketinde yer almıyor: "${pf.title}".`,
          source: pf.source
        });
      }
    }

    return {
      added,
      removed,
      changed,
      unchanged,
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalChanged: changed.length,
      totalUnchanged: unchanged.length
    };
  }

  private static evaluateImpactBalanceShift(
    previousSnapshot: AnalysisSnapshotRecord,
    currentPackage: AssembledDataPackage,
    currentFactors: AnalysisFactor[],
    overrideCurrentBalance?: ImpactBalanceRating | string
  ) {
    const prevBalance = previousSnapshot.ai_analysis?.impactBalance ||
      this.inferBalanceFromFactors(previousSnapshot.factors || []);

    const currBalance = overrideCurrentBalance ||
      (currentPackage.impactAnalysis?.synthesisSummary as any)?.impactBalance ||
      this.inferBalanceFromFactors(currentFactors);

    const hasShifted = Boolean(prevBalance && currBalance && prevBalance !== currBalance);

    let explanation = `Etki dengesi ${currBalance} olarak devam ediyor.`;
    if (hasShifted) {
      explanation = `Etki dengesi "${prevBalance}" yönünden "${currBalance}" yönüne kaydı.`;
    }

    return {
      previousBalance: prevBalance || null,
      currentBalance: currBalance || null,
      hasShifted,
      explanation
    };
  }

  private static inferBalanceFromFactors(factors: AnalysisFactor[]): ImpactBalanceRating {
    let pos = 0;
    let neg = 0;
    for (const f of factors) {
      if (f.impactDirection === 'positive') pos++;
      else if (f.impactDirection === 'negative') neg++;
    }
    if (pos > neg + 1) return 'Pozitif';
    if (neg > pos + 1) return 'Negatif';
    return 'Nötr';
  }

  /**
   * Generates deterministic, grounded causal narrative answering "Ne değişti? Neden değişti?"
   */
  private static generateCausalNarrative(
    dataChanges: ReturnType<typeof AnalysisChangeDiffEngine.compareDataPackages>,
    factorChanges: ReturnType<typeof AnalysisChangeDiffEngine.compareFactors>,
    impactBalanceShift: ReturnType<typeof AnalysisChangeDiffEngine.evaluateImpactBalanceShift>,
    companyName: string,
    triggerReason?: string
  ): CausalChangeNarrative {
    const whatList: string[] = [];
    const whyList: string[] = [];
    const driversList: string[] = [];

    // 1. Financial Statements
    if (dataChanges.isNewFinancialPeriod) {
      whatList.push(`Yeni finansal tablo dönemi (${dataChanges.previousPeriodEnd} -> ${dataChanges.currentPeriodEnd}) açıklandı`);
      const materialMetrics = dataChanges.financialMetricsDiff.filter(m => m.isMaterial);
      if (materialMetrics.length > 0) {
        const metricDetails = materialMetrics
          .map(m => `${m.label} %${m.percentageChange! > 0 ? '+' : ''}${m.percentageChange}`)
          .join(', ');
        whyList.push(`Açıklanan yeni dönemde operasyonel metrikler değişti (${metricDetails})`);
        driversList.push(`Yeni bilanço dinamikleri (${metricDetails})`);
      } else {
        whyList.push('Açıklanan yeni finansal sonuçlar şirketin temel kârlılık ve bilanço varsayımlarını tazeledi');
      }
    }

    // 2. News Events
    if (dataChanges.newNewsCount > 0) {
      whatList.push(`${dataChanges.newNewsCount} yeni ilgili piyasa haberi dahil edildi`);
      whyList.push(`Şirket faaliyet yapısını veya sektör dinamiklerini etkileyen yeni gelişmeler akışı gerçekleşti (${dataChanges.newNewsHeadlines[0] || 'KAP Gelişmesi'})`);
      driversList.push(`Haber akışı: ${dataChanges.newNewsHeadlines[0] || 'Gelişmeler'}`);
    }

    // 3. Price Movement
    const priceChange = dataChanges.priceDiff.changePercent;
    if (priceChange != null && Math.abs(priceChange) >= 2.0) {
      whatList.push(`Piyasa fiyatı %${priceChange > 0 ? '+' : ''}${priceChange} oranında dalgalandı`);
    }

    // 4. Dividends
    if (dataChanges.dividendChangesCount > 0) {
      whatList.push(`Yeni temettü kararı/dağıtımı işlendi`);
      whyList.push('Nakit kâr payı dağıtım kararı şirketin serbest nakit akışı ve ortak getiri görünümünü güncelledi');
      driversList.push('Temettü dağıtım kararı');
    }

    // 5. Factors
    if (factorChanges.totalAdded > 0) {
      const addedTitles = factorChanges.added.map(f => f.title).slice(0, 2).join(', ');
      whatList.push(`${factorChanges.totalAdded} yeni faktör analiz sepetine girdi (${addedTitles})`);
    }
    if (factorChanges.totalChanged > 0) {
      const changedTitles = factorChanges.changed.map(f => f.title).slice(0, 2).join(', ');
      whatList.push(`${factorChanges.totalChanged} analitik faktörün etki yönü/şiddeti değişti (${changedTitles})`);
      whyList.push(`Piyasadaki yeni veri akışları ilgili aktarım kanallarındaki ağırlıkları değiştirdi`);
    }

    // Default fallbacks if no major item triggered
    if (whatList.length === 0) {
      whatList.push('Rutin piyasa ve fiyat verileri güncellendi; temel analitik faktörlerde majör bir kırılım gerçekleşmedi');
    }
    if (whyList.length === 0) {
      whyList.push('Mevcut veri seti şirketin önceki analiz varsayımlarını genel hatlarıyla doğrulamaya devam ediyor');
    }

    // Implication for Analysis
    let implicationForAnalysis = 'FinAi analizi önceki görünümüyle genel olarak uyumlu kalmayı sürdürüyor.';
    if (impactBalanceShift.hasShifted) {
      implicationForAnalysis = `Analizdeki temel etki dengesi ${impactBalanceShift.previousBalance} yönünden ${impactBalanceShift.currentBalance} seviyesine kaydı. Şirket üzerindeki dengelenen güçlerin kompozisyonu değişti.`;
    } else if (factorChanges.totalChanged > 0 || factorChanges.totalAdded > 0) {
      implicationForAnalysis = 'Analiz yönü ana hatlarıyla korunmakla birlikte, bazı aktarım kanallarında risk ve fırsat dengeleri yeniden kalibre edildi.';
    }

    return {
      whatChanged: whatList.join('; ') + '.',
      whyItChanged: whyList.join('; ') + '.',
      implicationForAnalysis,
      keyDriversSummary: driversList.length > 0 ? driversList : ['Rutin veri tazeleme']
    };
  }

  private static generateInitialSnapshotDiff(
    symbol: string,
    currentPackage: AssembledDataPackage,
    currentFactors: AnalysisFactor[],
    targetSnapshotId: string,
    currentVersion: number,
    comparedAt: string,
    triggerContext?: any,
    currentImpactBalance?: ImpactBalanceRating | string
  ): SnapshotComparisonResult {
    const currentPrice = currentPackage.marketData?.currentPrice ?? null;
    const currentPeriodEnd = currentPackage.statements?.latestQuarter?.periodEnd ?? null;
    const balance = currentImpactBalance ||
      (currentPackage.impactAnalysis?.synthesisSummary as any)?.impactBalance ||
      this.inferBalanceFromFactors(currentFactors);

    const addedFactors: FactorDiffItem[] = currentFactors.map(f => ({
      factorId: f.id,
      title: f.title,
      changeType: 'ADDED',
      transmissionChannel: f.factorType || 'Operasyonel Dinamikler',
      currentDirection: f.impactDirection,
      currentMagnitude: f.magnitude,
      directionChanged: false,
      magnitudeChanged: false,
      explanation: `İlk analiz kaydı: "${f.title}" dahil edildi (${f.impactDirection}).`,
      source: f.source
    }));

    return {
      symbol,
      hasChanged: true,
      baseSnapshotId: null,
      baseVersion: null,
      baseTimestamp: null,
      baseFingerprint: null,
      targetSnapshotId,
      targetVersion: currentVersion,
      targetTimestamp: currentPackage.assembledAt,
      targetFingerprint: currentPackage.fingerprint,
      impactBalanceShift: {
        previousBalance: null,
        currentBalance: balance,
        hasShifted: false,
        explanation: `İlk analiz snapshot'ı oluşturuldu (Etki Dengesi: ${balance}).`
      },
      dataChanges: {
        priceDiff: {
          previous: null,
          current: currentPrice,
          changePercent: null
        },
        isNewFinancialPeriod: false,
        previousPeriodEnd: null,
        currentPeriodEnd,
        financialMetricsDiff: [],
        newNewsCount: (currentPackage.relevantNews || []).length,
        newNewsHeadlines: (currentPackage.relevantNews || []).map(n => n.title).slice(0, 3),
        dividendChangesCount: currentPackage.corporateActions?.historicalDividendsCount || 0,
        macroEventsDiff: []
      },
      factorChanges: {
        added: addedFactors,
        removed: [],
        changed: [],
        unchanged: [],
        totalAdded: addedFactors.length,
        totalRemoved: 0,
        totalChanged: 0,
        totalUnchanged: 0
      },
      causalNarrative: {
        whatChanged: `${symbol} için başlangıç referans snapshot'ı (v1) oluşturuldu.`,
        whyItChanged: 'Sistem ilk kez doğrulanmış şirket, finansal ve piyasa verilerini bir araya getirerek analitik zemin oluşturdu.',
        implicationForAnalysis: `İlk referans analiz kaydı alındı. Gelecekteki tüm veri güncellemeleri bu temel durum üzerinden karşılaştırılacaktır.`,
        keyDriversSummary: ['İlk referans snapshot oluşturuldu']
      },
      triggerContext,
      comparedAt
    };
  }
}
