import { distance } from "fastest-levenshtein";
import { pool } from "../db/connection.js";
import { normalizeRaw } from "../ingest/normalizeMerchants.js";

let fundNameCache: string[] | null = null;

async function getFundNames(): Promise<string[]> {
  if (fundNameCache) return fundNameCache;
  const result = await pool.query(
    `SELECT DISTINCT fund_name FROM funds`
  );
  fundNameCache = result.rows.map((r: any) => r.fund_name);
  return fundNameCache;
}

export function invalidateFundCache() {
  fundNameCache = null;
}

export async function resolveFundName(userInput: string): Promise<string | null> {
  const norm = normalizeRaw(userInput);
  const fundNames = await getFundNames();

  if (fundNames.length === 0) return null;

  // 1. Exact match after normalization
  const exactMatch = fundNames.find((f) => normalizeRaw(f) === norm);
  if (exactMatch) return exactMatch;

  // 2. Substring match — user typed a partial name
  const substrMatch = fundNames.find((f) => {
    const normF = normalizeRaw(f);
    return normF.includes(norm) || norm.includes(normF);
  });
  if (substrMatch) return substrMatch;

  // 3. Word overlap score
  const userWords = new Set(norm.split(" ").filter((w) => w.length > 2));

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const fundName of fundNames) {
    const fundWords = normalizeRaw(fundName).split(" ").filter((w) => w.length > 2);
    const matches = fundWords.filter((w) => userWords.has(w)).length;
    const score = matches / Math.max(userWords.size, fundWords.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = fundName;
    }
  }

  // Require at least 50% word overlap to avoid false matches
  if (bestScore >= 0.5) return bestMatch;

  // 4. Fuzzy fallback for typos
  let fuzzyBest: string | null = null;
  let fuzzyDist = Infinity;

  for (const fundName of fundNames) {
    const d = distance(norm, normalizeRaw(fundName));
    if (d < fuzzyDist && d <= 4) {
      fuzzyDist = d;
      fuzzyBest = fundName;
    }
  }

  return fuzzyBest; 
}