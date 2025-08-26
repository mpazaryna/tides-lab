import { useState, useCallback } from "react";
import {
  type FlowSessionSettings,
  type FlowIntensity,
  type FlowDuration,
  FLOW_SESSION_CONFIG,
  validateFlowSettings,
} from "../constants";

interface UseFlowSettingsReturn {
  settings: FlowSessionSettings;
  setIntensity: (intensity: FlowIntensity) => void;
  setDuration: (duration: FlowDuration) => void;
  updateSettings: (newSettings: Partial<FlowSessionSettings>) => void;
  resetSettings: () => void;
  isValid: boolean;
}

export function useFlowSettings(
  initialSettings?: Partial<FlowSessionSettings>
): UseFlowSettingsReturn {
  const [settings, setSettings] = useState<FlowSessionSettings>({
    intensity: 
      initialSettings?.intensity ?? FLOW_SESSION_CONFIG.DEFAULT_INTENSITY,
    duration: 
      initialSettings?.duration ?? FLOW_SESSION_CONFIG.DEFAULT_DURATION,
  });

  const setIntensity = useCallback((intensity: FlowIntensity) => {
    setSettings(prev => ({ ...prev, intensity }));
  }, []);

  const setDuration = useCallback((duration: FlowDuration) => {
    setSettings(prev => ({ ...prev, duration }));
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<FlowSessionSettings>) => {
      setSettings(prev => ({
        ...prev,
        ...newSettings,
      }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings({
      intensity: FLOW_SESSION_CONFIG.DEFAULT_INTENSITY,
      duration: FLOW_SESSION_CONFIG.DEFAULT_DURATION,
    });
  }, []);

  const isValid = validateFlowSettings(settings);

  return {
    settings,
    setIntensity,
    setDuration,
    updateSettings,
    resetSettings,
    isValid,
  };
}