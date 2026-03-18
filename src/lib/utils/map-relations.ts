/**
 * Oniefy - Map Relations Helper
 *
 * Extrai campos de account e category de JOINs do Supabase (PostgREST).
 * Elimina duplicação de ~30 linhas entre use-transactions, use-recurrences
 * e upcoming-bills-card.
 *
 * Ref: Auditoria de código 2026-03-18, Problema 8
 */

export interface MappedAccountFields {
  account_name: string;
  account_color: string | null;
}

export interface MappedCategoryFields {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export type MappedRelationFields = MappedAccountFields & MappedCategoryFields;

/**
 * Extrai campos de account (name, color) de um row com JOIN `accounts(...)`.
 * Retorna defaults seguros para null/undefined.
 */
export function mapAccountRelation(
  row: Record<string, unknown>
): MappedAccountFields {
  const account = row.accounts as Record<string, unknown> | null;
  return {
    account_name: (account?.name as string) ?? "",
    account_color: (account?.color as string | null) ?? null,
  };
}

/**
 * Extrai campos de category (name, icon, color) de um row com JOIN `categories(...)`.
 * Retorna defaults seguros para null/undefined.
 */
export function mapCategoryRelation(
  row: Record<string, unknown>
): MappedCategoryFields {
  const category = row.categories as Record<string, unknown> | null;
  return {
    category_name: (category?.name as string | null) ?? null,
    category_icon: (category?.icon as string | null) ?? null,
    category_color: (category?.color as string | null) ?? null,
  };
}

/**
 * Extrai campos de account + category de um row com JOINs.
 * Uso: `(data ?? []).map(row => ({ ...row, ...mapTransactionRelations(row) }))`
 */
export function mapTransactionRelations(
  row: Record<string, unknown>
): MappedRelationFields {
  return {
    ...mapAccountRelation(row),
    ...mapCategoryRelation(row),
  };
}
