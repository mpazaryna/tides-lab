import { useState, useEffect, useCallback, useRef } from "react";
import { FLOW_SESSION_CONFIG } from "../constants";

interface UseFlowTimerProps {
  isActive: boolean;
  startTime: Date | null;
  duration: number; // minutes
  onAutoEnd?: () => void;
}

interface UseFlowTimerReturn {
  elapsedTime: number;
  progress: number;
  formattedTime: string;
  resetTimer: () => void;
}

export function useFlowTimer({
  isActive,
  startTime,
  duration,
  onAutoEnd,
}: UseFlowTimerProps): UseFlowTimerReturn {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onAutoEndRef = useRef(onAutoEnd);

  // Keep onAutoEnd ref current
  useEffect(() => {
    onAutoEndRef.current = onAutoEnd;
  }, [onAutoEnd]);

  // Reset timer when not active
  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isActive || !startTime) {
      resetTimer();
      return;
    }

    // Calculate initial elapsed time
    const now = new Date();
    const initialElapsed = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000
    );
    setElapsedTime(initialElapsed);

    // Set up interval
    intervalRef.current = setInterval(() => {
      const currentTime = new Date();
      const newElapsed = Math.floor(
        (currentTime.getTime() - startTime.getTime()) / 1000
      );
      setElapsedTime(newElapsed);

      // Auto-end check
      if (
        FLOW_SESSION_CONFIG.AUTO_END_ENABLED &&
        newElapsed >= duration * 60 &&
        onAutoEndRef.current
      ) {
        onAutoEndRef.current();
      }
    }, FLOW_SESSION_CONFIG.TIMER_UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, startTime, duration, resetTimer]);

  // Memoized calculations
  const progress = isActive && duration > 0 
    ? Math.min((elapsedTime / (duration * 60)) * 100, 100)
    : 0;

  const formattedTime = (() => {
    const mins = Math.floor(elapsedTime / 60);
    const secs = elapsedTime % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  })();

  return {
    elapsedTime,
    progress,
    formattedTime,
    resetTimer,
  };
}