import { FinancialPeriod, FinancialQuality, QualityStatus } from "@/types/financials";

export interface ValidationResult {
  quality: FinancialQuality;
  validatedPeriods: FinancialPeriod[];
}

export function validateFinancialData(periods: FinancialPeriod[]): ValidationResult {
  const warnings: string[] = [];

  if (!periods || periods.length === 0) {
    return {
      quality: {
        status: "unavailable",
        completeness: 0,
        warnings: ["Hiçbir döneme ait finansal veri bulunamadı."]
      },
      validatedPeriods: []
    };
  }

  let totalFieldsCount = 0;
  let nonNullFieldsCount = 0;

  const validatedPeriods = periods.map(p => {
    const inc = { ...p.incomeStatement };
    const bal = { ...p.balanceSheet };
    const cf = { ...p.cashFlow };
    const ps = { ...p.perShare };

    // 1. DÖNEM MARJ HESAPLAMALARI (Hasılat varsa gerçek oranları türet)
    if (inc.revenue && inc.revenue > 0) {
      if (inc.grossProfit !== null && inc.grossMargin === null) {
        inc.grossMargin = parseFloat(((inc.grossProfit / inc.revenue) * 100).toFixed(2));
      }
      if (inc.operatingIncome !== null && inc.operatingMargin === null) {
        inc.operatingMargin = parseFloat(((inc.operatingIncome / inc.revenue) * 100).toFixed(2));
      }
      if (inc.ebitda !== null && inc.ebitdaMargin === null) {
        inc.ebitdaMargin = parseFloat(((inc.ebitda / inc.revenue) * 100).toFixed(2));
      }
      if (inc.netIncome !== null && inc.netMargin === null) {
        inc.netMargin = parseFloat(((inc.netIncome / inc.revenue) * 100).toFixed(2));
      }
    }

    // 2. BİLANÇO EŞİTLİK KONTROLÜ (Aktif Toplamı ≈ Pasif Toplamı + Özsermaye)
    if (bal.totalAssets !== null && bal.totalLiabilities !== null && bal.equity !== null) {
      const sumLiabEquity = bal.totalLiabilities + bal.equity;
      const diff = Math.abs(bal.totalAssets - sumLiabEquity);
      const tolerance = Math.max(1000, bal.totalAssets * 0.03); // %3 tolerans

      if (diff > tolerance) {
        warnings.push(`${p.period} dönemi bilançosunda tutarsızlık: Toplam Varlıklar (${bal.totalAssets.toLocaleString("tr-TR")}) ile Yükümlülükler + Özsermaye (${sumLiabEquity.toLocaleString("tr-TR")}) denk değil.`);
      }
    }

    // 3. NEGATİF VARLIK VEYA KASA KONTROLÜ
    if (bal.cashAndEquivalents !== null && bal.cashAndEquivalents < 0) {
      warnings.push(`${p.period} dönemi Nakit ve Nakit Benzerleri negatif olamaz.`);
    }

    if (bal.inventory !== null && bal.inventory < 0) {
      warnings.push(`${p.period} dönemi stoklar negatif olamaz.`);
    }

    // 4. EPS DOĞRULAMA (Net Kâr / Ödenmiş Sermaye uydurma formülü engelleme)
    if (ps.eps === null && inc.netIncome !== null && ps.totalShares !== null && ps.totalShares > 0) {
      // EPS yalnızca weighted average shares biliniyorsa hesaplanabilir
      warnings.push(`${p.period} dönemi için ağırlıklı ortalama hisse sayısı açıklanmadığından EPS türetilmedi.`);
    }

    // 5. DOLUDURUM (COMPLETENESS) SAYIMI
    const allFields = [
      inc.revenue, inc.costOfRevenue, inc.grossProfit, inc.operatingIncome, inc.ebitda,
      inc.pretaxIncome, inc.taxExpense, inc.netIncome, inc.netIncomeParent,
      bal.currentAssets, bal.nonCurrentAssets, bal.totalAssets, bal.currentLiabilities,
      bal.nonCurrentLiabilities, bal.totalLiabilities, bal.financialDebt, bal.cashAndEquivalents,
      bal.netDebt, bal.equity, bal.tradeReceivables, bal.inventory, bal.propertyPlantEquipment,
      cf.operatingCashFlow, cf.investingCashFlow, cf.financingCashFlow, cf.capex, cf.freeCashFlow, cf.netChangeInCash,
      ps.eps, ps.bookValuePerShare, ps.paidInCapital, ps.totalShares, ps.circulatingShares, ps.freeFloatRatio
    ];

    totalFieldsCount += allFields.length;
    nonNullFieldsCount += allFields.filter(f => f !== null && f !== undefined && !isNaN(Number(f))).length;

    return {
      ...p,
      incomeStatement: inc,
      balanceSheet: bal,
      cashFlow: cf,
      perShare: ps
    };
  });

  const completeness = totalFieldsCount > 0 ? Math.round((nonNullFieldsCount / totalFieldsCount) * 100) : 0;

  let status: QualityStatus = "verified";

  if (completeness < 15) {
    status = "unavailable";
  } else if (completeness < 50) {
    status = "partial";
  } else if (warnings.length > 0) {
    status = "warning";
  }

  return {
    quality: {
      status,
      completeness,
      warnings: Array.from(new Set(warnings))
    },
    validatedPeriods
  };
}
