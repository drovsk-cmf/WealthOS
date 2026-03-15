"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Oniefy] Unhandled error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="mx-auto max-w-md space-y-4 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/15">
            <AlertTriangle className="h-8 w-8 text-terracotta" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Erro inesperado</h1>
          <p className="text-sm text-muted-foreground">
            Algo deu errado. Se o problema persistir, tente limpar o cache do navegador ou entre em contato.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Referência: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
