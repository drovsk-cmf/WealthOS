/**
 * Oniefy - Privacy Mode Store
 *
 * Global toggle to hide/show financial values across the app.
 * Persisted to localStorage so it survives page refresh.
 * Used by the <Mv> (MaskedValue) component.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyState {
  valuesHidden: boolean;
  toggleValues: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      valuesHidden: false,
      toggleValues: () => set((s) => ({ valuesHidden: !s.valuesHidden })),
    }),
    {
      name: "oniefy-privacy",
    }
  )
);
