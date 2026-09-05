/**
 * FinAI Archive Reader Service
 * 
 * Safely accesses .finai_archive files by canonical symbol.
 * Completely immune to path traversal.
 */

import fs from 'fs';
import path from 'path';

const ARCHIVE_ROOT = path.join(process.cwd(), '.finai_archive');

export class FinAiArchiveReader {
  public static getRoot(): string {
    return ARCHIVE_ROOT;
  }

  public static readJsonSafe<T>(subDir: string, filename: string): T | null {
    try {
      // Prevent path traversal
      const safeFilename = path.basename(filename);
      const safeSubDir = path.basename(subDir);
      const fullPath = path.join(ARCHIVE_ROOT, safeSubDir, safeFilename);

      if (!fs.existsSync(fullPath)) return null;
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (e) {
      return null;
    }
  }

  public static getProfile(symbol: string): any | null {
    return this.readJsonSafe('profiles', `${symbol}_profile.json`);
  }

  public static getPrices(symbol: string): any[] | null {
    return this.readJsonSafe('prices', `${symbol}_daily.json`);
  }

  public static getQuarterlyStatements(symbol: string): any[] | null {
    return this.readJsonSafe('statements', `${symbol}_quarterly.json`);
  }

  public static getAnnualStatements(symbol: string): any[] | null {
    return this.readJsonSafe('statements', `${symbol}_annual.json`);
  }

  public static getDividends(symbol: string): any[] | null {
    return this.readJsonSafe('dividends', `${symbol}_dividends.json`);
  }

  public static getSplits(symbol: string): any[] | null {
    return this.readJsonSafe('splits', `${symbol}_splits.json`);
  }

  public static getOwnership(symbol: string): any | null {
    return this.readJsonSafe('ownership', `${symbol}_ownership.json`);
  }

  public static getEstimates(symbol: string): any | null {
    return this.readJsonSafe('estimates', `${symbol}_estimates.json`);
  }

  public static getQuoteSummary(symbol: string): any | null {
    try {
      const rawDir = path.join(ARCHIVE_ROOT, 'raw_payloads');
      if (!fs.existsSync(rawDir)) return null;
      const files = fs.readdirSync(rawDir).filter(f => f.startsWith(`${symbol}_quoteSummary`));
      if (files.length === 0) return null;
      const content = fs.readFileSync(path.join(rawDir, files[0]), 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  public static getQualityReport(): any | null {
    return this.readJsonSafe('reports', 'faz5_validation_audit_results.json');
  }
}
