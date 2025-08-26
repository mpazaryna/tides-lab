// Custom hook for authentication actions with enhanced error handling
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoggingService } from '../services/LoggingService';

export interface AuthActionsResult {
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshApiKey: () => Promise<void>;
  
  // Action states
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRefreshingApiKey: boolean;
  
  // Any action in progress
  isPerformingAction: boolean;
  
  // Last action error (separate from context error)
  actionError: string | null;
  clearActionError: () => void;
}

/**
 * Custom hook that provides authentication actions with individual loading states
 * and error handling. Separates action-specific state from general auth state.
 * 
 * @returns AuthActionsResult with actions and their loading states
 */
export function useAuthActions(): AuthActionsResult {
  const authContext = useAuth();
  
  // Individual action loading states
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRefreshingApiKey, setIsRefreshingApiKey] = useState(false);
  
  // Action-specific error state
  const [actionError, setActionError] = useState<string | null>(null);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    LoggingService.info(
      'useAuthActions',
      'Sign in action started',
      { email },
      'AUTH_HOOK_001'
    );
    
    setIsSigningIn(true);
    setActionError(null);
    
    try {
      await authContext.signIn(email, password);
      LoggingService.info(
        'useAuthActions',
        'Sign in action completed successfully',
        { email },
        'AUTH_HOOK_002'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setActionError(errorMessage);
      
      LoggingService.error(
        'useAuthActions',
        'Sign in action failed',
        { error, email },
        'AUTH_HOOK_003'
      );
      
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [authContext]);

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    LoggingService.info(
      'useAuthActions',
      'Sign up action started',
      { email },
      'AUTH_HOOK_004'
    );
    
    setIsSigningUp(true);
    setActionError(null);
    
    try {
      await authContext.signUp(email, password);
      LoggingService.info(
        'useAuthActions',
        'Sign up action completed successfully',
        { email },
        'AUTH_HOOK_005'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setActionError(errorMessage);
      
      LoggingService.error(
        'useAuthActions',
        'Sign up action failed',
        { error, email },
        'AUTH_HOOK_006'
      );
      
      throw error;
    } finally {
      setIsSigningUp(false);
    }
  }, [authContext]);

  const signOut = useCallback(async (): Promise<void> => {
    LoggingService.info(
      'useAuthActions',
      'Sign out action started',
      undefined,
      'AUTH_HOOK_007'
    );
    
    setIsSigningOut(true);
    setActionError(null);
    
    try {
      await authContext.signOut();
      LoggingService.info(
        'useAuthActions',
        'Sign out action completed successfully',
        undefined,
        'AUTH_HOOK_008'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setActionError(errorMessage);
      
      LoggingService.error(
        'useAuthActions',
        'Sign out action failed',
        { error },
        'AUTH_HOOK_009'
      );
      
      throw error;
    } finally {
      setIsSigningOut(false);
    }
  }, [authContext]);

  const refreshApiKey = useCallback(async (): Promise<void> => {
    LoggingService.info(
      'useAuthActions',
      'API key refresh action started',
      undefined,
      'AUTH_HOOK_010'
    );
    
    setIsRefreshingApiKey(true);
    setActionError(null);
    
    try {
      await authContext.refreshApiKey();
      LoggingService.info(
        'useAuthActions',
        'API key refresh completed successfully',
        undefined,
        'AUTH_HOOK_011'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API key refresh failed';
      setActionError(errorMessage);
      
      LoggingService.error(
        'useAuthActions',
        'API key refresh failed',
        { error },
        'AUTH_HOOK_012'
      );
      
      throw error;
    } finally {
      setIsRefreshingApiKey(false);
    }
  }, [authContext]);

  const isPerformingAction = isSigningIn || isSigningUp || isSigningOut || isRefreshingApiKey;

  return {
    // Actions
    signIn,
    signUp,
    signOut,
    refreshApiKey,
    
    // Action states
    isSigningIn,
    isSigningUp,
    isSigningOut,
    isRefreshingApiKey,
    
    // Combined state
    isPerformingAction,
    
    // Error handling
    actionError,
    clearActionError,
  };
}