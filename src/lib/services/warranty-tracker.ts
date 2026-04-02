/**
 * Oniefy - Warranty Tracker (E31)
 *
 * Tracks product warranties and alerts before expiration.
 * Total warranty = manufacturer warranty + credit card extension.
 *
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3 item #8
 */

export interface Warranty {
  id: string;
  productName: string;
  purchaseDate: string; // ISO date
  /** Manufacturer warranty in months */
  manufacturerMonths: number;
  /** Credit card extended warranty in months (0 if none) */
  cardExtensionMonths: number;
  /** Optional receipt/NF reference */
  receiptRef?: string;
}

export interface WarrantyStatus {
  id: string;
  productName: string;
  purchaseDate: string;
  totalMonths: number;
  expirationDate: string;
  daysRemaining: number;
  status: "active" | "expiring_soon" | "expired";
  /** Human-readable summary */
  summary: string;
}

/**
 * Calculate warranty status for a product.
 *
 * @param warranty - Warranty details
 * @param alertDaysBefore - Days before expiration to flag as "expiring_soon" (default: 30)
 * @param referenceDate - Date to calculate against (default: today)
 */
export function getWarrantyStatus(
  warranty: Warranty,
  alertDaysBefore = 30,
  referenceDate?: Date
): WarrantyStatus {
  const now = referenceDate ?? new Date();
  const purchaseDate = new Date(warranty.purchaseDate + "T12:00:00");
  const totalMonths = warranty.manufacturerMonths + warranty.cardExtensionMonths;

  const expDate = new Date(purchaseDate);
  expDate.setMonth(expDate.getMonth() + totalMonths);
  const expirationDate = expDate.toISOString().slice(0, 10);

  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: WarrantyStatus["status"];
  if (daysRemaining < 0) status = "expired";
  else if (daysRemaining <= alertDaysBefore) status = "expiring_soon";
  else status = "active";

  const cardNote = warranty.cardExtensionMonths > 0
    ? ` (${warranty.manufacturerMonths}m fabricante + ${warranty.cardExtensionMonths}m cartão)`
    : ` (${warranty.manufacturerMonths}m fabricante)`;

  let summary: string;
  if (status === "expired") {
    summary = `${warranty.productName}: garantia expirou há ${Math.abs(daysRemaining)} dias${cardNote}.`;
  } else if (status === "expiring_soon") {
    summary = `${warranty.productName}: garantia expira em ${daysRemaining} dias${cardNote}. Verifique se precisa acionar.`;
  } else {
    summary = `${warranty.productName}: garantia ativa, ${daysRemaining} dias restantes${cardNote}.`;
  }

  return {
    id: warranty.id,
    productName: warranty.productName,
    purchaseDate: warranty.purchaseDate,
    totalMonths,
    expirationDate,
    daysRemaining,
    status,
    summary,
  };
}

/**
 * Get all warranties expiring within N days.
 */
export function getExpiringWarranties(
  warranties: Warranty[],
  withinDays = 30,
  referenceDate?: Date
): WarrantyStatus[] {
  return warranties
    .map((w) => getWarrantyStatus(w, withinDays, referenceDate))
    .filter((s) => s.status === "expiring_soon")
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
