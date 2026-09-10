/**
 * FinAi Analysis Relevance Filter
 * 
 * Implements strict hierarchical filtering to prevent noise from entering the analytical package:
 * 
 * Hierarchy:
 * 1. DIRECT_COMPANY: Symbol, alias or company legal name specifically referenced.
 * 2. SECTOR: Directly impacts the company's operating industry / sector dynamics.
 * 3. MACRO_SENSITIVE: High-significance FX, commodity or monetary policy relevant to company profile.
 * 4. GENERAL_MARKET: Broad market events only if high impact.
 * 
 * Unrelated or weak-correlation events are 100% discarded.
 */

import { EnrichedNewsItem } from '@/app/api/news/route';
import { CatalogCalendarEvent } from '@/lib/calendar-catalog';
import { SectorInfo, SectorCategory } from '@/types/financials';
import { NewsImpactRules } from '@/lib/news-impact-matrix';
import { FactorRelevance } from './types';

export interface FilteredNewsResult {
  news: EnrichedNewsItem[];
  relevanceMap: Record<string, FactorRelevance>;
}

export interface FilteredCalendarResult {
  events: CatalogCalendarEvent[];
  relevanceMap: Record<string, FactorRelevance>;
  impactNotes: Record<string, string>;
}

export class RelevanceFilter {
  /**
   * Filter and prioritize news articles for a specific stock
   */
  public static filterNewsForSymbol(
    allNews: EnrichedNewsItem[],
    symbol: string,
    companyName: string = '',
    sectorInfo?: SectorInfo
  ): FilteredNewsResult {
    const cleanSym = symbol.toUpperCase().replace(/\.IS$/, '').trim();
    const cleanComp = companyName.toLowerCase().replace(/sanayi|ve|ticaret|a\.ş\.|t\.a\.ş\.|holding/g, '').trim();

    const filtered: EnrichedNewsItem[] = [];
    const relevanceMap: Record<string, FactorRelevance> = {};

    for (const item of allNews) {
      const titleLower = (item.title || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const fullText = `${titleLower} ${descLower}`;
      const titleUpper = (item.title || '').toUpperCase();

      // 1. Direct Company Check
      const hasDirectTicker = 
        (item.tickers && item.tickers.some(t => t.toUpperCase() === cleanSym)) ||
        (item.affectedAssets && item.affectedAssets.some(a => a.toUpperCase() === cleanSym)) ||
        new RegExp(`\\b${cleanSym}\\b`).test(titleUpper) ||
        (cleanComp.length >= 4 && fullText.includes(cleanComp));

      if (hasDirectTicker) {
        filtered.push(item);
        relevanceMap[item.id] = 'DIRECT_COMPANY';
        continue;
      }

      // 2. Sector Relevance Check
      if (sectorInfo) {
        const isSectorRelevant = this.checkSectorNewsRelevance(fullText, item.category, sectorInfo.category);
        if (isSectorRelevant) {
          filtered.push(item);
          relevanceMap[item.id] = 'SECTOR';
          continue;
        }
      }

      // 3. Macro / FX / Commodity Sensitivity Check
      const macroMatch = this.checkMacroSensitivity(fullText, sectorInfo?.category);
      if (macroMatch) {
        filtered.push(item);
        relevanceMap[item.id] = 'MACRO';
        continue;
      }

      // 4. Critical BIST Market Event (Only if critical impact)
      if (item.category === 'bist' && item.impact === 'critical') {
        filtered.push(item);
        relevanceMap[item.id] = 'MARKET';
        continue;
      }

      // Discard all other unrelated news (noise elimination)
    }

    // Sort: DIRECT_COMPANY first, then SECTOR, then MACRO, then MARKET
    const priorityWeight: Record<FactorRelevance, number> = {
      DIRECT_COMPANY: 4,
      SECTOR: 3,
      MACRO: 2,
      MARKET: 1
    };

    filtered.sort((a, b) => {
      const pA = priorityWeight[relevanceMap[a.id] || 'MARKET'];
      const pB = priorityWeight[relevanceMap[b.id] || 'MARKET'];
      return pB - pA;
    });

    return {
      news: filtered.slice(0, 10), // Take top 10 relevant items
      relevanceMap
    };
  }

  /**
   * Filter economic calendar events according to the company's sector sensitivities
   */
  public static filterCalendarForSymbol(
    events: CatalogCalendarEvent[],
    symbol: string,
    sectorCategory?: SectorCategory
  ): FilteredCalendarResult {
    const cleanSym = symbol.toUpperCase().replace(/\.IS$/, '').trim();
    const filtered: CatalogCalendarEvent[] = [];
    const relevanceMap: Record<string, FactorRelevance> = {};
    const impactNotes: Record<string, string> = {};

    for (const event of events) {
      const eventText = `${event.event || ''} ${event.country || ''}`.toLowerCase();
      const eventId = event.id || `${event.country}_${event.dateFormatted}_${event.time}`;

      let matched = false;
      let relevance: FactorRelevance = 'MARKET';
      let note = '';

      // Test against NewsImpactRules
      for (const rule of NewsImpactRules) {
        if (rule.keywordRegex.test(eventText)) {
          // Direct symbol rule match (e.g. THYAO for OPEC/oil)
          if (rule.specificSymbols?.includes(cleanSym)) {
            matched = true;
            relevance = 'DIRECT_COMPANY';
            note = rule.description;
            break;
          }

          // Sector-specific match
          if (sectorCategory) {
            const isSectorAligned = this.isCalendarRuleAlignedWithSector(rule.categories, sectorCategory);
            if (isSectorAligned) {
              matched = true;
              relevance = 'SECTOR';
              note = rule.description;
              break;
            }
          }

          // High impact macro (TCMB / FED interest rates)
          if (/tcmb|fed|faiz oranı|fomc/i.test(eventText)) {
            matched = true;
            relevance = 'MACRO';
            note = rule.description;
            break;
          }
        }
      }

      // Check general high-impact Turkish macro (TÜFE / TCMB) which affects all BIST stocks
      if (!matched && event.country === 'TR' && (event.impact === 'high' || event.impact === 'critical')) {
        matched = true;
        relevance = 'MACRO';
        note = 'Yurt içi makroekonomik görünüm şirket maliyetleri ve değerlemeleri üzerinde belirleyicidir.';
      }

      if (matched) {
        filtered.push(event);
        relevanceMap[eventId] = relevance;
        if (note) impactNotes[eventId] = note;
      }
    }

    return {
      events: filtered.slice(0, 8), // Top 8 relevant macro events
      relevanceMap,
      impactNotes
    };
  }

  private static checkSectorNewsRelevance(
    text: string,
    newsCategory: string,
    sectorCategory: SectorCategory
  ): boolean {
    switch (sectorCategory) {
      case 'BANK':
      case 'INSURANCE':
        return /bddk|kredi|mevduat|tcmb|faiz|bankacılık|parasal sıkılaşma|enflasyon muhasebesi/i.test(text);

      case 'TRANSPORTATION':
        return /havacılık|yolcu sayısı|petrol|brent|jet yakıtı|turizm|hava yolu|liman|ihracat/i.test(text);

      case 'ENERGY':
        return /epdk|elektrik|doğalgaz|petrol|rafineri|yenilenebilir|enerji tarifesi|ges|res/i.test(text);

      case 'HOLDING':
        return /holding|iştirak|temettü geliri|şirket alımı|satışı|konsolide/i.test(text);

      case 'AUTOMOTIVE':
        return /otomotiv|araç satışı|ötv|ihracat|çip krizi|üretim rakamları|avrupa pazarı/i.test(text);

      case 'RETAIL':
      case 'FOOD':
        return /asgari ücret|gıda enflasyonu|perakende|tüketici güveni|fiyat denetimi/i.test(text);

      case 'TECHNOLOGY':
      case 'TELECOM':
        return /savunma sanayi|ihale|yazılım|5g|fiber|teknoloji teşvik|yapay zeka/i.test(text);

      case 'CONSTRUCTION':
        return /konut|çimento|kentsel dönüşüm|inşaat maliyet|gayrimenkul/i.test(text);

      default:
        return newsCategory === 'bist';
    }
  }

  private static checkMacroSensitivity(text: string, sectorCategory?: SectorCategory): boolean {
    // Universal macro events: Central Bank decisions & high inflation
    if (/tcmb faiz|fed faiz|politika faizi|türkiye enflasyon/i.test(text)) {
      return true;
    }

    // Heavy FX sensitivity (Aviation, Automotive, Energy)
    if (['TRANSPORTATION', 'AUTOMOTIVE', 'ENERGY'].includes(sectorCategory || '')) {
      return /dolar\/tl|euro\/tl|döviz kuru|kur şoku|ihracat rakamları/i.test(text);
    }

    return false;
  }

  private static isCalendarRuleAlignedWithSector(
    ruleCategories: string[],
    sectorCategory: SectorCategory
  ): boolean {
    if (ruleCategories.includes('BIST')) return true;
    if (['BANK', 'INSURANCE'].includes(sectorCategory) && ruleCategories.includes('FX')) {
      return true;
    }
    if (['TRANSPORTATION', 'ENERGY'].includes(sectorCategory) && (ruleCategories.includes('BIST') || ruleCategories.includes('GOLD'))) {
      return true;
    }
    return false;
  }
}
