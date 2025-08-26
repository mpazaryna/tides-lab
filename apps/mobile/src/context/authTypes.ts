// Auth context types and reducer patterns for state management optimization

import type { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authToken: string | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTH_SUCCESS'; payload: { user: User | null; session: Session | null; authToken: string | null } }
  | { type: 'SET_AUTH_TOKEN'; payload: string | null }
  | { type: 'CLEAR_AUTH' }
  | { type: 'RESET_STATE' };

export const initialAuthState: AuthState = {
  user: null,
  session: null,
  loading: true,
  authToken: null,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting new operation
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        authToken: action.payload.authToken,
        loading: false,
        error: null,
      };

    case 'SET_AUTH_TOKEN':
      return {
        ...state,
        authToken: action.payload,
      };

    case 'CLEAR_AUTH':
      return {
        ...state,
        user: null,
        session: null,
        authToken: null,
        loading: false,
        error: null,
      };

    case 'RESET_STATE':
      return initialAuthState;

    default:
      return state;
  }
}