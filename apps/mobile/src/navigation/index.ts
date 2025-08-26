// Navigation barrel exports for easy importing

// Components
export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './AuthNavigator';
export { default as MainNavigator } from './MainNavigator';

// Types
export type {
  RootStackParamList,
  MainStackParamList,
  AuthStackParamList,
  AuthStackScreenProps,
  MainStackScreenProps,
  RootStackScreenProps,
  HomeScreenProps,
  TideScreenProps,
  TideDetailsScreenProps,
  FlowSessionScreenProps,
  SettingsScreenProps,
  InitialScreenProps,
  CreateAccountScreenProps,
  AllStackParamList,
} from './types';

export {
  ScreenNames,
  Routes,
  NavigationOptions,
  isAuthRoute,
  isMainRoute,
  isRootRoute,
} from './types';

// Hooks
export {
  useRootNavigation,
  useRootRoute,
  useMainNavigation,
  useMainRoute,
  useAuthNavigation,
  useAuthRoute,
  useTypedNavigation,
  useTideParams,
  useTideDetailsParams,
  useFlowSessionParams,
  useAuthLoadingParams,
  useNavigationState,
  useScreenFocus,
  useScreenBlur,
  useScreenLifecycle,
  useSafeNavigation,
} from './hooks';

// Backwards compatibility exports
export type { AuthNavigationParams } from './AuthNavigator';