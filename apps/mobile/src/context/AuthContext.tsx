// Refactored AuthContext using useReducer pattern for optimized state management

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { secureStorage } from "../services/secureStorage";
import { authService } from "../services/authService";
import { loggingService } from "../services/loggingService";
import { authReducer, initialAuthState, type AuthState } from "./authTypes";
import { extractUserIdFromApiKey } from "../utils/apiKeyUtils";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);


  useEffect(() => {
    loggingService.info("AuthContext", "Initializing auth context", undefined);

    // Hybrid authentication: Check API key and verify with Supabase
    const getInitialAuth = async () => {
      try {
        // Step 1: Check for stored API key
        const apiKey = await secureStorage.getItem("api_key");
        loggingService.info("AuthContext", "Retrieved API key from SecureStorage", { hasApiKey: !!apiKey });
        
        if (!apiKey) {
          // No API key - user needs to authenticate
          loggingService.info("AuthContext", "No API key found, user needs to authenticate", {});
          dispatch({ type: "CLEAR_AUTH" });
          return;
        }
        
        loggingService.info("AuthContext", "Found stored API key, verifying with Supabase", { 
          apiKeyLength: apiKey.length 
        });
        
        // Step 2: Verify with Supabase
        const verification = await authService.verifyStoredAuth();
        
        if (verification.isValid) {
          // Valid user - set authenticated state
          let user = verification.user;
          if (!user && apiKey) {
            // Extract user ID from API key for offline mode
            const userId = extractUserIdFromApiKey(apiKey);
            if (userId) {
              user = { id: userId } as any;
              loggingService.info("AuthContext", "Created user object from API key", { userId });
            }
          }
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user, 
              session: null, 
              apiKey: apiKey 
            }
          });
          
          if (verification.isOffline) {
            loggingService.info("AuthContext", "Running in offline mode", {});
            // Could add offline indicator to state if needed
          } else {
            loggingService.info("AuthContext", "User verification successful", { userId: user?.id });
          }
        } else {
          // User no longer valid - clear auth data
          loggingService.info("AuthContext", "Clearing invalid auth data", {});
          await secureStorage.removeItem("api_key");
          dispatch({ type: "CLEAR_AUTH" });
        }
      } catch (error) {
        // Handle any unexpected errors
        loggingService.error("AuthContext", "Auth initialization failed", { error });
        dispatch({ type: "SET_ERROR", payload: "Failed to verify authentication" });
      }
    };

    getInitialAuth();

    // TODO: Consider implementing selective auth state listening for hybrid auth scenarios
    // We don't need Supabase to watch for session changes since we use API keys
    /*
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      loggingService.info("AuthContext", "Auth state changed", { event });
      await updateAuthState(session?.user || null, session);
    });

    return () => {
      loggingService.info(
        "AuthContext",
        "Cleaning up auth subscription",
        undefined
      );
      subscription.unsubscribe();
    };
    */
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      loggingService.info("AuthContext", "Signing in user", { email });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const result = await authService.signInWithEmail(email, password);
        console.log('[AuthContext] Sign in service result:', {
          hasUser: !!result.user,
          hasSession: !!result.session,
          hasError: !!result.error,
          userId: result.user?.id
        });

        if (result.error) {
          throw result.error;
        }

        // Manually update auth state since auth listener is disabled for API key auth
        if (result.user) {
          console.log('[AuthContext] Getting API key for signed in user...');
          const apiKey = await authService.getApiKey();
          console.log('[AuthContext] Retrieved API key:', { 
            hasApiKey: !!apiKey, 
            apiKeyLength: apiKey?.length,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'null'
          });
          
          console.log('[AuthContext] Dispatching SET_AUTH_SUCCESS...');
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user: result.user, 
              session: result.session, 
              apiKey
            }
          });
          console.log('[AuthContext] Auth state updated successfully');
        } else {
          console.log('[AuthContext] No user in result, cannot update auth state');
        }

        loggingService.info("AuthContext", "Sign in successful", undefined);
      } catch (error) {
        console.error('[AuthContext] Sign in error:', error);
        loggingService.error("AuthContext", "Sign in failed", { error });
        dispatch({ type: "SET_ERROR", payload: "Failed to sign in" });
        throw error;
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<void> => {
      loggingService.info("AuthContext", "Signing up user", { email });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const result = await authService.signUpWithEmail(email, password);
        console.log('[AuthContext] Sign up service result:', {
          hasUser: !!result.user,
          hasSession: !!result.session,
          hasError: !!result.error,
          userId: result.user?.id
        });

        if (result.error) {
          throw result.error;
        }

        // Manually update auth state since auth listener is disabled for API key auth
        if (result.user) {
          console.log('[AuthContext] Getting API key for signed up user...');
          const apiKey = await authService.getApiKey();
          console.log('[AuthContext] Retrieved API key:', { 
            hasApiKey: !!apiKey, 
            apiKeyLength: apiKey?.length,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'null'
          });
          
          console.log('[AuthContext] Dispatching SET_AUTH_SUCCESS for sign up...');
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user: result.user, 
              session: result.session, 
              apiKey
            }
          });
          console.log('[AuthContext] Auth state updated successfully after sign up');
        } else {
          console.log('[AuthContext] No user in sign up result, cannot update auth state');
        }

        loggingService.info("AuthContext", "Sign up successful", undefined);
      } catch (error) {
        console.error('[AuthContext] Sign up error:', error);
        loggingService.error("AuthContext", "Sign up failed", { error });
        dispatch({ type: "SET_ERROR", payload: "Failed to sign up" });
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    loggingService.info("AuthContext", "Signing out user", undefined);
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      await authService.signOut();
      // Manually clear auth state since auth listener is disabled for API key auth
      console.log('[AuthContext] Clearing auth state after sign out');
      dispatch({ type: "CLEAR_AUTH" });
      loggingService.info("AuthContext", "Sign out successful", undefined);
    } catch (error) {
      loggingService.error("AuthContext", "Sign out failed", { error });
      dispatch({ type: "SET_ERROR", payload: "Failed to sign out" });
      throw error;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
    }),
    [state, signIn, signUp, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
