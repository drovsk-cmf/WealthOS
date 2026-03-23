"use client";

/**
 * QuickEntryFab - DASH-08
 *
 * Botão flutuante '+' para lançamento rápido.
 * Abre o TransactionForm como dialog.
 * Disponível em ambas as seções do Dashboard.
 */

import { useState } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";

export function QuickEntryFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
        aria-label="Novo lançamento"
        title="Novo lançamento"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      <TransactionForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
