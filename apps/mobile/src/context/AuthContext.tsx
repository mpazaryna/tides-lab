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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/authService";
import { loggingService } from "../services/loggingService";
import { authReducer, initialAuthState, type AuthState } from "./authTypes";

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

    // Check for UUID authentication (bypass Supabase)
    const getInitialAuth = async () => {
      try {
        loggingService.info("AuthContext", "Checking for stored UUID authentication", {});
        
        // Check if we have a stored UUID (our authentication token)
        const uuid = await AsyncStorage.getItem("user_uuid");
        
        if (uuid) {
          loggingService.info("AuthContext", "Found stored UUID, user is authenticated", { 
            uuidLength: uuid.length 
          });
          
          // Create a mock user object with the UUID
          const mockUser = { id: uuid } as any;
          
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user: mockUser, 
              session: null, // We don't need Supabase session for UUID auth
              authToken: uuid
            }
          });
        } else {
          loggingService.info("AuthContext", "No UUID found, user needs to authenticate", {});
          
          // No UUID means user is not authenticated
          dispatch({ type: "CLEAR_AUTH" });
        }
      } catch (error) {
        loggingService.error("AuthContext", "Failed to check UUID authentication", {
          error,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to check authentication",
        });
      }
    };

    getInitialAuth();

    // TODO: Auth state listener disabled for UUID-only authentication
    // We don't need Supabase to watch for session changes since we use UUIDs
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

        // Manually update auth state since auth listener is disabled for UUID auth
        if (result.user) {
          console.log('[AuthContext] Getting auth token for signed in user...');
          const authToken = await authService.getAuthToken();
          console.log('[AuthContext] Retrieved auth token:', { 
            hasAuthToken: !!authToken, 
            authTokenLength: authToken?.length,
            authTokenPrefix: authToken ? authToken.substring(0, 8) + '...' : 'null'
          });
          
          console.log('[AuthContext] Dispatching SET_AUTH_SUCCESS...');
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user: result.user, 
              session: result.session, 
              authToken
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

        // Manually update auth state since auth listener is disabled for UUID auth
        if (result.user) {
          console.log('[AuthContext] Getting auth token for signed up user...');
          const authToken = await authService.getAuthToken();
          console.log('[AuthContext] Retrieved auth token:', { 
            hasAuthToken: !!authToken, 
            authTokenLength: authToken?.length,
            authTokenPrefix: authToken ? authToken.substring(0, 8) + '...' : 'null'
          });
          
          console.log('[AuthContext] Dispatching SET_AUTH_SUCCESS for sign up...');
          dispatch({
            type: "SET_AUTH_SUCCESS",
            payload: { 
              user: result.user, 
              session: result.session, 
              authToken
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
      // State will be updated by the auth state change listener
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
