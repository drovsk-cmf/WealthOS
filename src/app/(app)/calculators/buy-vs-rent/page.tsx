"use client";

import dynamic from "next/dynamic";

const BuyVsRentCalculator = dynamic(
  () => import("@/components/calculators/buy-vs-rent-calculator").then((m) => m.BuyVsRentCalculator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function BuyVsRentPage() {
  return <BuyVsRentCalculator />;
}
