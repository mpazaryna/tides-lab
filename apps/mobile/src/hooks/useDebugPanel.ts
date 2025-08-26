import { useState, useCallback } from "react";
import { runBasicDebugTests, runEdgeCaseTests } from "../utils/debugUtils";

interface UseDebugPanelReturn {
  // State
  showDebugPanel: boolean;
  debugTestResults: string[];
  
  // Actions
  setShowDebugPanel: (show: boolean) => void;
  setDebugTestResults: (results: string[]) => void;
  runDebugTests: () => Promise<void>;
  testEdgeCases: () => Promise<void>;
}

interface UseDebugPanelProps {
  getCurrentServerUrl: () => string;
  currentEnvironment: string;
  isConnected: boolean;
  environments: Record<string, { name: string; url: string }>;
  switchEnvironment: (env: any) => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
}

export const useDebugPanel = ({
  getCurrentServerUrl,
  currentEnvironment,
  isConnected,
  environments,
  switchEnvironment,
  updateServerUrl,
}: UseDebugPanelProps): UseDebugPanelReturn => {
  // State management
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugTestResults, setDebugTestResults] = useState<string[]>([]);

  // Debug test functions for getCurrentServerUrl
  const runDebugTests = useCallback(async () => {
    const results = runBasicDebugTests({
      getCurrentServerUrl,
      currentEnvironment,
      isConnected,
      environments,
    });

    setDebugTestResults(results);
    setShowDebugPanel(true);
  }, [getCurrentServerUrl, currentEnvironment, isConnected, environments]);

  // Test edge cases
  const testEdgeCases = useCallback(async () => {
    const results = await runEdgeCaseTests({
      getCurrentServerUrl,
      currentEnvironment,
      isConnected,
      environments,
      switchEnvironment,
      updateServerUrl,
    });

    setDebugTestResults(results);
    setShowDebugPanel(true);
  }, [
    getCurrentServerUrl,
    currentEnvironment,
    isConnected,
    environments,
    switchEnvironment,
    updateServerUrl,
  ]);

  return {
    // State
    showDebugPanel,
    debugTestResults,
    
    // Actions
    setShowDebugPanel,
    setDebugTestResults,
    runDebugTests,
    testEdgeCases,
  };
};