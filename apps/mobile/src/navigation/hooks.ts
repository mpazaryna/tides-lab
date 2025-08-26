// Type-safe navigation hooks for React Navigation

import React from 'react';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { 
  RootStackParamList, 
  MainStackParamList, 
  AuthStackParamList,
  Routes 
} from './types';

// Root navigation hooks
export function useRootNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

export function useRootRoute<RouteName extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, RouteName>>();
}

// Main stack navigation hooks
export function useMainNavigation() {
  return useNavigation<NavigationProp<MainStackParamList>>();
}

export function useMainRoute<RouteName extends keyof MainStackParamList>() {
  return useRoute<RouteProp<MainStackParamList, RouteName>>();
}

// Auth stack navigation hooks
export function useAuthNavigation() {
  return useNavigation<NavigationProp<AuthStackParamList>>();
}

export function useAuthRoute<RouteName extends keyof AuthStackParamList>() {
  return useRoute<RouteProp<AuthStackParamList, RouteName>>();
}

// Typed navigation actions
export function useTypedNavigation() {
  const rootNavigation = useRootNavigation();
  const mainNavigation = useMainNavigation();
  const authNavigation = useAuthNavigation();

  return {
    // Root level navigation
    toAuth: () => (rootNavigation as any).navigate(Routes.root.auth),
    toMain: () => (rootNavigation as any).navigate(Routes.root.main),
    
    // Auth navigation
    toInitial: () => authNavigation.navigate(Routes.auth.initial),
    toCreateAccount: () => authNavigation.navigate(Routes.auth.createAccount),
    toAuthLoading: (params?: { email?: string }) => 
      authNavigation.navigate({ name: Routes.auth.authLoading, params: params || {} }),
    
    // Main navigation
    toHome: () => (mainNavigation as any).navigate(Routes.main.home),
    toServer: () => mainNavigation.navigate(Routes.main.server),
    toMcp: () => mainNavigation.navigate(Routes.main.mcp),
    toSettings: () => mainNavigation.navigate(Routes.main.settings),
    toTidesList: () => mainNavigation.navigate(Routes.main.tidesList),
    toTide: (params: { tideId: string; tideName?: string }) => 
      mainNavigation.navigate(Routes.main.tide, params),
    toTideDetails: (params: { tideId: string; mode?: 'view' | 'edit' }) => 
      mainNavigation.navigate(Routes.main.tideDetails, params),
    toFlowSession: (params: { tideId: string; sessionId?: string }) => 
      mainNavigation.navigate(Routes.main.flowSession, params),
    toProfile: () => mainNavigation.navigate(Routes.main.profile),
    toAbout: () => mainNavigation.navigate(Routes.main.about),
    
    // Common actions
    goBack: () => {
      if (rootNavigation.canGoBack()) {
        rootNavigation.goBack();
      }
    },
    
    reset: (routeName: keyof RootStackParamList) => {
      rootNavigation.reset({
        index: 0,
        routes: [{ name: routeName }],
      });
    },
  };
}

// Screen parameter hooks for easy access to route params
export function useTideParams() {
  const route = useMainRoute<'Tide'>();
  return route.params;
}

export function useTideDetailsParams() {
  const route = useMainRoute<'TideDetails'>();
  return route.params;
}

export function useFlowSessionParams() {
  const route = useMainRoute<'FlowSession'>();
  return route.params;
}

export function useAuthLoadingParams() {
  const route = useAuthRoute<'AuthLoading'>();
  return route.params;
}

// Navigation state helpers
export function useNavigationState() {
  const rootNavigation = useRootNavigation();
  
  return {
    currentRoute: rootNavigation.getState()?.routes[rootNavigation.getState()?.index || 0]?.name,
    canGoBack: rootNavigation.canGoBack(),
    navigationState: rootNavigation.getState(),
  };
}

// Focus and blur event hooks
export function useScreenFocus(callback: () => void) {
  const navigation = useRootNavigation();
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', callback);
    return unsubscribe;
  }, [navigation, callback]);
}

export function useScreenBlur(callback: () => void) {
  const navigation = useRootNavigation();
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', callback);
    return unsubscribe;
  }, [navigation, callback]);
}

// Screen lifecycle hooks
export function useScreenLifecycle(
  onFocus?: () => void,
  onBlur?: () => void
) {
  const navigation = useRootNavigation();
  
  React.useEffect(() => {
    const unsubscribeFocus = onFocus 
      ? navigation.addListener('focus', onFocus)
      : undefined;
      
    const unsubscribeBlur = onBlur 
      ? navigation.addListener('blur', onBlur)
      : undefined;
    
    return () => {
      unsubscribeFocus?.();
      unsubscribeBlur?.();
    };
  }, [navigation, onFocus, onBlur]);
}

// Safe navigation hook that checks if routes exist
export function useSafeNavigation() {
  const navigation = useTypedNavigation();
  
  return {
    ...navigation,
    
    safeNavigate: (routeName: string, params?: any) => {
      try {
        // Type assertion since we're doing runtime checking
        (navigation as any).navigate(routeName, params);
      } catch (error) {
        console.warn(`Failed to navigate to ${routeName}:`, error);
      }
    },
  };
}