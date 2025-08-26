import { supabase } from "../config/supabase";
import { secureStorage } from "./secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

class AuthService {
  private currentUrl = "https://supabase-tides-demo-1.mason-c32.workers.dev";
  private urlReady = false;

  constructor() {
    this.initUrl();
  }

  private async initUrl() {
    const saved = await AsyncStorage.getItem("mcp_server_url").catch(
      () => null
    );
    if (saved) this.currentUrl = saved;
    this.urlReady = true;
  }

  static get workerUrl() {
    return authService.currentUrl;
  }

  async waitForUrlInitialization() {
    if (!this.urlReady) {
      await this.initUrl();
    }
  }

  async setWorkerUrl(url: string) {
    this.currentUrl = url;
    await AsyncStorage.setItem("mcp_server_url", url);
  }

  private generateApiKey(userId: string) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 16; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `tides_${userId}_${randomId}`;
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const apiKey = this.generateApiKey(data.user.id);
        await secureStorage.setItem("user_api_key", apiKey);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const apiKey = this.generateApiKey(data.user.id);
        await secureStorage.setItem("user_api_key", apiKey);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }

  async signOut() {
    await secureStorage.removeItem("user_api_key");
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      return error ? null : session;
    } catch {
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return error ? null : user;
    } catch {
      return null;
    }
  }

  async getApiKey() {
    try {
      const debugKey = await AsyncStorage.getItem("debug_test_key");
      if (debugKey) return debugKey;

      let apiKey = await secureStorage.getItem("user_api_key");
      if (!apiKey) {
        const user = await this.getCurrentUser();
        if (user) {
          apiKey = this.generateApiKey(user.id);
          await secureStorage.setItem("user_api_key", apiKey);
        }
      }
      return apiKey;
    } catch {
      return null;
    }
  }

  async setDebugTestKey(testKey: string) {
    await AsyncStorage.setItem("debug_test_key", testKey);
  }

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const apiKey = this.generateApiKey(session.user.id);
        await secureStorage.setItem("user_api_key", apiKey);
      } else if (event === "SIGNED_OUT") {
        await secureStorage.removeItem("user_api_key");
      }
      callback(event, session);
    });
  }
}

export const authService = new AuthService();
