// MCP context types and reducer patterns for state management optimization

import type { Tide } from "../types";

export interface MCPState {
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  tides: Tide[];
  selectedTide: Tide | null;
}

export type MCPAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: { isConnected: boolean; hasApiKey: boolean } }
  | { type: 'SET_TIDES'; payload: Tide[] }
  | { type: 'ADD_TIDE'; payload: Tide }
  | { type: 'UPDATE_TIDE'; payload: Tide }
  | { type: 'SELECT_TIDE'; payload: Tide | null }
  | { type: 'CLEAR_TIDES' }
  | { type: 'RESET_CONNECTION' }
  | { type: 'RESET_STATE' };

export const initialMCPState: MCPState = {
  isConnected: false,
  loading: false,
  error: null,
  tides: [],
  selectedTide: null,
};

export function mcpReducer(state: MCPState, action: MCPAction): MCPState {
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

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.isConnected && action.payload.hasApiKey,
        loading: false,
        error: !action.payload.hasApiKey 
          ? "No API key available. Please authenticate first."
          : !action.payload.isConnected 
          ? "Unable to connect to MCP server."
          : null,
      };

    case 'SET_TIDES':
      return {
        ...state,
        tides: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_TIDE':
      return {
        ...state,
        tides: [...state.tides, action.payload],
      };

    case 'UPDATE_TIDE':
      return {
        ...state,
        tides: state.tides.map(tide => 
          tide.id === action.payload.id ? action.payload : tide
        ),
      };

    case 'SELECT_TIDE':
      return {
        ...state,
        selectedTide: action.payload,
      };

    case 'CLEAR_TIDES':
      return {
        ...state,
        tides: [],
        selectedTide: null,
      };

    case 'RESET_CONNECTION':
      return {
        ...state,
        isConnected: false,
        tides: [],
        selectedTide: null,
        loading: false,
        error: null,
      };

    case 'RESET_STATE':
      return initialMCPState;

    default:
      return state;
  }
}