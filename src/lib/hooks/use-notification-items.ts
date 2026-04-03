/**
 * Oniefy - Notification Items Hook (E22)
 *
 * Aggregates pending items from multiple data sources into a unified
 * notification feed for the sininho (bell icon).
 *
 * Sources:
 * - Detected recurrences (E26): suggestions to confirm
 * - Price alerts (E27): anomalous charges
 * - Upcoming bills: due within 3 days
 * - Budget alerts: categories near/over limit
 *
 * Ref: docs/NOTIFICATION-BELL-SPEC.md
 */

import { useMemo } from "react";
import { useDetectedRecurrences } from "@/lib/hooks/use-detected-recurrences";
import { usePendingBills, useRecurrences } from "@/lib/hooks/use-recurrences";
import { checkAllPriceAnomalies } from "@/lib/services/price-anomaly-detector";
import { generateFiscalCalendar, getUpcomingFiscalEvents } from "@/lib/services/fiscal-calendar";

export type NotificationPriority = "urgent" | "action" | "info";

export interface NotificationItem {
  id: string;
  type: string;
  priority: NotificationPriority;
  title: string;
  description: string;
  /** If true, counts toward badge number. If false, shows dot only. */
  requiresAction: boolean;
  createdAt: Date;
  /** Optional link to navigate to for resolution */
  href?: string;
}

export interface NotificationSummary {
  items: NotificationItem[];
  actionCount: number;
  infoCount: number;
  isLoading: boolean;
}

/**
 * Aggregate notification items from all sources.
 * Returns sorted items (urgent first, then action, then info).
 */
export function useNotificationItems(): NotificationSummary {
  const { data: detectedRecs, isLoading: loadingRecs } = useDetectedRecurrences();
  const { data: pendingBills, isLoading: loadingBills } = usePendingBills();
  const { data: recurrences } = useRecurrences();

  const items = useMemo(() => {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // 1. Detected recurrences (E26) — action: confirm or dismiss
    if (detectedRecs) {
      for (const rec of detectedRecs.slice(0, 5)) {
        notifications.push({
          id: `rec-detect-${rec.description}`,
          type: "detected_recurrence",
          priority: "action",
          title: "Nova recorrência detectada",
          description: `"${rec.originalDescription}" aparece há ${rec.monthsDetected} meses (~R$ ${rec.averageAmount.toFixed(2).replace(".", ",")}). Quer acompanhar?`,
          requiresAction: true,
          createdAt: now,
          href: "/bills",
        });
      }
    }

    // 2. Price alerts (E27) — from existing recurrence history
    if (recurrences && recurrences.length > 0) {
      const recData = recurrences
        .filter((r) => r.is_active)
        .map((r) => {
          const tmpl = r.template_transaction as Record<string, unknown>;
          return {
            description: (tmpl?.description as string) ?? r.id,
            amounts: [Math.abs(Number(tmpl?.amount ?? 0))], // simplified: would need transaction history
          };
        })
        .filter((r) => r.amounts[0] > 0);

      const alerts = checkAllPriceAnomalies(recData);
      for (const alert of alerts) {
        notifications.push({
          id: `price-alert-${alert.description}`,
          type: "price_alert",
          priority: alert.severity === "red" ? "urgent" : "info",
          title: alert.severity === "red" ? "Aumento significativo" : "Reajuste detectado",
          description: alert.message,
          requiresAction: false,
          createdAt: now,
        });
      }
    }

    // 3. Upcoming bills (due within 3 days)
    if (pendingBills) {
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const urgent = pendingBills.filter((b) => {
        const dueDate = new Date(b.date);
        return dueDate <= threeDays && dueDate >= now;
      });

      for (const bill of urgent.slice(0, 5)) {
        const daysLeft = Math.ceil(
          (new Date(bill.date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        notifications.push({
          id: `bill-due-${bill.id}`,
          type: "upcoming_bill",
          priority: daysLeft <= 1 ? "urgent" : "info",
          title: daysLeft <= 1 ? "Vence amanhã" : `Vence em ${daysLeft} dias`,
          description: `${bill.description ?? "Conta"}: R$ ${Math.abs(Number(bill.amount)).toFixed(2).replace(".", ",")}`,
          requiresAction: false,
          createdAt: now,
          href: "/bills",
        });
      }
    }

    // 4. Fiscal calendar events (E51) — upcoming tax deadlines within 14 days
    const fiscalEvents = generateFiscalCalendar({ year: now.getFullYear() });
    const upcoming = getUpcomingFiscalEvents(fiscalEvents, 14);
    for (const fe of upcoming.slice(0, 3)) {
      notifications.push({
        id: `fiscal-${fe.id}`,
        type: "fiscal_deadline",
        priority: fe.isUrgent ? "urgent" : "info",
        title: fe.title,
        description: `${fe.description} (${fe.date})`,
        requiresAction: false,
        createdAt: now,
        href: "/tax",
      });
    }

    // Sort: urgent first, then action, then info
    const priorityOrder: Record<NotificationPriority, number> = {
      urgent: 0,
      action: 1,
      info: 2,
    };
    notifications.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return notifications;
  }, [detectedRecs, pendingBills, recurrences]);

  const actionCount = items.filter((i) => i.requiresAction).length;
  const infoCount = items.filter((i) => !i.requiresAction).length;
  const isLoading = loadingRecs || loadingBills;

  return { items, actionCount, infoCount, isLoading };
}
