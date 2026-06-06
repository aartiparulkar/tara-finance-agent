import { distance } from "fastest-levenshtein";
import { normalizeRaw } from "../ingest/normalizeMerchants.js";
import { pool } from "../db/connection.js";

// Loads all distinct merchant_canon values from the DB at query time.
let canonCache: string[] | null = null;
async function getCanonValues(): Promise<string[]> {
    if (canonCache) return canonCache;
    const result = await pool.query(
        `SELECT DISTINCT merchant_canon FROM transactions WHERE merchant_canon IS NOT NULL`
    );
    canonCache = result.rows.map((r: any) => r.merchant_canon);
    return canonCache;
}

export function invalidateCanonCache() {
    canonCache = null;
}

export async function resolveQueryMerchant(userInput: string): Promise<string> {
  const norm = normalizeRaw(userInput);
  const firstWord = norm.split(" ")[0];
  const canons = await getCanonValues();

  // 1. Exact match
  if (canons.includes(norm)) return norm;

  // 2. Prefix match — "swiggy" matches "swiggy instamart" canon
  const prefixMatch = canons.find((c) => c.startsWith(norm) || norm.startsWith(c));
  if (prefixMatch) return prefixMatch;

  // 3. First-word subsequence match — "amz" first word matches "amazon" canon
  // Only fires when the first word is short (likely an abbreviation)
  if (firstWord.length <= 4) {
    const subseqMatch = canons.find((c) => {
      const canonFirst = c.split(" ")[0];
      return (
        canonFirst.startsWith(firstWord[0]) &&       // same first char
        isSubsequence(firstWord, canonFirst) &&       // chars appear in order
        canonFirst.length / firstWord.length <= 3    // not expanding too wildly
      );
    });
    if (subseqMatch) return subseqMatch;
  }

  // 4. Fuzzy match for typos — tight threshold of <= 2
  let best = norm;
  let bestDist = Infinity;
  for (const canon of canons) {
    const d = distance(norm, canon);
    if (d < bestDist && d <= 2) {
      bestDist = d;
      best = canon;
    }
  }

  return best;
}

function isSubsequence(abbrev: string, full: string): boolean {
  let i = 0;
  for (const ch of full) {
    if (ch === abbrev[i]) i++;
    if (i === abbrev.length) return true;
  }
  return false;
}