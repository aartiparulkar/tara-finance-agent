import { distance } from "fastest-levenshtein";

export function normalizeRaw(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")   // kill *, @, /, #, punctuation
    .replace(/\s+/g, " ")           // collapse runs of whitespace
    .trim();
}

// Call this when the merchant field looks like a reference number
export function extractFromMemo(memo: string): string | null {
  if (!memo) return null;

  // UPI/571548185986/SWIGGY/swiggy@ybl  →  "swiggy"
  const upi = memo.match(/UPI\/\d+\/([^\/\s]+)/i);
  if (upi) return normalizeRaw(upi[1]);

  // NEFT-HDFC-AMAZON SELLER SERVICES  →  "amazon seller services"
  const neft = memo.match(/(?:NEFT|IMPS|RTGS)[\/\-][\w]+[\/\-](.+)/i);
  if (neft) return normalizeRaw(neft[1]);

  return null;
}

export function looksLikeRefNumber(merchant: string): boolean {
  const clean = merchant.trim();
  // All digits, or starts with a known prefix that's never a brand name
  return /^\d+$/.test(clean) || /^(UPI|NEFT|IMPS|RTGS)[\/\-]/i.test(clean);
}

// ─── Build canonical map via LCP clustering ──────────────────────
function longestCommonWordPrefix(strings: string[]): string {
  if (strings.length === 0) return "";
  if (strings.length === 1) return strings[0];

  const wordArrays = strings.map((s) => s.split(" "));
  const minLen = Math.min(...wordArrays.map((w) => w.length));

  const prefix: string[] = [];
  for (let i = 0; i < minLen; i++) {
    const word = wordArrays[0][i];
    if (wordArrays.every((w) => w[i] === word)) {
      prefix.push(word);
    } else {
      break;
    }
  }

  return prefix.join(" ");
}

// Expand known abbreviation patterns before normalization.
// "amz" → "amazon", "swgy" → "swiggy" etc.
function expandAbbreviation(norm: string, allNorms: Set<string>): string {
  // If this string is already 5+ chars, it's probably not an abbreviation
  if (norm.length >= 5) return norm;

  for (const candidate of allNorms) {
    if (
      candidate.length > norm.length &&
      candidate.startsWith(norm.slice(0, 2)) &&
      isSubsequence(norm, candidate)
    ) {
      return candidate; 
    }
  }

  return norm; 
}

function isSubsequence(abbrev: string, full: string): boolean {
  let i = 0;
  for (const ch of full) {
    if (ch === abbrev[i]) i++;
    if (i === abbrev.length) return true;
  }
  return false;
}

export function buildCanonicalMap(
  rawMerchants: string[],
  memoByMerchant: Record<string, string> = {}
): Map<string, string> {
  const entries: { raw: string; norm: string }[] = rawMerchants.map((raw) => {
    let norm: string | null = null;
    if (looksLikeRefNumber(raw)) {
      norm = extractFromMemo(memoByMerchant[raw] ?? "");
    }
    return { raw, norm: norm ?? normalizeRaw(raw) };
  });

  // Pass 2b: expand abbreviations against the full norm set
  const allNorms = new Set(entries.map((e) => e.norm));
  for (const entry of entries) {
    entry.norm = expandAbbreviation(entry.norm, allNorms);
  }

  // Pass 3: bucket by trigram-aware key (fixes zomato/zepto collision)
  const buckets = new Map<string, { raw: string; norm: string }[]>();
  for (const entry of entries) {
    const key = bucketKey(entry.norm);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(entry);
  }

  // Pass 4: LCP within bucket with strengthened guard
  const canonicalMap = new Map<string, string>();
  for (const [, group] of buckets) {
    const norms = group.map((e) => e.norm);
    const lcp = longestCommonWordPrefix(norms);
    const canon = shouldMergeOnLcp(norms, lcp) ? lcp : null;

    for (const entry of group) {
      canonicalMap.set(entry.raw, canon ?? entry.norm);
    }
  }

  return canonicalMap;
}

function shouldMergeOnLcp(strings: string[], lcp: string): boolean {
  if (!lcp) return false;
  if (lcp.length < 4) return false;

  const lcpWordCount = lcp.split(" ").length;
  const avgWordCount =
    strings.reduce((sum, s) => sum + s.split(" ").length, 0) / strings.length;

  return lcpWordCount >= 2 || lcpWordCount / avgWordCount >= 0.4;
}

function bucketKey(norm: string): string {
  const firstWord = norm.split(" ")[0];
  return firstWord.length <= 6 ? firstWord.slice(0, 3) : firstWord;
}

export function applyFuzzyFallback(canonicalMap: Map<string, string>): Map<string, string> {
  // Collect the distinct canon values (the "representatives")
  const representatives: string[] = [];
  const result = new Map<string, string>();

  for (const [raw, canon] of canonicalMap) {
    const existing = representatives.find((r) => {
      const d = distance(r, canon);

      if (d > 2) return false;

      const shorter = Math.min(r.length, canon.length);
      const longer = Math.max(r.length, canon.length);
      const ratio = shorter / longer;
      if (ratio < 0.7) return false;
      return true;
    });
    
    if (existing) {
      result.set(raw, existing); // merge into the existing rep
    } else {
      representatives.push(canon);
      result.set(raw, canon);
    }
  }

  return result;
}

// ─── Public entry point ───────────────────────────────────────────────────────
// Called once at ingest time with ALL merchant strings from the snapshot.
// Returns a map: rawMerchantString → canonicalName
//
// Usage:
//   const canon = buildMerchantCanonicals(transactions);
//   // then for each transaction row:
//   row.merchant_canon = canon.get(row.merchant) ?? normalizeRaw(row.merchant);

export function buildMerchantCanonicals(
  transactions: { merchant: string; memo?: string }[]
): Map<string, string> {
  const rawMerchants = [...new Set(transactions.map((t) => t.merchant))];

  // Build memo lookup: merchant_raw → first memo seen for that merchant
  // (used only when merchant looks like a ref number)
  const memoByMerchant: Record<string, string> = {};
  for (const t of transactions) {
    if (t.memo && !memoByMerchant[t.merchant]) {
      memoByMerchant[t.merchant] = t.memo;
    }
  }

  const lcpMap = buildCanonicalMap(rawMerchants, memoByMerchant);
  return applyFuzzyFallback(lcpMap);
}