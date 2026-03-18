"use client";

/**
 * UX-H1-02: Onboarding Step 9 - Import Route
 *
 * Embeds the ImportWizard inside the onboarding flow so the user
 * never leaves the wizard context. On completion, fires onComplete
 * to advance to the celebration step.
 */

import { ImportWizard } from "@/components/connections/import-wizard";

interface RouteImportStepProps {
  onComplete: (stats: { imported: number; categorized: number }) => void;
}

export function RouteImportStep({ onComplete }: RouteImportStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Importar extrato
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione a conta, envie o arquivo e revise as transações.
        </p>
      </div>

      <ImportWizard onImportComplete={onComplete} />
    </div>
  );
}
