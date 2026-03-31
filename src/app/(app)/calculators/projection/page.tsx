"use client";

import dynamic from "next/dynamic";

const ExpenseProjection = dynamic(
  () => import("@/components/calculators/expense-projection").then((m) => m.ExpenseProjection),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function ProjectionPage() {
  return <ExpenseProjection />;
}
