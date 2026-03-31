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
 * Format a number as currency.
 * @param value - numeric value
 * @param currency - ISO 4217 code (default: "BRL")
 * @example formatCurrency(1234.56) => "R$ 1.234,56"
 * @example formatCurrency(1234.56, "USD") => "US$ 1.234,56"
 */
export function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format a number as percentage with Brazilian locale (comma separator).
 * @example formatPercent(0.054266) => "0,05" (default 2 decimals)
 * @example formatPercent(5.5, 1) => "5,5"
 */
export function formatPercent(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with Brazilian locale (comma separator).
 * @example formatDecimalBR(1234.5678, 4) => "1.234,5678"
 * @example formatDecimalBR(0.05, 2) => "0,05"
 */
export function formatDecimalBR(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number for chart axis labels (compact, BR locale).
 * @example formatAxisBR(1500000) => "1,5M"
 * @example formatAxisBR(45000) => "45k"
 * @example formatAxisBR(750) => "750"
 */
export function formatAxisBR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${formatDecimalBR(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${formatDecimalBR(value / 1_000, 0)}k`;
  return formatDecimalBR(value, 0);
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
 * Format a date string as short month label (D5.03).
 * @param dateStr - ISO date string (YYYY-MM-DD or YYYY-MM)
 * @param withYear - include 2-digit year (default: false)
 * @example formatMonthShort("2026-03-01") => "mar"
 * @example formatMonthShort("2026-03-01", true) => "mar 26"
 */
export function formatMonthShort(dateStr: string, withYear = false): string {
  const d = new Date(dateStr + (dateStr.length <= 7 ? "-01T12:00:00" : "T12:00:00"));
  const opts: Intl.DateTimeFormatOptions = withYear
    ? { month: "short", year: "2-digit" }
    : { month: "short" };
  return d.toLocaleDateString("pt-BR", opts).replace(".", "");
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

// ─── Color names for accessibility ──────────────────────────

// ─── Retry / backoff ────────────────────────────────────────
export { withRetry, isTransientError, exponentialBackoff } from "./retry";
export type { RetryOptions } from "./retry";

const COLOR_NAME_MAP: Record<string, string> = {
  "#56688F": "Azul ardósia",
  "#2F7A68": "Verde esmeralda",
  "#A97824": "Âmbar",
  "#A64A45": "Terracota",
  "#6F6678": "Lavanda",
  "#A7794E": "Bronze",
  "#7E9487": "Sálvia",
  "#241E29": "Grafite",
  "#4A7A6E": "Verde jade",
  "#8B6B4A": "Canela",
  "#CEC4B8": "Areia",
  "#5A7B8F": "Azul aço",
};

export function getColorName(hex: string): string {
  return COLOR_NAME_MAP[hex.toUpperCase()] ?? COLOR_NAME_MAP[hex] ?? hex;
}
