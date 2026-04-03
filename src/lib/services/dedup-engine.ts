/**
 * Oniefy - Transaction Deduplication Engine (E20)
 *
 * Detects duplicate transactions across import sources using 3 filters:
 * 1. Exact match: same date + amount + external_id
 * 2. Fuzzy match: same date + amount + similar description (Levenshtein)
 * 3. Authorization code: same auth code across sources
 *
 * Design principle: each import push is real until proven otherwise.
 * Ambiguity is resolved immediately (not deferred).
 *
 * Ref: docs/DEDUP-ENGINE-SPEC.md
 */

export interface TransactionForDedup {
  id: string;
  date: string; // ISO date
  amount: number;
  description: string;
  external_id?: string | null;
  /** Source of the transaction (e.g., "import_csv", "manual", "email") */
  source: string;
  account_id: string;
}

export interface DuplicateMatch {
  existingId: string;
  newId: string;
  matchType: "exact" | "fuzzy" | "auth_code";
  confidence: number; // 0-1
  reason: string;
}

export interface DeduplicationResult {
  /** Transactions confirmed as unique */
  unique: TransactionForDedup[];
  /** Potential duplicates with match details */
  duplicates: DuplicateMatch[];
  /** Stats */
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    exactMatches: number;
    fuzzyMatches: number;
  };
}

/**
 * Generate a fingerprint for a transaction (date + normalized amount).
 */
export function fingerprint(tx: TransactionForDedup): string {
  return `${tx.date}|${tx.amount.toFixed(2)}`;
}

/**
 * Normalize description for comparison.
 * Removes extra spaces, punctuation, lowercases.
 */
export function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúüç\d\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Similarity score between two descriptions (0-1, 1 = identical).
 */
export function descriptionSimilarity(a: string, b: string): number {
  const na = normalizeDescription(a);
  const nb = normalizeDescription(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Deduplicate a batch of new transactions against existing ones.
 *
 * @param existing - Transactions already in the database
 * @param incoming - New transactions being imported
 * @param fuzzyThreshold - Minimum similarity for fuzzy match (default: 0.8)
 */
export function deduplicateTransactions(
  existing: TransactionForDedup[],
  incoming: TransactionForDedup[],
  fuzzyThreshold = 0.8
): DeduplicationResult {
  // Index existing by fingerprint for O(1) lookup
  const existingByFP = new Map<string, TransactionForDedup[]>();
  for (const tx of existing) {
    const fp = fingerprint(tx);
    if (!existingByFP.has(fp)) existingByFP.set(fp, []);
    existingByFP.get(fp)!.push(tx);
  }

  // Index by external_id
  const existingByExtId = new Map<string, TransactionForDedup>();
  for (const tx of existing) {
    if (tx.external_id) existingByExtId.set(tx.external_id, tx);
  }

  const unique: TransactionForDedup[] = [];
  const duplicates: DuplicateMatch[] = [];
  let exactMatches = 0;
  let fuzzyMatches = 0;

  for (const inTx of incoming) {
    let matched = false;

    // Filter 1: Exact external_id match
    if (inTx.external_id && existingByExtId.has(inTx.external_id)) {
      const existTx = existingByExtId.get(inTx.external_id)!;
      duplicates.push({
        existingId: existTx.id,
        newId: inTx.id,
        matchType: "exact",
        confidence: 1.0,
        reason: `Mesmo external_id: ${inTx.external_id}`,
      });
      exactMatches++;
      matched = true;
      continue;
    }

    // Filter 2: Fingerprint match (same date + amount)
    const fp = fingerprint(inTx);
    const candidates = existingByFP.get(fp);

    if (candidates) {
      for (const candidate of candidates) {
        // Skip if same account (likely not a duplicate, just similar transactions)
        if (candidate.account_id === inTx.account_id && candidate.source === inTx.source) {
          continue;
        }

        // Check description similarity
        const sim = descriptionSimilarity(
          inTx.description,
          candidate.description
        );

        if (sim >= fuzzyThreshold) {
          duplicates.push({
            existingId: candidate.id,
            newId: inTx.id,
            matchType: sim === 1 ? "exact" : "fuzzy",
            confidence: round2(sim),
            reason: `Data + valor iguais, descrição ${(sim * 100).toFixed(0)}% similar`,
          });
          if (sim === 1) exactMatches++;
          else fuzzyMatches++;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      unique.push(inTx);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      total: incoming.length,
      unique: unique.length,
      duplicates: duplicates.length,
      exactMatches,
      fuzzyMatches,
    },
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
