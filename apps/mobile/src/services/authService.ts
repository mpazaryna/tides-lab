// Refactored AuthService with centralized logging and improved structure

import { supabase } from "../config/supabase";
import { SecureStorage } from "./secureStorage";
import { LoggingService } from "./LoggingService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, Session } from "@supabase/supabase-js";

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthResult {
  user: User | null;
  session: Session | null;
  error?: Error;
}

class AuthenticationService {
  private static readonly API_KEY_STORAGE_KEY = "user_api_key";
  private static readonly SERVER_URL_STORAGE_KEY = "mcp_server_url";
  private static readonly DEFAULT_WORKER_URL =
    "https://supabase-tides-demo-1.mason-c32.workers.dev"; // Default fallback, will be overridden by ServerEnvironmentContext
  private static readonly SERVICE_NAME = "AuthService";

  private currentWorkerUrl: string = AuthenticationService.DEFAULT_WORKER_URL;
  private urlInitialized: boolean = false;
  private static instance: AuthenticationService | null = null;

  constructor() {
    this.initializeWorkerUrl();
  }

  // Singleton pattern
  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * Initialize worker URL from storage
   */
  private initializeWorkerUrl(): void {
    AsyncStorage.getItem(AuthenticationService.SERVER_URL_STORAGE_KEY)
      .then((savedUrl) => {
        if (savedUrl) {
          LoggingService.info(
            AuthenticationService.SERVICE_NAME,
            "Loaded saved worker URL",
            { url: savedUrl },
            "AUTH_024"
          );
          this.currentWorkerUrl = savedUrl;
        } else {
          LoggingService.info(
            AuthenticationService.SERVICE_NAME,
            "Using default worker URL",
            { url: this.currentWorkerUrl },
            "AUTH_026"
          );
        }
        this.urlInitialized = true;
      })
      .catch((error) => {
        LoggingService.warn(
          AuthenticationService.SERVICE_NAME,
          "Failed to load saved worker URL, using default",
          { error, defaultUrl: this.currentWorkerUrl },
          "AUTH_025"
        );
        this.urlInitialized = true;
      });
  }

  /**
   * Generate API key for user
   */
  private generateApiKey(userId: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 16; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `tides_${userId}_${randomId}`;
  }

  /**
   * Generate and store API key securely
   * Now includes automatic registration with the MCP server
   */
  private async generateAndStoreApiKey(userId: string): Promise<string> {
    try {
      // Clear any debug test keys to ensure we use the real user's key
      await AsyncStorage.removeItem("debug_test_key");
      
      const apiKey = this.generateApiKey(userId);
      
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Generated API key for user",
        { userId },
        "AUTH_019"
      );

      // Store the key locally first
      await SecureStorage.setItem(
        AuthenticationService.API_KEY_STORAGE_KEY,
        apiKey
      );

      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "API key stored securely",
        undefined,
        "AUTH_020"
      );

      // Register the key with the server (with retry logic)
      try {
        const registrationSuccess = await this.registerApiKeyWithRetry(
          apiKey, 
          userId, 
          'Mobile Generated Key'
        );

        if (!registrationSuccess) {
          LoggingService.warn(
            AuthenticationService.SERVICE_NAME,
            "API key registration failed, but key stored locally - user can still authenticate via fallback",
            { userId },
            "AUTH_REG_010"
          );
        }
      } catch (registrationError) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "API key registration failed with error, but key stored locally",
          { registrationError, userId },
          "AUTH_REG_011"
        );
        // Don't throw - allow the app to continue with local key
        // The fallback authentication will handle this case
      }

      return apiKey;
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Failed to generate and store API key",
        { error },
        "AUTH_021"
      );
      throw new Error("Failed to generate API key");
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Starting email signup",
        { email: credentials.email },
        "AUTH_001"
      );

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "Signup error",
          { error: error.message },
          "AUTH_002"
        );
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          "Signup successful, generating API key",
          { userId: data.user.id },
          "AUTH_003"
        );
        await this.generateAndStoreApiKey(data.user.id);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Signup failed",
        { error },
        "AUTH_004"
      );
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error("Unknown signup error"),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Starting email signin",
        { email: credentials.email },
        "AUTH_005"
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "Signin error",
          { error: error.message },
          "AUTH_006"
        );
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          "Signin successful, generating API key",
          { userId: data.user.id },
          "AUTH_007"
        );
        await this.generateAndStoreApiKey(data.user.id);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Signin failed",
        { error },
        "AUTH_008"
      );
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error("Unknown signin error"),
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Starting signout",
        undefined,
        "AUTH_009"
      );

      // Clear API key from secure storage
      await SecureStorage.removeItem(AuthenticationService.API_KEY_STORAGE_KEY);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "Signout error",
          { error: error.message },
          "AUTH_010"
        );
        throw new Error(error.message);
      }

      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Signout successful",
        undefined,
        "AUTH_011"
      );
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Signout failed",
        { error },
        "AUTH_012"
      );
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "Get session error",
          { error: error.message },
          "AUTH_013"
        );
        return null;
      }

      return session;
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Get session failed",
        { error },
        "AUTH_014"
      );
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "Get user error",
          { error: error.message },
          "AUTH_015"
        );
        return null;
      }

      return user;
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Get user failed",
        { error },
        "AUTH_016"
      );
      return null;
    }
  }

  /**
   * Get stored API key
   */
  async getApiKey(): Promise<string | null> {
    try {
      // Check for debug test key first (for testing purposes)
      const debugTestKey = await AsyncStorage.getItem("debug_test_key");
      if (debugTestKey) {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          "Using debug test key",
          { debugKey: debugTestKey },
          "AUTH_DEBUG_001"
        );
        return debugTestKey;
      }

      const apiKey = await SecureStorage.getItem(
        AuthenticationService.API_KEY_STORAGE_KEY
      );

      if (!apiKey) {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          "No API key found, generating new one",
          undefined,
          "AUTH_017"
        );
        
        const user = await this.getCurrentUser();
        if (user) {
          return await this.generateAndStoreApiKey(user.id);
        }
        return null;
      }

      return apiKey;
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Get API key failed",
        { error },
        "AUTH_018"
      );
      return null;
    }
  }

  /**
   * Set debug test key (for development/testing only)
   */
  async setDebugTestKey(testKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem("debug_test_key", testKey);
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Debug test key set",
        { testKey },
        "AUTH_DEBUG_002"
      );
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Failed to set debug test key",
        { error },
        "AUTH_DEBUG_003"
      );
      throw error;
    }
  }

  /**
   * Clear debug test key
   */
  async clearDebugTestKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem("debug_test_key");
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Debug test key cleared",
        undefined,
        "AUTH_DEBUG_004"
      );
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "Failed to clear debug test key",
        { error },
        "AUTH_DEBUG_005"
      );
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Auth state changed",
        { event },
        "AUTH_022"
      );

      if (event === "SIGNED_IN" && session?.user) {
        // Generate new API key on sign in
        await this.generateAndStoreApiKey(session.user.id);
      } else if (event === "SIGNED_OUT") {
        // Clear API key on sign out
        await SecureStorage.removeItem(
          AuthenticationService.API_KEY_STORAGE_KEY
        );
      }

      callback(event, session);
    });
  }

  /**
   * Get current worker URL
   */
  static get workerUrl(): string {
    const instance = AuthenticationService.getInstance();
    return instance.currentWorkerUrl;
  }

  /**
   * Check if URL is initialized
   */
  get isUrlInitialized(): boolean {
    return this.urlInitialized;
  }

  /**
   * Wait for URL initialization with timeout
   */
  async waitForUrlInitialization(): Promise<void> {
    if (this.urlInitialized) return;

    const maxAttempts = 50; // 5 seconds max
    let attempts = 0;

    while (!this.urlInitialized && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.urlInitialized) {
      LoggingService.warn(
        AuthenticationService.SERVICE_NAME,
        "URL initialization timed out, using default",
        { defaultUrl: this.currentWorkerUrl },
        "AUTH_027"
      );
      this.urlInitialized = true;
    }
  }

  /**
   * Set worker URL
   */
  async setWorkerUrl(url: string): Promise<void> {
    LoggingService.info(
      AuthenticationService.SERVICE_NAME,
      "Setting worker URL",
      { oldUrl: this.currentWorkerUrl, newUrl: url },
      "AUTH_023"
    );

    this.currentWorkerUrl = url;
    await AsyncStorage.setItem(
      AuthenticationService.SERVER_URL_STORAGE_KEY,
      url
    );
  }

  /**
   * Register API key with the MCP server
   * This bridges the gap between mobile key generation and server-side validation
   */
  async registerApiKey(apiKey: string, userId: string, keyName?: string): Promise<boolean> {
    try {
      // Wait for worker URL to be initialized
      await this.waitForUrlInitialization();

      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Starting API key registration with server",
        { 
          userId, 
          keyName, 
          workerUrl: this.currentWorkerUrl,
          apiKeyPrefix: apiKey.substring(0, 20) + "...",
          userIdLength: userId.length
        },
        "AUTH_REG_001"
      );

      const registrationData = {
        api_key: apiKey,
        user_id: userId,
        name: keyName || 'Mobile Generated Key'
      };

      LoggingService.info(
        AuthenticationService.SERVICE_NAME,
        "Sending registration request",
        { 
          url: `${this.currentWorkerUrl}/register-api-key`,
          userId: registrationData.user_id,
          name: registrationData.name
        },
        "AUTH_REG_001B"
      );

      const response = await fetch(`${this.currentWorkerUrl}/register-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          "API key registered successfully",
          { userId, keyHash: result.key_hash },
          "AUTH_REG_002"
        );
        return true;
      } else {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          "API key registration failed",
          { 
            status: response.status, 
            error: result.error, 
            details: result.details,
            userId 
          },
          "AUTH_REG_003"
        );
        return false;
      }
    } catch (error) {
      LoggingService.error(
        AuthenticationService.SERVICE_NAME,
        "API key registration network error",
        { error, userId },
        "AUTH_REG_004"
      );
      return false;
    }
  }

  /**
   * Register API key with retry logic
   * Attempts registration multiple times with exponential backoff
   */
  async registerApiKeyWithRetry(apiKey: string, userId: string, keyName?: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        LoggingService.info(
          AuthenticationService.SERVICE_NAME,
          `API key registration attempt ${attempt}/${maxRetries}`,
          { userId, attempt },
          "AUTH_REG_005"
        );

        const success = await this.registerApiKey(apiKey, userId, keyName);
        
        if (success) {
          LoggingService.info(
            AuthenticationService.SERVICE_NAME,
            "API key registration succeeded",
            { userId, attempt },
            "AUTH_REG_006"
          );
          return true;
        }

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          LoggingService.info(
            AuthenticationService.SERVICE_NAME,
            `API key registration failed, retrying in ${delayMs}ms`,
            { userId, attempt, delayMs },
            "AUTH_REG_007"
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        LoggingService.error(
          AuthenticationService.SERVICE_NAME,
          `API key registration attempt ${attempt} failed`,
          { error, userId, attempt },
          "AUTH_REG_008"
        );
        
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    LoggingService.error(
      AuthenticationService.SERVICE_NAME,
      "API key registration failed after all retries",
      { userId, maxRetries },
      "AUTH_REG_009"
    );
    return false;
  }
}

// Export singleton instance
export const AuthService = AuthenticationService.getInstance();