"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import FocusTrap from "focus-trap-react";
import { X, AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { OnieLoader } from "@/components/ui/onie-loader";
import type { NotificationItem, NotificationPriority } from "@/lib/hooks/use-notification-items";

interface NotificationPanelProps {
  items: NotificationItem[];
  actionCount: number;
  isLoading: boolean;
  open: boolean;
  onClose: () => void;
}

const PRIORITY_STYLES: Record<
  NotificationPriority,
  { border: string; bg: string; icon: string }
> = {
  urgent: {
    border: "border-terracotta/40",
    bg: "bg-terracotta/5",
    icon: "text-terracotta",
  },
  action: {
    border: "border-burnished/40",
    bg: "bg-burnished/5",
    icon: "text-burnished",
  },
  info: {
    border: "border-border",
    bg: "",
    icon: "text-muted-foreground",
  },
};

/**
 * Notification panel overlay (E22 — NOTIFICATION-BELL-SPEC.md).
 * Slides down from top or appears as modal over current screen.
 * Items sorted by priority: urgent → action → info.
 */
export function NotificationPanel({
  items,
  actionCount,
  isLoading,
  open,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing on the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true, initialFocus: false }}>
      <div>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Painel de pendências"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background shadow-elevated sm:right-4 sm:top-16 sm:h-auto sm:max-h-[80vh] sm:rounded-xl sm:border"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">
              Pendências
              {actionCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {actionCount}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <OnieLoader size="sm" state="processing" />
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <OnieLoader size="md" state="positive" />
              <p className="mt-4 text-sm font-medium">Tudo em ordem.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nenhuma pendência no momento.
              </p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => {
                const style = PRIORITY_STYLES[item.priority];
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${style.icon}`}>
                        {item.priority === "urgent" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : item.priority === "action" ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                        {item.href && (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
                          >
                            Ver detalhes →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </FocusTrap>
  );
}
