import { remoteConfig } from "./firebase";
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { APP_CONFIG } from "../constants";

export const initRemoteConfig = async () => {
  if (typeof window === "undefined") return;

  // 1. Set Default Values
  // These act as the fallback if the app is offline or can't fetch from Firebase.
  // We mirror the values from constants.ts to ensure consistency.
  remoteConfig.defaultConfig = {
    tnc_current_version: APP_CONFIG.tnc_current_version,
    deposit_amount_cents: APP_CONFIG.deposit_amount_cents,
    deposit_release_hours_after_checkout: APP_CONFIG.deposit_release_hours_after_checkout,
    maintenance_mode: false,
    enable_passport_ocr: true,
  };

  // 2. Fetch and Activate
  try {
    // In production, you might set a longer fetch interval (e.g. 1 hour)
    // For development, we can keep it low to see changes immediately.
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 Hour

    await fetchAndActivate(remoteConfig);
    console.log("🔥 Firebase Remote Config initialized");
  } catch (err) {
    console.warn("⚠️ Remote Config fetch failed, using default values:", err);
  }
};

// Helper to get a string value
export const getRemoteString = (key: string): string => {
  return getValue(remoteConfig, key).asString();
};

// Helper to get a number value
export const getRemoteNumber = (key: string): number => {
  return getValue(remoteConfig, key).asNumber();
};

// Helper to get a boolean value
export const getRemoteBoolean = (key: string): boolean => {
  return getValue(remoteConfig, key).asBoolean();
}