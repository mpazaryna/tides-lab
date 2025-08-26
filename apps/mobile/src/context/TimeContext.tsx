import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useContextTide } from "../hooks/useContextTide";

export type TimeContextType = "daily" | "weekly" | "monthly" | "project";

interface TimeContextValue {
  currentContext: TimeContextType;
  setCurrentContext: (context: TimeContextType) => void;
  dateOffset: number;
  setDateOffset: (offset: number) => void;
  navigateBackward: () => void;
  navigateForward: () => void;
  resetToPresent: () => void;
  isAtPresent: boolean;
  // Context-aware tide integration
  contextSwitchingDisabled: boolean;
  getCurrentContextTideId: () => string | null;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

interface TimeContextProviderProps {
  children: ReactNode;
}

export const TimeContextProvider: React.FC<TimeContextProviderProps> = ({
  children,
}) => {
  const [currentContext, setCurrentContext] = useState<TimeContextType>("daily");
  const [dateOffset, setDateOffsetState] = useState<number>(0);
  
  // Integration with context tide system
  const {
    switchContext,
    contextSwitchingDisabled,
    getCurrentContextTideId,
  } = useContextTide();

  // Navigation functions
  const navigateBackward = useCallback(() => {
    setDateOffsetState(prev => prev + 1);
  }, []);

  const navigateForward = useCallback(() => {
    setDateOffsetState(prev => Math.max(0, prev - 1));
  }, []);

  const resetToPresent = useCallback(() => {
    setDateOffsetState(0);
  }, []);

  const setDateOffset = useCallback((offset: number) => {
    // Ensure offset can't be negative (no future dates)
    setDateOffsetState(Math.max(0, offset));
  }, []);

  // Enhanced context switching with tide system integration
  const setCurrentContextWithReset = useCallback((context: TimeContextType) => {
    // Handle project type separately (existing functionality)
    if (context === 'project') {
      setCurrentContext(context);
      setDateOffsetState(0);
      return;
    }

    // For daily/weekly/monthly: Switch UI immediately, sync in background
    setCurrentContext(context);
    setDateOffsetState(0);
    
    // Background sync with tide system (non-blocking)
    switchContext(context as 'daily' | 'weekly' | 'monthly').catch(error => {
      console.error('Failed to switch tide context:', error);
      // UI is already switched, so this is just logging for now
      // Could add error recovery here if needed
    });
  }, [switchContext]);

  const isAtPresent = dateOffset === 0;

  const value: TimeContextValue = {
    currentContext,
    setCurrentContext: setCurrentContextWithReset,
    dateOffset,
    setDateOffset,
    navigateBackward,
    navigateForward,
    resetToPresent,
    isAtPresent,
    // Context-aware tide integration
    contextSwitchingDisabled,
    getCurrentContextTideId,
  };

  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTimeContext = (): TimeContextValue => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error("useTimeContext must be used within a TimeContextProvider");
  }
  return context;
};