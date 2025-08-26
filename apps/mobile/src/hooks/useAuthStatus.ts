// Custom hook for authentication status checks and derived state
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export interface AuthStatusResult {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  hasUser: boolean;
  hasSession: boolean;
  hasApiKey: boolean;
  
  // User information
  userId: string | null;
  userEmail: string | null;
  
  // Error state
  error: string | null;
  hasError: boolean;
  
  // Combined states
  isReady: boolean; // Authenticated with API key and not loading
  canMakeApiCalls: boolean; // Has both session and API key
}

/**
 * Custom hook that provides derived authentication status and computed values.
 * Reduces the need to check multiple auth properties across components.
 * 
 * @returns AuthStatusResult with computed authentication state
 */
export function useAuthStatus(): AuthStatusResult {
  const { user, session, loading, apiKey, error } = useAuth();

  return useMemo<AuthStatusResult>(() => {
    const hasUser = !!user;
    const hasSession = !!session;
    const hasApiKey = !!apiKey;
    const isAuthenticated = hasUser && hasSession;
    const hasError = !!error;
    
    return {
      // Authentication state
      isAuthenticated,
      isLoading: loading,
      hasUser,
      hasSession,
      hasApiKey,
      
      // User information
      userId: user?.id || null,
      userEmail: user?.email || null,
      
      // Error state
      error,
      hasError,
      
      // Combined states
      isReady: isAuthenticated && hasApiKey && !loading,
      canMakeApiCalls: hasSession && hasApiKey,
    };
  }, [user, session, loading, apiKey, error]);
}

/**
 * Simple hook that returns just the authentication status boolean.
 * Useful for conditional rendering without importing the full auth context.
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthStatus();
  return isAuthenticated;
}

/**
 * Hook that returns loading state for showing loading indicators.
 */
export function useAuthLoading(): boolean {
  const { isLoading } = useAuthStatus();
  return isLoading;
}