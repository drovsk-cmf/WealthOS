"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Oniefy] App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/15">
          <AlertTriangle className="h-7 w-7 text-terracotta" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Erro ao carregar a página</h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um problema ao carregar esta seção. Seus dados estão seguros.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">
            Referência: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
