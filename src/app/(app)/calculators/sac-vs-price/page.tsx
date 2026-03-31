"use client";

import dynamic from "next/dynamic";

const SacVsPriceCalculator = dynamic(
  () => import("@/components/calculators/sac-vs-price-calculator").then((m) => m.SacVsPriceCalculator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function SacVsPricePage() {
  return <SacVsPriceCalculator />;
}
