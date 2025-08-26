/**
 * Optimize Handler - Manages schedule optimization requests
 */

import type { OptimizeRequest, OptimizeResponse, Optimization } from '../types';
import type { MCPClient, AIAnalyzer } from '../services';
import type { TideFetcher } from '../utils';

export class OptimizeHandler {
  private mcpClient: MCPClient;
  private aiAnalyzer: AIAnalyzer;
  private tideFetcher: TideFetcher;

  constructor(mcpClient: MCPClient, aiAnalyzer: AIAnalyzer, tideFetcher: TideFetcher) {
    this.mcpClient = mcpClient;
    this.aiAnalyzer = aiAnalyzer;
    this.tideFetcher = tideFetcher;
  }

  /**
   * Handle optimization request
   */
  async handleRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json() as OptimizeRequest;
      
      if (!body.userId || !body.preferences) {
        return this.errorResponse('UserId and preferences are required', 400);
      }

      const optimizations = await this.optimizeSchedule(body.userId, body.preferences, body.tideIds);

      return this.successResponse({ 
        success: true, 
        optimizations 
      });

    } catch (error) {
      console.error('[OptimizeHandler] Request failed:', error);
      return this.errorResponse('Failed to optimize schedule');
    }
  }

  /**
   * Optimize user schedule based on preferences
   */
  async optimizeSchedule(userId: string, preferences: any, tideIds?: string[]): Promise<Optimization[]> {
    try {
      // Get user's tides
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
        console.warn(`[OptimizeHandler] No tides found for user ${userId}`);
        return [];
      }

      // Generate optimizations for each tide
      const optimizations = await Promise.allSettled(
        tides.map(tide => this.optimizeTide(tide.id, preferences))
      );

      return optimizations.map((result, index) => {
        const tideId = tides[index].id;
        
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`[OptimizeHandler] Optimization failed for tide ${tideId}:`, result.reason);
          return {
            tideId,
            recommendations: `Optimization failed: ${result.reason?.message || 'Unknown error'}`,
            confidence: 0,
            error: result.reason?.message || 'Unknown error'
          };
        }
      });

    } catch (error) {
      console.error('[OptimizeHandler] Failed to optimize schedule:', error);
      return [];
    }
  }

  /**
   * Optimize a specific tide
   */
  private async optimizeTide(tideId: string, preferences: any): Promise<Optimization> {
    try {
      // Get energy optimization prompt
      const promptResponse = await this.mcpClient.getPrompt('optimize_energy', {
        tide_id: tideId,
        target_schedule: preferences.preferredTimeBlocks,
        energy_goals: preferences.energyGoals?.join(',') || ''
      });

      if (promptResponse.error) {
        throw new Error(`MCP prompt error: ${promptResponse.error.message}`);
      }

      if (!promptResponse.result?.messages) {
        throw new Error('No messages in prompt response');
      }

      // Analyze with AI
      const analysis = await this.aiAnalyzer.runAnalysis(promptResponse.result.messages);

      const optimization: Optimization = {
        tideId,
        recommendations: analysis.response,
        confidence: analysis.confidence
      };

      // Auto-implement high-confidence recommendations if enabled
      if (preferences.autoImplement && 
          analysis.confidence > (preferences.confidenceThreshold || 0.8)) {
        await this.autoImplementOptimization(tideId, optimization);
        optimization.autoImplemented = true;
      }

      console.log(`[OptimizeHandler] Generated optimization for tide ${tideId} (confidence: ${analysis.confidence})`);

      return optimization;

    } catch (error) {
      console.error(`[OptimizeHandler] Failed to optimize tide ${tideId}:`, error);
      
      return {
        tideId,
        recommendations: `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Auto-implement optimization (placeholder)
   */
  private async autoImplementOptimization(tideId: string, optimization: Optimization): Promise<void> {
    console.log(`[OptimizeHandler] Auto-implementing optimization for tide ${tideId}`);
    
    // TODO: Implement actual schedule changes
    // This would involve calling MCP tools to update tide settings
    // For now, just log the action
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