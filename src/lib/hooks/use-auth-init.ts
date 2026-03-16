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

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("users_profile")
            .select("full_name")
            .eq("id", user.id)
            .single();

          setUserName(profile?.full_name || user.email || "");
        }

        setReady(true);
      } catch {
        router.push("/login");
      }
    }

    init();
  }, [pathname, router]);

  return { ready, userName };
}
