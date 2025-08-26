import { useState, useCallback } from 'react';
import { mcpService } from '../services/mcpService';
import { loggingService } from '../services/loggingService';

export interface TideSession {
  duration: number;
  energy_level: number;
  completed_at: string;
  productivity_score: number;
  intensity?: string;
  work_context?: string;
}

export interface UserContext {
  energy_level: number;
  recent_sessions: TideSession[];
  preferences: {
    work_style?: string;
    [key: string]: any;
  };
}

export interface AIInsights {
  patterns: string[];
  recommendations: string[];
  energy_trends: string;
}

export interface AIAnalysisResult {
  success: boolean;
  analysis: string;
  insights: AIInsights;
  session_count: number;
  analysis_type: string;
}

export interface AISuggestionResult {
  success: boolean;
  suggestions: string;
  optimal_times: string[];
  confidence_score: number;
  current_energy: number;
  based_on_sessions: number;
}

/**
 * Custom hook for AI-powered features integration
 * Provides productivity analysis and flow suggestions using Workers AI
 */
export function useAIFeatures() {
  const [insights, setInsights] = useState<AIAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze productivity patterns using AI
   */
  const analyzeProductivity = useCallback(async (
    sessions: TideSession[],
    analysisDepth: 'quick' | 'detailed' = 'quick'
  ) => {
    if (!sessions?.length) {
      setError('No sessions available for analysis');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      loggingService.info('AI', 'Starting productivity analysis', {
        sessionCount: sessions.length,
        analysisDepth
      });

      const result = await mcpService.tool('ai_analyze_productivity', {
        sessions,
        analysis_depth: analysisDepth
      });

      loggingService.info('AI', 'Productivity analysis completed', { result });
      setInsights(result);
      return result;

    } catch (analysisError) {
      const errorMessage = analysisError instanceof Error 
        ? analysisError.message 
        : 'Failed to analyze productivity';
      
      loggingService.error('AI', 'Productivity analysis failed', { 
        error: analysisError,
        sessionCount: sessions.length 
      });
      
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Generate AI-powered flow session suggestions
   */
  const getFlowSuggestions = useCallback(async (userContext: UserContext) => {
    if (!userContext?.recent_sessions?.length) {
      setError('No recent sessions available for suggestions');
      return null;
    }

    setIsGeneratingSuggestions(true);
    setError(null);

    try {
      loggingService.info('AI', 'Generating flow suggestions', {
        energyLevel: userContext.energy_level,
        recentSessionsCount: userContext.recent_sessions.length
      });

      const result = await mcpService.tool('ai_suggest_flow_session', {
        user_context: userContext
      });

      loggingService.info('AI', 'Flow suggestions generated', { result });
      setSuggestions(result);
      return result;

    } catch (suggestionError) {
      const errorMessage = suggestionError instanceof Error 
        ? suggestionError.message 
        : 'Failed to generate flow suggestions';
      
      loggingService.error('AI', 'Flow suggestions failed', { 
        error: suggestionError,
        userContext 
      });
      
      setError(errorMessage);
      return null;
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);

  /**
   * Get AI session insights for a completed session
   */
  const getSessionInsights = useCallback(async (
    sessionData: any,
    recentSessions?: TideSession[]
  ) => {
    setError(null);

    try {
      loggingService.info('AI', 'Getting session insights', { sessionData });

      const result = await mcpService.tool('ai_session_insights', {
        session_data: sessionData,
        recent_sessions: recentSessions || []
      });

      loggingService.info('AI', 'Session insights retrieved', { result });
      return result;

    } catch (insightError) {
      const errorMessage = insightError instanceof Error 
        ? insightError.message 
        : 'Failed to get session insights';
      
      loggingService.error('AI', 'Session insights failed', { 
        error: insightError,
        sessionData 
      });
      
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Predict energy levels for future times
   */
  const predictEnergy = useCallback(async (
    historicalData: any[],
    futureTimestamp: string
  ) => {
    setError(null);

    try {
      loggingService.info('AI', 'Predicting energy levels', {
        dataPoints: historicalData.length,
        futureTimestamp
      });

      const result = await mcpService.tool('ai_predict_energy', {
        historical_data: historicalData,
        future_timestamp: futureTimestamp
      });

      loggingService.info('AI', 'Energy prediction completed', { result });
      return result;

    } catch (predictionError) {
      const errorMessage = predictionError instanceof Error 
        ? predictionError.message 
        : 'Failed to predict energy levels';
      
      loggingService.error('AI', 'Energy prediction failed', { 
        error: predictionError,
        historicalData: historicalData.length 
      });
      
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Clear current AI state
   */
  const clearAIState = useCallback(() => {
    setInsights(null);
    setSuggestions(null);
    setError(null);
  }, []);

  return {
    // State
    insights,
    suggestions,
    isAnalyzing,
    isGeneratingSuggestions,
    error,
    
    // Actions
    analyzeProductivity,
    getFlowSuggestions,
    getSessionInsights,
    predictEnergy,
    clearAIState
  };
}