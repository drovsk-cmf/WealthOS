"use client";

import dynamic from "next/dynamic";

const IndependenceCalculator = dynamic(
  () => import("@/components/calculators/independence-calculator").then((m) => m.IndependenceCalculator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function IndependencePage() {
  return <IndependenceCalculator />;
}
