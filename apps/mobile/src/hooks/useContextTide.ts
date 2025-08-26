import { useState, useCallback, useEffect } from 'react';
import { useDailyTide } from './useDailyTide';
import { mcpService } from '../services/mcpService';
import { loggingService } from '../services/loggingService';

type TideContext = 'daily' | 'weekly' | 'monthly';

interface ContextTide {
  id: string;
  name: string;
  context: TideContext;
  created_at: string;
  status: 'active';
}

interface UseContextTideReturn {
  // Current state
  currentContext: TideContext;
  currentContextTide: ContextTide | null;
  isToolExecuting: boolean;
  contextSwitchingDisabled: boolean;
  
  // Context operations
  switchContext: (newContext: TideContext) => Promise<void>;
  getCurrentContextTideId: () => string | null;
  
  // Tool execution state
  setToolExecuting: (executing: boolean) => void;
}

export const useContextTide = (): UseContextTideReturn => {
  // State management
  const [currentContext, setCurrentContext] = useState<TideContext>('daily');
  const [currentContextTide, setCurrentContextTide] = useState<ContextTide | null>(null);
  const [isToolExecuting, setIsToolExecuting] = useState(false);
  
  // Get daily tide (always exists)
  const { dailyTide, isReady: dailyTideReady } = useDailyTide();
  
  // Context switching disabled during tool execution
  const contextSwitchingDisabled = isToolExecuting;
  
  // Get or create context tide
  const getOrCreateContextTide = useCallback(async (context: TideContext): Promise<ContextTide> => {
    try {
      loggingService.info('useContextTide', `Getting/creating ${context} tide`);
      
      let response;
      switch (context) {
        case 'daily':
          // Daily tide always exists via useDailyTide
          if (dailyTide) {
            return {
              id: dailyTide.id,
              name: dailyTide.name,
              context: 'daily',
              created_at: dailyTide.created_at,
              status: 'active'
            };
          }
          throw new Error('Daily tide not available');
          
        case 'weekly':
          response = await mcpService.callTool('tide_switch_context', {
            context: 'weekly',
            create_if_missing: true,
          });
          break;
          
        case 'monthly':
          response = await mcpService.callTool('tide_switch_context', {
            context: 'monthly', 
            create_if_missing: true,
          });
          break;
      }
      
      if (response?.success && response?.tide) {
        return {
          id: response.tide.id,
          name: response.tide.name,
          context,
          created_at: response.tide.created_at,
          status: 'active'
        };
      }
      
      throw new Error(`Failed to get/create ${context} tide`);
    } catch (error) {
      loggingService.error('useContextTide', `Failed to get/create ${context} tide`, { error });
      throw error;
    }
  }, [dailyTide]);
  
  // Switch context (disabled during tool execution)
  const switchContext = useCallback(async (newContext: TideContext) => {
    if (isToolExecuting) {
      loggingService.warn('useContextTide', 'Context switching disabled during tool execution');
      return;
    }
    
    const previousContext = currentContext;
    const previousContextTide = currentContextTide;
    
    try {
      loggingService.info('useContextTide', `Switching to ${newContext} context`);
      
      // Optimistic update - switch UI immediately
      setCurrentContext(newContext);
      
      // Create optimistic tide object for immediate UI feedback
      const optimisticTide: ContextTide = {
        id: `temp-${newContext}-${Date.now()}`,
        name: `${newContext.charAt(0).toUpperCase() + newContext.slice(1)} Tide`,
        context: newContext,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      setCurrentContextTide(optimisticTide);
      
      // Get actual context tide from server
      const contextTide = await getOrCreateContextTide(newContext);
      
      // Replace optimistic data with real data
      setCurrentContextTide(contextTide);
      
      loggingService.info('useContextTide', `Successfully switched to ${newContext} context`, {
        tideId: contextTide.id,
        tideName: contextTide.name
      });
    } catch (error) {
      loggingService.error('useContextTide', `Failed to switch to ${newContext} context`, { error });
      
      // Rollback to previous context on error
      setCurrentContext(previousContext);
      setCurrentContextTide(previousContextTide);
    }
  }, [isToolExecuting, getOrCreateContextTide, currentContext, currentContextTide]);
  
  // Get current context tide ID
  const getCurrentContextTideId = useCallback((): string | null => {
    return currentContextTide?.id || null;
  }, [currentContextTide]);
  
  // Set tool execution state
  const setToolExecuting = useCallback((executing: boolean) => {
    setIsToolExecuting(executing);
    loggingService.info('useContextTide', `Tool execution state: ${executing ? 'started' : 'stopped'}`);
  }, []);
  
  // Initialize with daily context on mount
  useEffect(() => {
    if (dailyTideReady && dailyTide && !currentContextTide) {
      setCurrentContext('daily');
      setCurrentContextTide({
        id: dailyTide.id,
        name: dailyTide.name,
        context: 'daily',
        created_at: dailyTide.created_at,
        status: 'active'
      });
    }
  }, [dailyTideReady, dailyTide, currentContextTide]);
  
  // Reset to daily context on app restart (useEffect runs once)
  useEffect(() => {
    loggingService.info('useContextTide', 'App started - defaulting to daily context');
  }, []);
  
  return {
    // Current state
    currentContext,
    currentContextTide,
    isToolExecuting,
    contextSwitchingDisabled,
    
    // Context operations
    switchContext,
    getCurrentContextTideId,
    
    // Tool execution state
    setToolExecuting,
  };
};