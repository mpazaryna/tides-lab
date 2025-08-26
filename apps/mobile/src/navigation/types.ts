// Navigation type definitions for React Navigation

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth Stack Parameters
export type AuthStackParamList = {
  Initial: undefined;
  CreateAccount: undefined;
  AuthLoading: { email?: string };
};

// Main Stack Parameters
export type MainStackParamList = {
  Home: { tideId?: string; tideName?: string; };
  Chat: { tideId?: string; tideName?: string; };
  Server: undefined;
  Mcp: undefined;
  Settings: undefined;
  TidesList: undefined;
  Tide: { 
    tideId: string; 
    tideName?: string; 
  };
  FlowSession: {
    tideId: string;
    sessionId?: string;
  };
  TideDetails: {
    tideId: string;
    mode?: 'view' | 'edit';
  };
  Profile: undefined;
  About: undefined;
};

// Root Stack Parameters
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Loading: { message?: string };
  Error: { 
    error: string; 
    retry?: () => void; 
  };
};

// Screen Props Types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// Specific Screen Props
export type HomeScreenProps = MainStackScreenProps<'Home'>;
export type ChatScreenProps = MainStackScreenProps<'Chat'>;
export type TideScreenProps = MainStackScreenProps<'Tide'>;
export type TideDetailsScreenProps = MainStackScreenProps<'TideDetails'>;
export type FlowSessionScreenProps = MainStackScreenProps<'FlowSession'>;
export type SettingsScreenProps = MainStackScreenProps<'Settings'>;

export type InitialScreenProps = AuthStackScreenProps<'Initial'>;
export type CreateAccountScreenProps = AuthStackScreenProps<'CreateAccount'>;

// Navigation Helper Types
export type AllStackParamList = RootStackParamList & MainStackParamList & AuthStackParamList;

// Screen Names Constants
export const ScreenNames = {
  // Root screens
  AUTH: 'Auth' as const,
  MAIN: 'Main' as const,
  LOADING: 'Loading' as const,
  ERROR: 'Error' as const,
  
  // Auth screens
  INITIAL: 'Initial' as const,
  CREATE_ACCOUNT: 'CreateAccount' as const,
  AUTH_LOADING: 'AuthLoading' as const,
  
  // Main screens
  HOME: 'Home' as const,
  CHAT: 'Chat' as const,
  SERVER: 'Server' as const,
  MCP: 'Mcp' as const,
  SETTINGS: 'Settings' as const,
  TIDES_LIST: 'TidesList' as const,
  TIDE: 'Tide' as const,
  TIDE_DETAILS: 'TideDetails' as const,
  FLOW_SESSION: 'FlowSession' as const,
  PROFILE: 'Profile' as const,
  ABOUT: 'About' as const,
} as const;

// Navigation Routes for easy reference
export const Routes = {
  auth: {
    initial: ScreenNames.INITIAL,
    createAccount: ScreenNames.CREATE_ACCOUNT,
    authLoading: ScreenNames.AUTH_LOADING,
  },
  main: {
    home: ScreenNames.HOME,
    chat: ScreenNames.CHAT,
    server: ScreenNames.SERVER,
    mcp: ScreenNames.MCP,
    settings: ScreenNames.SETTINGS,
    tidesList: ScreenNames.TIDES_LIST,
    tide: ScreenNames.TIDE,
    tideDetails: ScreenNames.TIDE_DETAILS,
    flowSession: ScreenNames.FLOW_SESSION,
    profile: ScreenNames.PROFILE,
    about: ScreenNames.ABOUT,
  },
  root: {
    auth: ScreenNames.AUTH,
    main: ScreenNames.MAIN,
    loading: ScreenNames.LOADING,
    error: ScreenNames.ERROR,
  },
} as const;

// Navigation options
export const NavigationOptions = {
  // Default options for different types of screens
  modal: {
    presentation: 'modal' as const,
    gestureEnabled: true,
    headerShown: false,
  },
  
  fullScreen: {
    headerShown: false,
    gestureEnabled: true,
  },
  
  withHeader: {
    headerShown: true,
    gestureEnabled: true,
  },
  
  noGesture: {
    headerShown: false,
    gestureEnabled: false,
  },
} as const;

// Type guard helpers
export const isAuthRoute = (routeName: string): routeName is keyof AuthStackParamList => {
  return Object.values(Routes.auth).includes(routeName as any);
};

export const isMainRoute = (routeName: string): routeName is keyof MainStackParamList => {
  return Object.values(Routes.main).includes(routeName as any);
};

export const isRootRoute = (routeName: string): routeName is keyof RootStackParamList => {
  return Object.values(Routes.root).includes(routeName as any);
};