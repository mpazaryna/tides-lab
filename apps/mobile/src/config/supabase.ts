// GREEN

import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "../constants";

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,  // Disabled - we use UUID auth, not session refresh
    persistSession: false,   // Disabled - we use UUID storage, not session persistence  
    detectSessionInUrl: false,
  },
});

// TODO: Auto-refresh disabled for UUID-only authentication
// We don't need automatic session refresh since we use stored UUIDs
/*
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
*/
