import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

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

  // Reset offset when context changes
  const setCurrentContextWithReset = useCallback((context: TimeContextType) => {
    setCurrentContext(context);
    setDateOffsetState(0);
  }, []);

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