import { supabase } from "../config/supabase";
import { SUPABASE_CONFIG } from "../constants";
import { secureStorage } from "./secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Keep for non-sensitive data
import type { Session } from "@supabase/supabase-js";

class AuthService {
  private currentUrl = "https://tides-001.mpazbot.workers.dev"; // Fallback to env001
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

  private generateApiKey(userId: string) {
    // Generate a random suffix for uniqueness (6 chars)
    const randomId = Math.random().toString(36).substring(2, 8);
    // Format: tides_userId_randomId (per server auth requirements)
    return `tides_${userId}_${randomId}`;
  }

  private async registerApiKeyWithMCPServer(
    apiKey: string, 
    userId: string, 
    email: string
  ): Promise<boolean> {
    try {
      console.log('[AuthService] Registering API key with MCP server...', { 
        userId, 
        email,
        serverUrl: this.currentUrl 
      });
      
      const serverUrl = this.urlProvider ? this.urlProvider() : this.currentUrl;
      const response = await fetch(`${serverUrl}/register-api-key`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          user_id: userId,
          user_email: email,
          name: 'Mobile App Key'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[AuthService] ✅ API key registered with MCP server successfully', {
          keyHash: result.key_hash?.substring(0, 8) + '...',
          userId: result.user_id
        });
        return true;
      } else {
        console.error('[AuthService] ❌ Failed to register API key with MCP server:', {
          error: result.error,
          details: result.details
        });
        return false;
      }
    } catch (error) {
      console.error('[AuthService] ❌ Network error during API key registration:', error);
      return false;
    }
  }


  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);

      if (data.user && data.session) {
        const apiKey = this.generateApiKey(data.user.id);
        await secureStorage.setItem("api_key", apiKey);
        
        // Register with MCP server D1 database
        await this.registerApiKeyWithMCPServer(apiKey, data.user.id, data.user.email || '');
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
        const apiKey = this.generateApiKey(data.user.id);
        console.log('[AuthService] Generated API key, storing...', { apiKey: apiKey.substring(0, 8) + '...' });
        // TODO: Remove debug logging before production release
        // DEBUG: API key validation successful (key details redacted for security)
        await secureStorage.setItem("api_key", apiKey);
        console.log('[AuthService] API key stored successfully');
        
        // Register with MCP server (in case user signed up before this fix)
        await this.registerApiKeyWithMCPServer(apiKey, data.user.id, data.user.email || '');
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('[AuthService] Sign in failed:', error);
      return { user: null, session: null, error: error as Error };
    }
  }

  async signOut() {
    // Clear local API key first (works offline)
    await secureStorage.removeItem("api_key");
    
    // Then try Supabase signout (may fail if offline)
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    } catch (error) {
      console.log('[AuthService] Supabase signout failed (may be offline):', error);
      // Don't throw - local cleanup is more important
    }
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

  async verifyStoredAuth(): Promise<{
    isValid: boolean;
    user?: any;
    isOffline?: boolean;
  }> {
    try {
      // First check if we have a valid session
      const session = await this.getCurrentSession();
      
      if (session && session.user) {
        // We have an active session - verify with MCP server to ensure API key is still valid
        const apiKey = await secureStorage.getItem("api_key");
        if (apiKey) {
          const mcpValid = await this.validateWithMCPServer(apiKey);
          if (mcpValid) {
            console.log('[AuthService] User verification successful - active session + valid MCP');
            return { isValid: true, user: session.user };
          } else {
            console.log('[AuthService] User invalid - MCP server rejected API key (user likely deleted)');
            return { isValid: false };
          }
        }
      }
      
      // No active session - check if API key is still valid with MCP server
      const apiKey = await secureStorage.getItem("api_key");
      if (apiKey) {
        const mcpValid = await this.validateWithMCPServer(apiKey);
        if (mcpValid) {
          // API key is valid with MCP - allow offline mode (session just expired)
          console.log('[AuthService] Session expired but API key valid, allowing offline mode');
          return { isValid: true, isOffline: true };
        } else {
          // API key rejected by MCP - user was deleted
          console.log('[AuthService] User invalid - MCP server rejected API key (user deleted)');
          return { isValid: false };
        }
      }
      
      // No API key stored
      console.log('[AuthService] No API key stored');
      return { isValid: false };
    } catch (networkError) {
      // Network error - allow offline mode if we have an API key
      const apiKey = await secureStorage.getItem("api_key");
      if (apiKey) {
        console.log('[AuthService] Network error during verification, allowing offline mode');
        return { isValid: true, isOffline: true };
      }
      console.log('[AuthService] Network error and no API key stored');
      return { isValid: false };
    }
  }

  private async validateWithMCPServer(apiKey: string): Promise<boolean> {
    try {
      // Make a simple health check call to MCP server with the API key
      const response = await fetch(`${this.currentUrl}/ai/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // 200 = valid user, 401 = invalid user, anything else = network issue
      if (response.status === 200) {
        console.log('[AuthService] MCP validation successful');
        return true;
      } else if (response.status === 401) {
        console.log('[AuthService] MCP validation failed - 401 Unauthorized');
        return false;
      } else {
        console.log('[AuthService] MCP validation unclear - status:', response.status);
        // TODO: Implement proper error handling for ambiguous HTTP status codes
        return true; // Assume valid on unclear responses to avoid false logouts
      }
    } catch (error) {
      console.log('[AuthService] MCP validation failed due to network error:', error);
      return true; // Network error - assume valid for offline mode
    }
  }

  async getApiKey() {
    try {
      console.log('[AuthService] getApiKey called');
      
      // Get API key from SecureStorage
      const apiKey = await secureStorage.getItem("api_key");
      console.log('[AuthService] Retrieved API key from SecureStorage:', { hasApiKey: !!apiKey, apiKeyLength: apiKey?.length });
      
      console.log('[AuthService] Returning API key:', { hasApiKey: !!apiKey, apiKeyLength: apiKey?.length });
      return apiKey;
    } catch (error) {
      console.error('[AuthService] getApiKey failed:', error);
      return null;
    }
  }

  // Debug test key removed - using API key authentication only

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const apiKey = this.generateApiKey(session.user.id);
        await secureStorage.setItem("api_key", apiKey);
      } else if (event === "SIGNED_OUT") {
        // Using secureStorage for API key storage
        await secureStorage.removeItem("api_key");
      }
      callback(event, session);
    });
  }
}

export const authService = new AuthService();
