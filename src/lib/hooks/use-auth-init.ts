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
        // Force browser client to sync session from cookies (critical after OAuth redirect).
        // createBrowserClient is a singleton — _initialize() may not have completed
        // by the time this hook runs. getSession() awaits initialization and returns
        // the cookie-based session, preventing a race where MFA/getUser calls fire
        // before the access token is loaded.
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          // No session in cookies — middleware should have caught this,
          // but bail gracefully instead of attempting MFA/encryption calls.
          router.push("/login");
          return;
        }

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

        // getUser() validates the token server-side (more reliable than getSession).
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
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[Oniefy] Auth init failed:", err);
        router.push("/login");
      }
    }

    init();
  }, [pathname, router]);

  return { ready, userName };
}
