import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.oniefy.app",
  appName: "Oniefy",
  webDir: "out",
  server: {
    // Live-URL mode: iOS app loads from deployed Vercel instance.
    // All server-side features (API routes, middleware, SSR) work natively.
    // The native shell provides: push notifications, biometrics, camera, keychain.
    url: "https://www.oniefy.com",
    allowNavigation: ["www.oniefy.com", "*.supabase.co"],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      style: "dark",
    },
  },
  ios: {
    // Enable Keychain for secure token storage
    // Certificate pinning configured in native project
    scheme: "Oniefy",
  },
};

export default config;
