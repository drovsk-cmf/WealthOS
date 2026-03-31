import { redirect } from "next/navigation";

/**
 * /calculators → /calculators/affordability
 * Redirect to default calculator tab.
 */
export default function CalculatorsPage() {
  redirect("/calculators/affordability");
}
