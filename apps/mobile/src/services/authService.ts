import { supabase } from "../config/supabase";
import { SUPABASE_CONFIG } from "../constants";
// import { secureStorage } from "./secureStorage"; // TODO: Re-enable once Keychain is fixed
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

class AuthService {
  private currentUrl = "https://tides-006.mpazbot.workers.dev"; // Fallback to env001
  private urlReady = false;
  private urlProvider: (() => string) | null = null;

  constructor() {
    // Don't await in constructor - it's called synchronously
    this.initUrl().catch(error => {
      console.error('[AuthService] URL initialization failed:', error);
      this.urlReady = true; // Mark as ready even if it fails
    });
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

  private generateAuthToken(userId: string) {
    // Use Supabase UUID directly as auth token (per auth-specs.md)
    return userId;
  }


  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const uuid = this.generateAuthToken(data.user.id);
        // TODO: Replace AsyncStorage with secureStorage once Keychain issue is fixed
        await AsyncStorage.setItem("user_uuid", uuid);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting Supabase sign in...', { email });
      console.log('[AuthService] Supabase URL:', SUPABASE_CONFIG.url);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('[AuthService] Supabase response:', { 
        hasData: !!data, 
        hasError: !!error, 
        errorMessage: error?.message 
      });
      
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const uuid = this.generateAuthToken(data.user.id);
        console.log('[AuthService] Generated UUID, storing...', { uuid: uuid.substring(0, 8) + '...' });
        // TODO: Replace AsyncStorage with secureStorage once Keychain issue is fixed
        await AsyncStorage.setItem("user_uuid", uuid);
        console.log('[AuthService] UUID stored successfully');
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('[AuthService] Sign in failed:', error);
      return { user: null, session: null, error: error as Error };
    }
  }

  async signOut() {
    // TODO: Replace AsyncStorage with secureStorage once Keychain issue is fixed
    await AsyncStorage.removeItem("user_uuid");
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

  async getAuthToken() {
    try {
      console.log('[AuthService] getAuthToken called');
      
      let uuid = await AsyncStorage.getItem("user_uuid");
      console.log('[AuthService] Retrieved UUID from storage:', { hasUuid: !!uuid, uuidLength: uuid?.length });
      
      // Migration: Check for legacy API key storage and migrate to UUID
      if (!uuid) {
        console.log('[AuthService] No UUID found, checking for migration');
        const oldApiKey = await AsyncStorage.getItem("user_api_key");
        console.log('[AuthService] Legacy API key check:', { hasOldKey: !!oldApiKey });
        
        if (oldApiKey) {
          console.log('[AuthService] Removing legacy API key');
          await AsyncStorage.removeItem("user_api_key");
        }
        
        console.log('[AuthService] Getting current user for UUID generation');
        const user = await this.getCurrentUser();
        console.log('[AuthService] Current user:', { hasUser: !!user, userId: user?.id });
        
        if (user) {
          uuid = this.generateAuthToken(user.id);
          console.log('[AuthService] Generated UUID:', { uuid: uuid.substring(0, 8) + '...' });
          await AsyncStorage.setItem("user_uuid", uuid);
          console.log('[AuthService] Stored UUID in AsyncStorage');
        } else {
          console.log('[AuthService] No user available for UUID generation');
        }
      }
      
      console.log('[AuthService] Returning UUID:', { hasUuid: !!uuid, uuidLength: uuid?.length });
      return uuid;
    } catch (error) {
      console.error('[AuthService] getAuthToken failed:', error);
      return null;
    }
  }

  // Debug test key removed - using UUID authentication only

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const uuid = this.generateAuthToken(session.user.id);
        // TODO: Replace AsyncStorage with secureStorage once Keychain issue is fixed
        await AsyncStorage.setItem("user_uuid", uuid);
      } else if (event === "SIGNED_OUT") {
        // TODO: Replace AsyncStorage with secureStorage once Keychain issue is fixed
        await AsyncStorage.removeItem("user_uuid");
      }
      callback(event, session);
    });
  }
}

export const authService = new AuthService();
