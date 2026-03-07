import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wealthos.app",
  appName: "WealthOS",
  webDir: "out",
  server: {
    // In production, use the deployed URL for live updates
    // url: "https://your-app.vercel.app",
    // androidScheme: "https",
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
    scheme: "WealthOS",
  },
};

export default config;
