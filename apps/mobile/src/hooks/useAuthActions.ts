import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useAsyncAction } from "./useAsyncAction";

export type AuthActionType =
  | "signIn"
  | "signUp"
  | "signOut"
  | "refreshApiKey"
  | null;

export interface AuthActionsResult {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshApiKey: () => Promise<void>;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRefreshingApiKey: boolean;
  isPerformingAction: boolean;
  actionError: string | null;
  clearActionError: () => void;
}

export function useAuthActions(): AuthActionsResult {
  const authContext = useAuth();

  const signInAction = useAsyncAction(
    (email: string, password: string) => authContext.signIn(email, password),
    { logContext: "useAuthActions", logData: { action: "signIn" } }
  );

  const signUpAction = useAsyncAction(
    (email: string, password: string) => authContext.signUp(email, password),
    { logContext: "useAuthActions", logData: { action: "signUp" } }
  );

  const signOutAction = useAsyncAction(() => authContext.signOut(), {
    logContext: "useAuthActions",
    logData: { action: "signOut" },
  });

  const refreshApiKeyAction = useAsyncAction(
    () => authContext.refreshApiKey(),
    { logContext: "useAuthActions", logData: { action: "refreshApiKey" } }
  );

  const actionError = useMemo(
    () =>
      signInAction.error ||
      signUpAction.error ||
      signOutAction.error ||
      refreshApiKeyAction.error,
    [
      signInAction.error,
      signUpAction.error,
      signOutAction.error,
      refreshApiKeyAction.error,
    ]
  );

  const clearActionError = () => {
    signInAction.clearError();
    signUpAction.clearError();
    signOutAction.clearError();
    refreshApiKeyAction.clearError();
  };

  return {
    signIn: signInAction.execute,
    signUp: signUpAction.execute,
    signOut: signOutAction.execute,
    refreshApiKey: refreshApiKeyAction.execute,
    isSigningIn: signInAction.isLoading,
    isSigningUp: signUpAction.isLoading,
    isSigningOut: signOutAction.isLoading,
    isRefreshingApiKey: refreshApiKeyAction.isLoading,
    isPerformingAction:
      signInAction.isLoading ||
      signUpAction.isLoading ||
      signOutAction.isLoading ||
      refreshApiKeyAction.isLoading,
    actionError,
    clearActionError,
  };
}
