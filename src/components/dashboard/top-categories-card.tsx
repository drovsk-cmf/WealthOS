"use client";

/**
 * TopCategoriesCard - DASH-03
 *
 * Top 5 categorias de gasto do mês.
 * Horizontal bar chart com percentual.
 * Ao tocar na categoria, abre lista de transações filtrada (link).
 */

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { TopCategoriesResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: TopCategoriesResult | undefined;
  isLoading: boolean;
}

const FALLBACK_COLORS = [
  "#56688F",
  "#2F7A68",
  "#A97824",
  "#A64A45",
  "#6F6678",
];

export function TopCategoriesCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-5 shadow-card card-alive">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const categories = data?.categories ?? [];
  const totalExpense = data?.total_expense ?? 0;

  return (
    <div className="rounded-lg bg-card p-5 shadow-card card-alive">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Top Categorias</h3>
        <span className="text-xs text-muted-foreground">
          <Mv>{formatCurrency(totalExpense)}</Mv> total
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sem despesas neste mês
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {categories.map((cat, idx) => {
            const color = cat.color || FALLBACK_COLORS[idx % 5];
            return (
              <Link
                key={cat.category_name}
                href={`/transactions?category=${encodeURIComponent(cat.category_name)}`}
                className="group block"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="group-hover:text-primary">
                      {cat.category_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-muted-foreground">
                      {cat.percentage} %
                    </span>
                    <span className="font-medium">
                      <Mv>{formatCurrency(cat.total)}</Mv>
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cat.percentage, 1)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
