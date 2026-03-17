"use client";

/**
 * Push Notifications hook (5.2 / CFG-04 web)
 *
 * Manages Web Push API subscription lifecycle:
 * 1. Check if browser supports push + permission status
 * 2. Subscribe: ask permission → create PushSubscription → store in DB
 * 3. Unsubscribe: remove from browser + DB
 * 4. Test: trigger a test notification via API
 */

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export interface PushState {
  supported: boolean;
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PushState>({
    supported: false,
    permission: "unsupported",
    subscribed: false,
    loading: true,
  });

  // Check support and current subscription
  useEffect(() => {
    async function check() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState({ supported: false, permission: "unsupported", subscribed: false, loading: false });
        return;
      }

      const permission = Notification.permission as PushPermission;
      let subscribed = false;

      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        subscribed = !!sub;
      } catch {
        // silently fail
      }

      setState({ supported: true, permission, subscribed, loading: false });
    }
    check();
  }, []);

  // Subscribe mutation
  const subscribe = useMutation({
    mutationFn: async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permissão para notificações negada.");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      // Store subscription in notification_tokens
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const subJson = subscription.toJSON();
      const { error } = await supabase.from("notification_tokens").upsert({
        user_id: user.id,
        platform: "web",
        device_token: subJson.endpoint ?? "",
        device_name: navigator.userAgent.slice(0, 100),
        subscription_data: JSON.parse(JSON.stringify(subJson)),
      }, { onConflict: "user_id,device_token" });

      if (error) throw error;

      setState(s => ({ ...s, permission: "granted", subscribed: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_tokens"] });
    },
  });

  // Unsubscribe mutation
  const unsubscribe = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from DB
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("notification_tokens")
            .delete()
            .eq("user_id", user.id)
            .eq("device_token", endpoint);
        }
      }

      setState(s => ({ ...s, subscribed: false }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_tokens"] });
    },
  });

  // Test notification
  const testNotification = useCallback(async () => {
    const res = await fetch("/api/push/test", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Falha ao enviar notificação de teste.");
    }
  }, []);

  return {
    ...state,
    subscribe: subscribe.mutateAsync,
    unsubscribe: unsubscribe.mutateAsync,
    testNotification,
    isSubscribing: subscribe.isPending,
    isUnsubscribing: unsubscribe.isPending,
  };
}
