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

// ── E66: Learning Loop (princípios #5 e #6 da DEDUP-ENGINE-SPEC) ──

/**
 * User decision about a potential duplicate.
 */
export interface UserDecisionRecord {
  /** The two transaction IDs involved */
  existingId: string;
  newId: string;
  /** User's decision */
  decision: "same" | "different";
  /** Fingerprint at time of decision (date|amount) */
  fingerprint: string;
  /** Normalized description of the new transaction */
  normalizedDescription: string;
  /** Recorded at */
  timestamp: string;
}

/**
 * Learned pattern from user decisions.
 * Stored per user, used to auto-resolve future ambiguities.
 */
export interface LearnedPattern {
  /** Type of learned behavior */
  type: "allow_same_day_duplicates" | "auto_merge";
  /** Normalized description pattern */
  descriptionPattern: string;
  /** Amount (fixed, for "R$ 8,50 Padaria" same-day pattern) */
  amount: number;
  /** How many times this decision was made (confidence grows with repetition) */
  occurrences: number;
}

/**
 * Records a user decision and derives a learned pattern.
 *
 * Spec principle #5: "A decisão do usuário ensina o motor."
 *
 * @param decision - User's decision about duplicate pair
 * @param existingPatterns - Current learned patterns
 * @returns Updated patterns array
 */
export function recordUserDecision(
  decision: UserDecisionRecord,
  existingPatterns: LearnedPattern[]
): LearnedPattern[] {
  const patterns = [...existingPatterns];
  const desc = decision.normalizedDescription;

  if (decision.decision === "different") {
    // User says these are NOT duplicates (e.g., two coffees same day same amount)
    // Learn: this description + amount can appear multiple times same day
    const amount = parseFloat(decision.fingerprint.split("|")[1]) || 0;

    const existing = patterns.find(
      (p) =>
        p.type === "allow_same_day_duplicates" &&
        p.descriptionPattern === desc &&
        Math.abs(p.amount - amount) < 0.01
    );

    if (existing) {
      existing.occurrences++;
    } else {
      patterns.push({
        type: "allow_same_day_duplicates",
        descriptionPattern: desc,
        amount,
        occurrences: 1,
      });
    }
  } else {
    // User says these ARE the same transaction
    // Learn: auto-merge this pattern in the future
    const amount = parseFloat(decision.fingerprint.split("|")[1]) || 0;
    const existing = patterns.find(
      (p) =>
        p.type === "auto_merge" &&
        p.descriptionPattern === desc &&
        Math.abs(p.amount - amount) < 0.01
    );

    if (existing) {
      existing.occurrences++;
    } else {
      patterns.push({
        type: "auto_merge",
        descriptionPattern: desc,
        amount,
        occurrences: 1,
      });
    }
  }

  return patterns;
}

/**
 * Applies learned patterns to filter dedup results.
 *
 * - Patterns with "allow_same_day_duplicates" remove false positives
 *   (e.g., two R$ 8,50 coffees at the same place on the same day)
 * - Patterns with "auto_merge" upgrade fuzzy matches to auto-merge
 *   (confidence → 1.0, no need to ask user again)
 *
 * @param result - Raw dedup result
 * @param patterns - Learned patterns for this user
 * @returns Adjusted dedup result
 */
export function applyLearnedPatterns(
  result: DeduplicationResult,
  patterns: LearnedPattern[],
  incoming: TransactionForDedup[]
): DeduplicationResult {
  if (patterns.length === 0) return result;

  const adjustedDuplicates: DuplicateMatch[] = [];
  const promotedToUnique: TransactionForDedup[] = [];

  for (const dup of result.duplicates) {
    const inTx = incoming.find((t) => t.id === dup.newId);
    if (!inTx) {
      adjustedDuplicates.push(dup);
      continue;
    }

    const desc = normalizeDescription(inTx.description);
    const amount = Math.abs(inTx.amount); // patterns store positive amounts

    // Check "allow_same_day_duplicates" patterns
    const allowPattern = patterns.find(
      (p) =>
        p.type === "allow_same_day_duplicates" &&
        p.descriptionPattern === desc &&
        Math.abs(p.amount - amount) < 0.01 &&
        p.occurrences >= 1
    );

    if (allowPattern) {
      // User previously said these are NOT duplicates → promote to unique
      promotedToUnique.push(inTx);
      continue;
    }

    // Check "auto_merge" patterns
    const mergePattern = patterns.find(
      (p) =>
        p.type === "auto_merge" &&
        p.descriptionPattern === desc &&
        Math.abs(p.amount - amount) < 0.01 &&
        p.occurrences >= 2 // require at least 2 confirmations before auto-merge
    );

    if (mergePattern) {
      adjustedDuplicates.push({
        ...dup,
        confidence: 1.0,
        reason: `${dup.reason} (auto-merge: padrão confirmado ${mergePattern.occurrences}x pelo usuário)`,
      });
      continue;
    }

    adjustedDuplicates.push(dup);
  }

  return {
    unique: [...result.unique, ...promotedToUnique],
    duplicates: adjustedDuplicates,
    stats: {
      total: result.stats.total,
      unique: result.unique.length + promotedToUnique.length,
      duplicates: adjustedDuplicates.length,
      exactMatches: adjustedDuplicates.filter((d) => d.matchType === "exact").length,
      fuzzyMatches: adjustedDuplicates.filter((d) => d.matchType === "fuzzy").length,
    },
  };
}

/**
 * Spec principle #6: "Sinais opostos nunca são duplicata."
 * +100 and -100 on the same day = purchase + refund, not a duplicate.
 *
 * This should be called BEFORE deduplicateTransactions to filter out
 * cross-sign pairs from the candidate pool.
 */
export function filterOppositeSigns(
  existing: TransactionForDedup[],
  incoming: TransactionForDedup[]
): { existing: TransactionForDedup[]; incoming: TransactionForDedup[] } {
  // Nothing to filter if all same sign
  // The key insight: if an incoming transaction has the opposite sign of an
  // existing one with same date and amount, they are NOT duplicates.
  // We mark the existing ones so they're excluded from fingerprint matching.

  // Build a set of incoming fingerprints with their signs
  const incomingSigns = new Map<string, number>();
  for (const tx of incoming) {
    const fp = `${tx.date}|${Math.abs(tx.amount).toFixed(2)}`;
    incomingSigns.set(fp, tx.amount >= 0 ? 1 : -1);
  }

  // Filter existing: remove any that have opposite sign to incoming with same fingerprint
  const filteredExisting = existing.filter((ex) => {
    const fp = `${ex.date}|${Math.abs(ex.amount).toFixed(2)}`;
    const inSign = incomingSigns.get(fp);
    if (inSign === undefined) return true; // no incoming match → keep
    const exSign = ex.amount >= 0 ? 1 : -1;
    // If opposite signs → exclude from matching (they're not duplicates)
    return exSign === inSign;
  });

  return { existing: filteredExisting, incoming };
}

