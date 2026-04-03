"use client";

/**
 * Oniefy - Sankey Flow Chart (E41)
 *
 * Visualizes money flow: Income Sources → Total → Expense Categories → Savings.
 * Uses Recharts Sankey component.
 */

import { useMemo } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { buildSankeyData, type TransactionForSankey } from "@/lib/services/sankey-data";

interface SankeyFlowChartProps {
  transactions: TransactionForSankey[];
  height?: number;
}

export function SankeyFlowChart({ transactions, height = 400 }: SankeyFlowChartProps) {
  const data = useMemo(() => buildSankeyData(transactions, 8), [transactions]);

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Sem dados suficientes para o diagrama de fluxo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={height}>
        <Sankey
          data={data}
          nodePadding={24}
          nodeWidth={10}
          margin={{ top: 10, right: 120, bottom: 10, left: 10 }}
          link={{ stroke: "hsl(var(--muted-foreground) / 0.15)" }}
        >
          <Tooltip
            formatter={(value: number) =>
              `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
        </Sankey>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 text-[10px] text-muted-foreground">
        <span>Receita: R$ {data.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        <span>Despesas: R$ {data.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        {data.surplus > 0 && (
          <span className="text-verdant font-medium">
            Sobra: R$ {data.surplus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}
