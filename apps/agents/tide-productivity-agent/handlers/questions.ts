/**
 * Questions Handler - Manages custom user questions about productivity
 */

import type { QuestionRequest, QuestionResponse } from '../types';
import type { MCPClient, AIAnalyzer, WebSocketManager } from '../services';
import type { TideFetcher } from '../utils';

export class QuestionsHandler {
  private mcpClient: MCPClient;
  private aiAnalyzer: AIAnalyzer;
  private tideFetcher: TideFetcher;
  private webSocketManager: WebSocketManager;

  constructor(
    mcpClient: MCPClient, 
    aiAnalyzer: AIAnalyzer, 
    tideFetcher: TideFetcher,
    webSocketManager: WebSocketManager
  ) {
    this.mcpClient = mcpClient;
    this.aiAnalyzer = aiAnalyzer;
    this.tideFetcher = tideFetcher;
    this.webSocketManager = webSocketManager;
  }

  /**
   * Handle question request
   */
  async handleRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json() as QuestionRequest;
      
      if (!body.userId || !body.question) {
        return this.errorResponse('UserId and question are required', 400);
      }

      const result = await this.processQuestion(body.userId, body.question, body.tideId, body.context);

      return this.successResponse({
        success: result !== null,
        result,
        debug: {
          mcpServerInitialized: true,
          aiAvailable: this.aiAnalyzer.isAvailable(),
          tideId: body.tideId || 'auto-selected'
        }
      });

    } catch (error) {
      console.error('[QuestionsHandler] Request failed:', error);
      return this.errorResponse('Failed to process question');
    }
  }

  /**
   * Process user question and return analysis
   */
  async processQuestion(userId: string, question: string, tideId?: string, context?: string): Promise<any> {
    try {
      // Find relevant tide if not specified
      if (!tideId) {
        const relevantTideId = await this.tideFetcher.getMostRelevantTide(question);
        
        if (!relevantTideId) {
          console.log(`[QuestionsHandler] No relevant tide found, using general conversation`);
          return await this.handleGeneralConversation(userId, question, context);
        }
        
        tideId = relevantTideId;
      }

      console.log(`[QuestionsHandler] Processing question for user ${userId}, tide ${tideId}: ${question}`);

      // Get custom analysis prompt
      const promptResponse = await this.mcpClient.getPrompt('custom_tide_analysis', {
        tide_id: tideId,
        analysis_question: question,
        context: context || `User is asking: "${question}"`,
        output_format: 'actionable'
      });

      if (promptResponse.error) {
        console.error('[QuestionsHandler] MCP prompt error:', promptResponse.error);
        await this.sendErrorToUser(userId, question, promptResponse.error.message);
        return { 
          error: true, 
          message: promptResponse.error.message,
          tideId,
          question 
        };
      }

      if (!promptResponse.result?.messages) {
        await this.sendErrorToUser(userId, question, 'No prompt messages received');
        return { 
          error: true, 
          message: 'Invalid prompt response',
          tideId,
          question 
        };
      }

      console.log(`[QuestionsHandler] Got prompt with ${promptResponse.result.messages.length} messages`);

      // Validate analysis request
      const validation = this.aiAnalyzer.validateAnalysisRequest(promptResponse.result.messages);
      if (!validation.valid) {
        await this.sendErrorToUser(userId, question, validation.error || 'Invalid analysis request');
        return { 
          error: true, 
          message: validation.error || 'Invalid analysis request',
          tideId,
          question 
        };
      }

      // Analyze with AI
      const analysis = await this.aiAnalyzer.runAnalysis(promptResponse.result.messages);

      console.log(`[QuestionsHandler] AI analysis complete for question: ${question.substring(0, 50)}...`);

      // Send real-time response via WebSocket
      await this.webSocketManager.broadcastToUser(userId, {
        type: 'custom_analysis_result',
        question,
        tideId,
        analysis: analysis.response,
        confidence: analysis.confidence,
        actionable: analysis.actionable,
        priority: analysis.priority,
        timestamp: new Date().toISOString()
      });

      return {
        analysis: analysis.response,
        confidence: analysis.confidence,
        actionable: analysis.actionable,
        priority: analysis.priority,
        tideId,
        question
      };

    } catch (error) {
      console.error('[QuestionsHandler] Failed to process question:', error);
      
      await this.sendErrorToUser(userId, question, error instanceof Error ? error.message : 'Analysis failed');

      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        question
      };
    }
  }

  /**
   * Handle general conversation when no specific tides are found
   */
  async handleGeneralConversation(userId: string, question: string, _context?: string): Promise<any> {
    try {
      // Create a general productivity conversation prompt for Workers AI
      const conversationPrompt = [
        {
          role: "system",
          content: `You are a helpful productivity assistant for the Tides workflow management app. 
            
            You help users with:
            - Productivity tips and strategies
            - Time management advice 
            - Flow state and focus techniques
            - Energy management
            - Goal setting and planning
            - General workflow optimization

            Be conversational, helpful, and encouraging. All messages should be concise with clear points and clear asks.
            If users ask about specific features, explain how Tides can help them manage their workflows.`
        },
        {
          role: "user", 
          content: question
        }
      ];

      // Get AI response for general conversation
      const analysis = await this.aiAnalyzer.runAnalysis(conversationPrompt);

      // Send real-time response via WebSocket
      await this.webSocketManager.broadcastToUser(userId, {
        type: 'general_conversation_result',
        question,
        response: analysis.response,
        confidence: analysis.confidence,
        timestamp: new Date().toISOString()
      });

      return {
        message: analysis.response,
        confidence: analysis.confidence,
        actionable: analysis.actionable,
        conversationType: 'general',
        question
      };

    } catch (error) {
      console.error('[QuestionsHandler] Failed to handle general conversation:', error);
      
      // Fallback response if AI fails
      const fallbackResponse = this.getFallbackResponse(question);
      
      await this.webSocketManager.broadcastToUser(userId, {
        type: 'general_conversation_result',
        question,
        response: fallbackResponse,
        confidence: 0.5,
        timestamp: new Date().toISOString()
      });

      return {
        message: fallbackResponse,
        confidence: 0.5,
        actionable: true,
        conversationType: 'fallback',
        question
      };
    }
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('help') || lowerQuestion.includes('what') || lowerQuestion.includes('how')) {
      return "I'm here to help you with productivity and workflow management! I can provide tips on time management, focus techniques, and help you optimize your work sessions. What specific area would you like to improve?";
    }
    
    if (lowerQuestion.includes('productivity') || lowerQuestion.includes('focus')) {
      return "Great question about productivity! I recommend breaking your work into focused 25-minute sessions, tracking your energy levels, and reviewing what works best for you. Would you like specific tips for any particular type of work?";
    }
    
    if (lowerQuestion.includes('energy') || lowerQuestion.includes('tired')) {
      return "Energy management is crucial for productivity! Try tracking when you feel most energized during the day, take regular breaks, and match your most demanding tasks to your peak energy times. How has your energy been lately?";
    }
    
    return "Thanks for your question! I'm your productivity assistant and I'm here to help you work more effectively. I can provide advice on focus techniques, time management, energy optimization, and workflow strategies. What would you like to explore?";
  }

  /**
   * Send error message to user via WebSocket
   */
  private async sendErrorToUser(userId: string, question: string, error: string): Promise<void> {
    await this.webSocketManager.broadcastToUser(userId, {
      type: 'custom_analysis_error',
      question,
      error,
      timestamp: new Date().toISOString()
    });
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
    return new Response(JSON.stringify({ 
      error: message,
      details: 'Check agent logs for more information'
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}