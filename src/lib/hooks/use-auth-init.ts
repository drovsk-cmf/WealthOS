"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadEncryptionKey } from "@/lib/auth/encryption-manager";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";

export function useAuthInit(pathname: string) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      try {
        // getUser() validates the token server-side and properly awaits
        // createBrowserClient initialization. This is the authoritative check.
        // getSession() reads from memory cache which may be stale after OAuth redirect.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // MFA check (only after user is confirmed)
        const { status } = await getMfaStatus(supabase);

        if (status === "enrolled_verified") {
          const { currentLevel, nextLevel } = await getAssuranceLevel(supabase);

          if (currentLevel === "aal1" && nextLevel === "aal2") {
            const { factorId } = await getMfaStatus(supabase);
            router.push(
              `/mfa-challenge?redirectTo=${encodeURIComponent(pathname)}&factorId=${factorId}`
            );
            return;
          }
        }

        try {
          await loadEncryptionKey(supabase);
        } catch {
          if (process.env.NODE_ENV === "development") console.warn("[Oniefy] DEK load failed - E2E fields unavailable");
        }

        const { data: profile } = await supabase
          .from("users_profile")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setUserName(profile?.full_name || user.email || "");
        setReady(true);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[Oniefy] Auth init failed:", err);
        router.push("/login");
      }
    }

    init();
  }, [pathname, router]);

  return { ready, userName };
}
