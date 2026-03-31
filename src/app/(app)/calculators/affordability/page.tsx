"use client";

import dynamic from "next/dynamic";

const AffordabilitySimulator = dynamic(
  () => import("@/components/calculators/affordability-simulator").then((m) => m.AffordabilitySimulator),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default function AffordabilityPage() {
  return <AffordabilitySimulator />;
}
