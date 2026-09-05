/**
 * FinAI Symbol Normalization & Validation Helper
 * 
 * Canonical representation: "THYAO"
 * Yahoo representation: "THYAO.IS"
 * Handles BIST prefix: "BIST:THYAO" -> "THYAO"
 * Path traversal safe (only alphanumerics allowed).
 */

export function normalizeSymbol(rawInput: string | null | undefined): string | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  let cleaned = rawInput.trim().toUpperCase();

  // Strip BIST: prefix if present
  if (cleaned.startsWith('BIST:')) {
    cleaned = cleaned.substring(5).trim();
  }

  // Strip .IS suffix if present
  if (cleaned.endsWith('.IS')) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }

  // Security check: Only alphanumeric characters allowed (no slashes, dots, path traversal)
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

export function toYahooSymbol(canonicalSymbol: string): string {
  return `${canonicalSymbol}.IS`;
}
