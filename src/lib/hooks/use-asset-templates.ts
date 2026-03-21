/**
 * useAssetTemplates - P14 (adendo v1.5 §5.6)
 *
 * Fetch asset templates for auto-fill suggestions
 * when creating a new asset.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AssetTemplate {
  id: string;
  name: string;
  category: string;
  default_depreciation_rate: number;
  reference_value_brl: number | null;
  useful_life_years: number | null;
  tags: string[];
}

export function useAssetTemplates() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["asset_templates"],
    staleTime: 60 * 60 * 1000, // 1 hour (static data)
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_templates")
        .select("id, name, category, default_depreciation_rate, reference_value_brl, useful_life_years, tags")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as AssetTemplate[];
    },
  });
}

/**
 * Find matching templates by search text (fuzzy match on name + tags).
 */
export function searchTemplates(templates: AssetTemplate[], query: string): AssetTemplate[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return templates
    .filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
    )
    .slice(0, 5);
}
