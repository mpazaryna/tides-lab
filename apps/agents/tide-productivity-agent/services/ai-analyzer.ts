/**
 * AI Analyzer Service - Handles Workers AI integration and analysis
 */

import type { AnalysisResult } from '../types';
import { parseConfidenceScore, hasActionableRecommendations, calculateInsightPriority } from '../utils';

export class AIAnalyzer {
  private aiBinding: any;

  constructor(aiBinding: any) {
    this.aiBinding = aiBinding;
  }

  /**
   * Run AI analysis using Workers AI
   */
  async runAnalysis(messages: any[], model: string = '@cf/meta/llama-3-8b-instruct'): Promise<AnalysisResult> {
    // TODO: Add request rate limiting to prevent API abuse
    // TODO: Implement request timeout handling
    // TODO: Add cost tracking for AI usage
    try {
      if (!this.aiBinding) {
        // TODO: Implement fallback analysis method when AI binding unavailable
        throw new Error('AI binding not available');
      }

      const aiResponse = await this.aiBinding.run(model, {
        messages: messages
      });

      const responseText = aiResponse.response || aiResponse;
      
      return {
        response: responseText,
        confidence: parseConfidenceScore(responseText),
        actionable: hasActionableRecommendations(responseText),
        priority: calculateInsightPriority(responseText)
      };

    } catch (error) {
      console.error('[AIAnalyzer] AI analysis failed:', error);
      
      return {
        response: `Analysis temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        actionable: false,
        priority: 1
      };
    }
  }

  /**
   * Run multiple analyses in parallel
   */
  async runBatchAnalysis(analysisRequests: { messages: any[]; context?: string }[]): Promise<AnalysisResult[]> {
    try {
      const analyses = await Promise.allSettled(
        analysisRequests.map(request => this.runAnalysis(request.messages))
      );

      return analyses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`[AIAnalyzer] Batch analysis ${index} failed:`, result.reason);
          return {
            response: `Analysis failed: ${result.reason?.message || 'Unknown error'}`,
            confidence: 0,
            actionable: false,
            priority: 1
          };
        }
      });

    } catch (error) {
      console.error('[AIAnalyzer] Batch analysis failed:', error);
      
      // Return error result for each request
      return analysisRequests.map(() => ({
        response: `Batch analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        actionable: false,
        priority: 1
      }));
    }
  }

  /**
   * Check if AI binding is available
   */
  isAvailable(): boolean {
    return this.aiBinding !== undefined && this.aiBinding !== null;
  }

  /**
   * Get available AI models (if supported by the binding)
   */
  getAvailableModels(): string[] {
    // Standard Cloudflare Workers AI models
    // TODO: Query actual available models from Workers AI API
    // TODO: Add model performance metrics and recommendations
    return [
      '@cf/meta/llama-3-8b-instruct',
      '@cf/meta/llama-2-7b-chat-int8',
      '@cf/microsoft/resnet-50'
    ];
  }

  /**
   * Validate analysis request
   */
  validateAnalysisRequest(messages: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(messages)) {
      return { valid: false, error: 'Messages must be an array' };
    }

    if (messages.length === 0) {
      return { valid: false, error: 'Messages array cannot be empty' };
    }

    for (const message of messages) {
      if (!message.role || !message.content) {
        return { valid: false, error: 'Each message must have role and content' };
      }
    }

    return { valid: true };
  }
}