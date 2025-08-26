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
import { authService } from "../services/authService";
import { loggingService } from "../services/loggingService";
import { authReducer, initialAuthState, type AuthState } from "./authTypes";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshApiKey: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const updateAuthState = async (
    user: User | null,
    session: Session | null
  ) => {
    loggingService.info("AuthContext", "Updating auth state", {
      hasUser: !!user,
      hasSession: !!session,
    });

    let apiKey: string | null = null;
    if (user && session) {
      try {
        apiKey = await authService.getApiKey();
        loggingService.info("AuthContext", "Retrieved API key", {
          hasApiKey: !!apiKey,
        });
      } catch (error) {
        loggingService.error("AuthContext", "Failed to retrieve API key", {
          error,
        });
      }
    }

    dispatch({
      type: "SET_AUTH_SUCCESS",
      payload: { user, session, apiKey },
    });
  };

  useEffect(() => {
    loggingService.info("AuthContext", "Initializing auth context", undefined);

    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await authService.getCurrentSession();
        await updateAuthState(session?.user || null, session);
      } catch (error) {
        loggingService.error("AuthContext", "Failed to get initial session", {
          error,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to initialize authentication",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
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
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      loggingService.info("AuthContext", "Signing in user", { email });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const result = await authService.signInWithEmail(email, password);

        if (result.error) {
          throw result.error;
        }

        // State will be updated by the auth state change listener
        loggingService.info("AuthContext", "Sign in successful", undefined);
      } catch (error) {
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

        if (result.error) {
          throw result.error;
        }

        // State will be updated by the auth state change listener
        loggingService.info("AuthContext", "Sign up successful", undefined);
      } catch (error) {
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
      // State will be updated by the auth state change listener
      loggingService.info("AuthContext", "Sign out successful", undefined);
    } catch (error) {
      loggingService.error("AuthContext", "Sign out failed", { error });
      dispatch({ type: "SET_ERROR", payload: "Failed to sign out" });
      throw error;
    }
  }, []);

  const refreshApiKey = useCallback(async (): Promise<void> => {
    loggingService.info("AuthContext", "Refreshing API key", undefined);

    if (!state.user) {
      const error = new Error("No authenticated user");
      loggingService.error(
        "AuthContext",
        "Cannot refresh API key without authenticated user",
        { error }
      );
      throw error;
    }

    try {
      // This will generate a new API key
      const newApiKey = await authService.getApiKey();

      dispatch({
        type: "SET_API_KEY",
        payload: newApiKey,
      });

      loggingService.info("AuthContext", "API key refreshed", {
        hasApiKey: !!newApiKey,
      });
    } catch (error) {
      loggingService.error("AuthContext", "Failed to refresh API key", {
        error,
      });
      throw error;
    }
  }, [state.user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      refreshApiKey,
    }),
    [state, signIn, signUp, signOut, refreshApiKey]
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
