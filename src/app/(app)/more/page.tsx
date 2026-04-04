import { redirect } from "next/navigation";

/**
 * /more → /settings
 *
 * The "Mais" hub was eliminated in Navigation v3.
 * Low-frequency items are now accessible via /settings.
 * High-value items (Diagnóstico, Calculadoras, Indicadores, Impostos)
 * were promoted to sidebar sections.
 */
export default function MorePage() {
  redirect("/settings");
}
