import { supabase } from "../config/supabase";
import { secureStorage } from "./secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

class AuthService {
  private currentUrl = "https://tides-001.mpazbot.workers.dev"; // Fallback to env001
  private urlReady = false;
  private urlProvider: (() => string) | null = null;

  constructor() {
    this.initUrl();
  }

  /**
   * Configure the service with a URL provider from MCP context
   */
  setUrlProvider(getServerUrl: () => string): void {
    this.urlProvider = getServerUrl;
    this.currentUrl = getServerUrl();
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

  private async registerApiKeyWithServer(apiKey: string, userId: string, userEmail: string) {
    await this.waitForUrlInitialization();
    
    try {
      console.log('[AUTH] Attempting to register API key with server:', { 
        url: `${this.currentUrl}/register-api-key`,
        userId, 
        email: userEmail,
        hasApiKey: !!apiKey
      });

      const response = await fetch(`${this.currentUrl}/register-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          user_id: userId,
          user_email: userEmail,
          name: 'Mobile Generated Key'
        })
      });

      console.log('[AUTH] Server response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[AUTH] Server registration failed with response:', errorData);
        throw new Error(`Server registration failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('[AUTH] API key successfully registered with server:', { 
        success: result.success, 
        user_id: userId, 
        email: userEmail,
        serverResponse: result
      });
      return result;
    } catch (error) {
      console.error('[AUTH] Failed to register API key with server:', {
        error: error instanceof Error ? error.message : String(error),
        url: `${this.currentUrl}/register-api-key`,
        userId,
        email: userEmail
      });
      // Still don't throw - allow offline-first functionality
      // But warn the user that server features may not work
      console.warn('[AUTH] API key registration failed - server-based features may not work properly');
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const apiKey = this.generateApiKey(data.user.id);
        await secureStorage.setItem("user_api_key", apiKey);
        
        // Register API key with server using real email
        await this.registerApiKeyWithServer(apiKey, data.user.id, email);
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
        
        // Register API key with server using real email
        await this.registerApiKeyWithServer(apiKey, data.user.id, email);
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
        
        // Register API key with server using real email from user session
        if (session.user.email) {
          await this.registerApiKeyWithServer(apiKey, session.user.id, session.user.email);
        }
      } else if (event === "SIGNED_OUT") {
        await secureStorage.removeItem("user_api_key");
      }
      callback(event, session);
    });
  }
}

export const authService = new AuthService();
