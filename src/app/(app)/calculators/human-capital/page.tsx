"use client";

import dynamic from "next/dynamic";

const HumanCapitalCalculator = dynamic(
  () => import("@/components/calculators/human-capital-calculator").then((m) => m.HumanCapitalCalculator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function HumanCapitalPage() {
  return <HumanCapitalCalculator />;
}
