import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Merge Tailwind classes with clsx.
 * Used by shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as BRL currency.
 * @example formatCurrency(1234.56) => "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a date string or Date object.
 * @param date - ISO string or Date object
 * @param pattern - date-fns format pattern (default: "dd/MM/yyyy")
 */
export function formatDate(
  date: string | Date,
  pattern: string = "dd/MM/yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

/**
 * Format a date as relative time (e.g., "há 2 dias").
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(d);
}

/**
 * Sanitize a redirect path to prevent open redirect and XSS.
 * Only accepts relative paths starting with /. Rejects absolute URLs,
 * protocol handlers (javascript:, data:, etc.), and double slashes.
 *
 * @param url - Raw redirect target (from query string, etc.)
 * @param fallback - Safe default (default: "/dashboard")
 * @returns Sanitized path or fallback
 */
export function sanitizeRedirectTo(
  url: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!url) return fallback;

  const trimmed = url.trim();

  // Must start with single /
  if (!trimmed.startsWith("/")) return fallback;

  // Reject double slash (//evil.com), backslash, protocol schemes
  if (
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes(":") ||
    trimmed.includes("@")
  ) {
    return fallback;
  }

  // Reject control characters and encoded variants
  const decoded = decodeURIComponent(trimmed);
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.toLowerCase().includes("javascript") ||
    decoded.toLowerCase().includes("data:")
  ) {
    return fallback;
  }

  return trimmed;
}
