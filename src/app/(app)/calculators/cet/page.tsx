"use client";

import dynamic from "next/dynamic";

const CetCalculator = dynamic(
  () => import("@/components/calculators/cet-calculator").then((m) => m.CetCalculator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function CetPage() {
  return <CetCalculator />;
}
