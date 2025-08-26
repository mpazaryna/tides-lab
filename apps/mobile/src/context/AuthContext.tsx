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
import { AuthService } from "../services/authService";
import { LoggingService } from "../services/LoggingService";
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
    LoggingService.info(
      "AuthContext",
      "Updating auth state",
      { hasUser: !!user, hasSession: !!session },
      "AUTH_001"
    );

    let apiKey: string | null = null;
    if (user && session) {
      try {
        apiKey = await AuthService.getApiKey();
        LoggingService.info(
          "AuthContext",
          "Retrieved API key",
          { hasApiKey: !!apiKey },
          "AUTH_002"
        );
      } catch (error) {
        LoggingService.error(
          "AuthContext",
          "Failed to retrieve API key",
          { error },
          "AUTH_003"
        );
      }
    }

    dispatch({
      type: 'SET_AUTH_SUCCESS',
      payload: { user, session, apiKey },
    });
  };

  useEffect(() => {
    LoggingService.info(
      "AuthContext",
      "Initializing auth context",
      undefined,
      "AUTH_004"
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await AuthService.getCurrentSession();
        await updateAuthState(session?.user || null, session);
      } catch (error) {
        LoggingService.error(
          "AuthContext",
          "Failed to get initial session",
          { error },
          "AUTH_005"
        );
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      LoggingService.info(
        "AuthContext",
        "Auth state changed",
        { event },
        "AUTH_006"
      );
      await updateAuthState(session?.user || null, session);
    });

    return () => {
      LoggingService.info(
        "AuthContext",
        "Cleaning up auth subscription",
        undefined,
        "AUTH_007"
      );
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    LoggingService.info(
      "AuthContext",
      "Signing in user",
      { email },
      "AUTH_008"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await AuthService.signInWithEmail({ email, password });

      if (result.error) {
        throw result.error;
      }

      // State will be updated by the auth state change listener
      LoggingService.info(
        "AuthContext",
        "Sign in successful",
        undefined,
        "AUTH_009"
      );
    } catch (error) {
      LoggingService.error(
        "AuthContext",
        "Sign in failed",
        { error },
        "AUTH_010"
      );
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign in' });
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    LoggingService.info(
      "AuthContext",
      "Signing up user",
      { email },
      "AUTH_011"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await AuthService.signUpWithEmail({ email, password });

      if (result.error) {
        throw result.error;
      }

      // State will be updated by the auth state change listener
      LoggingService.info(
        "AuthContext",
        "Sign up successful",
        undefined,
        "AUTH_012"
      );
    } catch (error) {
      LoggingService.error(
        "AuthContext",
        "Sign up failed",
        { error },
        "AUTH_013"
      );
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign up' });
      throw error;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    LoggingService.info(
      "AuthContext",
      "Signing out user",
      undefined,
      "AUTH_014"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await AuthService.signOut();
      // State will be updated by the auth state change listener
      LoggingService.info(
        "AuthContext",
        "Sign out successful",
        undefined,
        "AUTH_015"
      );
    } catch (error) {
      LoggingService.error(
        "AuthContext",
        "Sign out failed",
        { error },
        "AUTH_016"
      );
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign out' });
      throw error;
    }
  }, []);

  const refreshApiKey = useCallback(async (): Promise<void> => {
    LoggingService.info(
      "AuthContext",
      "Refreshing API key",
      undefined,
      "AUTH_017"
    );

    if (!state.user) {
      const error = new Error("No authenticated user");
      LoggingService.error(
        "AuthContext",
        "Cannot refresh API key without authenticated user",
        { error },
        "AUTH_018"
      );
      throw error;
    }

    try {
      // This will generate a new API key
      const newApiKey = await AuthService.getApiKey();

      dispatch({
        type: 'SET_API_KEY',
        payload: newApiKey,
      });

      LoggingService.info(
        "AuthContext",
        "API key refreshed",
        { hasApiKey: !!newApiKey },
        "AUTH_019"
      );
    } catch (error) {
      LoggingService.error(
        "AuthContext",
        "Failed to refresh API key",
        { error },
        "AUTH_020"
      );
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
