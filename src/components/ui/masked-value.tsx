"use client";

/**
 * Oniefy - Masked Value Component
 *
 * Wraps financial values. When privacy mode is on, renders "•••••" instead.
 * Usage: <Mv>{formatCurrency(1234.56)}</Mv>
 *
 * Short name intentional: used 100+ times across the app.
 */

import { usePrivacyStore } from "@/lib/stores/privacy";

interface MvProps {
  children: React.ReactNode;
  /** Override: always show regardless of privacy mode */
  show?: boolean;
}

export function Mv({ children, show }: MvProps) {
  const hidden = usePrivacyStore((s) => s.valuesHidden);

  if (show || !hidden) {
    return <>{children}</>;
  }

  return <span aria-label="Valor oculto">•••••</span>;
}
