/**
 * Insights Handler - Manages productivity insights requests
 */

import type { InsightsRequest, InsightsResponse } from '../types';
import type { MCPClient, AIAnalyzer } from '../services';
import type { TideFetcher } from '../utils';

export class InsightsHandler {
  private mcpClient: MCPClient;
  private aiAnalyzer: AIAnalyzer;
  private tideFetcher: TideFetcher;

  constructor(mcpClient: MCPClient, aiAnalyzer: AIAnalyzer, tideFetcher: TideFetcher) {
    this.mcpClient = mcpClient;
    this.aiAnalyzer = aiAnalyzer;
    this.tideFetcher = tideFetcher;
  }

  /**
   * Handle insights request
   */
  async handleRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json() as InsightsRequest;
      
      if (!body.userId) {
        return this.errorResponse('UserId is required', 400);
      }

      await this.generateInsights(body.userId, body.timeframe, body.tideIds);

      return this.successResponse({ success: true });

    } catch (error) {
      console.error('[InsightsHandler] Request failed:', error);
      return this.errorResponse('Failed to generate insights');
    }
  }

  /**
   * Generate productivity insights for user
   */
  async generateInsights(userId: string, timeframe: string = '7d', tideIds?: string[]): Promise<void> {
    try {
      // Get user's tides (specific IDs or all active)
      let tides;
      if (tideIds && tideIds.length > 0) {
        tides = await Promise.all(
          tideIds.map(id => this.tideFetcher.getTideById(id))
        );
        tides = tides.filter(tide => tide !== null);
      } else {
        tides = await this.tideFetcher.getActiveTides();
      }

      if (tides.length === 0) {
        console.warn(`[InsightsHandler] No tides found for user ${userId}`);
        return;
      }

      // Generate insights for each tide
      for (const tide of tides) {
        try {
          // Get productivity insights prompt
          const promptResponse = await this.mcpClient.getPrompt('productivity_insights', {
            tide_id: tide.id,
            time_period: timeframe,
            comparison_baseline: 'personal_average'
          });

          if (promptResponse.error) {
            console.error(`[InsightsHandler] MCP prompt error for tide ${tide.id}:`, promptResponse.error);
            continue;
          }

          if (!promptResponse.result?.messages) {
            console.warn(`[InsightsHandler] No messages in prompt response for tide ${tide.id}`);
            continue;
          }

          // Analyze with AI
          const analysis = await this.aiAnalyzer.runAnalysis(promptResponse.result.messages);

          console.log(`[InsightsHandler] Generated insights for tide ${tide.id} (confidence: ${analysis.confidence})`);

          // TODO: Store insights in agent storage for retrieval
          // TODO: Send notification if insights are actionable

        } catch (error) {
          console.error(`[InsightsHandler] Failed to generate insights for tide ${tide.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[InsightsHandler] Failed to generate insights:', error);
    }
  }

  /**
   * Create success response
   */
  private successResponse(data: any): Response {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Create error response
   */
  private errorResponse(message: string, status: number = 500): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}