import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export interface AuthStatusResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasUser: boolean;
  hasSession: boolean;
  hasApiKey: boolean;
  userId: string | null;
  userEmail: string | null;
  error: string | null;
  hasError: boolean;
  isReady: boolean;
  canMakeApiRequests: boolean;
}

export function useAuthStatus(): AuthStatusResult {
  const { user, session, loading, apiKey, error } = useAuth();

  return useMemo(() => {
    const hasUser = !!user;
    const hasSession = !!session;
    const hasApiKey = !!apiKey;
    const isAuthenticated = hasUser && hasSession;

    return {
      isAuthenticated,
      isLoading: loading,
      hasUser,
      hasSession,
      hasApiKey,
      userId: user?.id || null,
      userEmail: user?.email || null,
      error,
      hasError: !!error,
      isReady: isAuthenticated && hasApiKey && !loading,
      canMakeApiRequests: hasSession && hasApiKey,
    };
  }, [user, session, loading, apiKey, error]);
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthStatus();
  return isAuthenticated;
}

export function useAuthLoading(): boolean {
  const { isLoading } = useAuthStatus();
  return isLoading;
}
