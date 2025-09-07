/**
 * Chat Service - AI-Powered Implementation
 * Handles intent clarification and response enhancement
 */

import type { Env, ChatRequest, ChatResponse } from '../types.js';
import { ServiceInferrer } from '../service-inferrer.js';
import { InsightsService } from './insights.js';
import { OptimizeService } from './optimize.js';
import { QuestionsService } from './questions.js';
import { PreferencesService } from './preferences.js';
import { ReportsService } from './reports.js';

export class ChatService {
  private env: Env;
  private readonly CONFIDENCE_THRESHOLD = 70;
  
  // Service instances for routing
  private insightsService: InsightsService;
  private optimizeService: OptimizeService;
  private questionsService: QuestionsService;
  private preferencesService: PreferencesService;
  private reportsService: ReportsService;

  constructor(env: Env) {
    this.env = env;
    
    // Initialize services for routing
    this.insightsService = new InsightsService(env);
    this.optimizeService = new OptimizeService(env);
    this.questionsService = new QuestionsService(env);
    this.preferencesService = new PreferencesService(env);
    this.reportsService = new ReportsService(env);
  }

  /**
   * Check if a request needs clarification based on confidence score
   */
  needsClarification(confidence: number): boolean {
    return confidence < this.CONFIDENCE_THRESHOLD;
  }

  /**
   * Process chat request - provide conversational responses with selective service routing
   * Prioritizes conversation over service routing for natural interaction
   */
  async clarifyIntent(request: ChatRequest, userId: string): Promise<ChatResponse> {
    try {
      // Check if this is clearly a direct service request (high confidence only)
      if (this.env.AI) {
        const serviceInference = await this.inferServiceWithAI(request);
        
        // Only route to services for very explicit, high-confidence requests
        if (serviceInference && serviceInference.service !== 'chat' && serviceInference.confidence > 85) {
          // Check if this is a direct service command vs conversational question
          const message = request.message?.toLowerCase() || '';
          const isDirectServiceRequest = 
            message.includes('generate') || 
            message.includes('create') || 
            message.includes('update') ||
            message.includes('run') ||
            message.startsWith('get ') ||
            message.startsWith('show me');
          
          if (isDirectServiceRequest) {
            return await this.routeToService(serviceInference.service, request, userId);
          }
        }
      }
      
      // Default to conversational AI response for natural interaction
      return await this.generateConversationalResponse(request, userId);
    } catch (error) {
      console.error('[ChatService] Processing failed, using fallback:', error);
      return this.clarifyIntentFallback(request, userId);
    }
  }

  /**
   * Generate conversational AI response for natural chat interaction
   */
  private async generateConversationalResponse(request: ChatRequest, userId: string): Promise<ChatResponse> {
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      // Try to get tide context if tide_id is provided
      let tideContext = '';
      if (request.tides_id && request.tides_id !== 'daily-tide-default') {
        try {
          const storage = new (await import('../storage.js')).StorageService(this.env);
          const tideData = await storage.getTideDataFromAnySource(userId, request.tides_id);
          
          if (tideData) {
            const sessions = tideData.flow_sessions || [];
            const energy = tideData.energy_updates || [];
            const tasks = tideData.task_links || [];
            
            tideContext = `\n\nContext about their current tide "${tideData.name}":
- Flow sessions: ${sessions.length} sessions
- Energy updates: ${energy.length} updates  
- Linked tasks: ${tasks.length} tasks
- Most recent activity: ${this.getRecentActivitySummary(sessions, energy, tasks)}`;
          }
        } catch (error) {
          console.log('[ChatService] Could not fetch tide context:', error);
          // Continue without tide context
        }
      }
      
      if (this.env.AI) {
        // Create a conversational prompt that can discuss productivity intelligently
        const conversationalPrompt = `You are a productivity coach having a conversation with a user about their work patterns and productivity. 

User's question: "${request.message}"${tideContext}

Guidelines:
- Provide thoughtful, conversational responses
- If you have tide context, reference their actual activity data naturally
- If asked about insights or analysis, discuss what you can see from their data
- Ask follow-up questions to understand their needs better
- Give practical advice and suggestions based on their actual patterns
- Keep responses concise but helpful (2-3 sentences)
- Be encouraging and supportive
- Don't just repeat the same information

Respond naturally as if you're having a real conversation with someone about their productivity, using their actual data when available.`;

        const aiResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: 'You are a helpful productivity coach having a natural conversation.' },
            { role: 'user', content: conversationalPrompt }
          ],
          max_tokens: 250
        });

        const responseText = aiResponse.response?.trim() || "I'm here to help with your productivity questions. What would you like to discuss?";
        
        return {
          needs_clarification: false,
          message: responseText,
          conversation_id: conversationId
        };
      }
    } catch (error) {
      console.error('[ChatService] AI conversational response failed:', error);
    }
    
    // Fallback conversational responses
    return this.generateFallbackConversationalResponse(request, conversationId);
  }

  /**
   * Get a summary of recent activity from tide data
   */
  private getRecentActivitySummary(sessions: any[], energy: any[], tasks: any[]): string {
    const activities = [];
    
    if (sessions.length > 0) {
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      activities.push(`${totalMinutes} minutes of focused work`);
    }
    
    if (energy.length > 0) {
      const recent = energy[energy.length - 1];
      activities.push(`latest energy level: ${recent.energy_level || 'unknown'}`);
    }
    
    if (tasks.length > 0) {
      const taskTypes = [...new Set(tasks.map(t => t.task_type))];
      activities.push(`working on ${taskTypes.join(', ')} tasks`);
    }
    
    return activities.length > 0 ? activities.join(', ') : 'no recent activity';
  }

  /**
   * Generate fallback conversational responses when AI is unavailable
   */
  private generateFallbackConversationalResponse(request: ChatRequest, conversationId: string): ChatResponse {
    const message = request.message?.toLowerCase() || '';
    
    // Provide context-aware fallback responses
    if (message.includes('insight') || message.includes('analysis')) {
      return {
        needs_clarification: false,
        message: "I'd be happy to discuss insights about your work patterns! What specific aspect of your productivity would you like to explore? Are you looking for patterns in your focus sessions, energy levels, or task completion?",
        conversation_id: conversationId
      };
    }
    
    if (message.includes('adjust') || message.includes('improve')) {
      return {
        needs_clarification: false,
        message: "There's always room for improvement! What area of your productivity feels like it needs the most attention right now? Focus time, energy management, or task organization?",
        conversation_id: conversationId
      };
    }
    
    if (message.includes('honest') || message.includes('think')) {
      return {
        needs_clarification: false,
        message: "I appreciate you wanting an honest perspective! Based on productivity research, consistency and self-awareness are key. What patterns have you noticed in your own work habits that you'd like to discuss?",
        conversation_id: conversationId
      };
    }
    
    // Default conversational response
    return {
      needs_clarification: false,
      message: "I'm here to chat about your productivity and work patterns. What's on your mind? Whether it's about focus, scheduling, or just reflecting on how things are going - I'm happy to discuss it!",
      conversation_id: conversationId
    };
  }

  /**
   * Fallback clarification when AI is not available
   */
  private async clarifyIntentFallback(request: ChatRequest, userId: string): Promise<ChatResponse> {
    // Generate conversation ID if not provided
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      needs_clarification: true,
      message: "I'd be happy to help! Could you tell me more about what you need?",
      suggestions: this.generateContextualSuggestions(request),
      conversation_id: conversationId
    };
  }

  /**
   * Infer service using AI (similar to ServiceInferrer but for chat context)
   */
  private async inferServiceWithAI(request: ChatRequest): Promise<{ service: string; confidence: number }> {
    const message = request.message || request.question || '';
    
    if (!message || message.length < 3) {
      return { service: 'chat', confidence: 30 };
    }

    try {
      const prompt = `Classify this user request into one of these services:

SERVICES:
- insights: productivity analytics, energy patterns, "how productive was I", performance data
- optimize: schedule optimization, "when should I work", time management
- questions: general productivity questions, advice, tips
- preferences: settings, work hours, notification preferences
- reports: comprehensive reports, data exports, summaries
- chat: unclear/ambiguous requests needing clarification

USER REQUEST: "${message}"

Respond with ONLY the service name.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1
      });

      const aiService = response.response?.trim().toLowerCase() || 'chat';
      const validServices = ['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat'];
      const finalService = validServices.includes(aiService) ? aiService : 'chat';
      
      // Calculate confidence based on message clarity and length
      let confidence = finalService === 'chat' ? 30 : 75;
      if (message.length > 20 && finalService !== 'chat') confidence = 85;
      
      return { service: finalService, confidence };

    } catch (error) {
      console.error('[ChatService] AI service inference failed:', error);
      return { service: 'chat', confidence: 30 };
    }
  }

  /**
   * Route request to appropriate service and return chat-formatted response
   */
  private async routeToService(serviceName: string, request: ChatRequest, userId: string): Promise<ChatResponse> {
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      let serviceResult: any;
      
      // Convert ChatRequest to appropriate service request format
      const serviceRequest = {
        api_key: request.api_key || '',
        tides_id: request.tides_id || 'daily-tide-default',
        message: request.message,
        question: request.question || request.message,
        timeframe: request.timeframe || 'today',
        ...request.context
      };

      switch (serviceName) {
        case 'insights':
          serviceResult = await this.insightsService.generateInsights(serviceRequest, userId);
          break;
        case 'optimize':
          serviceResult = await this.optimizeService.optimizeSchedule(serviceRequest, userId);
          break;
        case 'questions':
          const questionsReq = {
            ...serviceRequest,
            question: serviceRequest.question || serviceRequest.message || 'General productivity question'
          };
          serviceResult = await this.questionsService.processQuestion(questionsReq, userId, request.api_key || '');
          break;
        case 'preferences':
          if (serviceRequest.preferences) {
            serviceResult = await this.preferencesService.updatePreferences(serviceRequest, userId);
          } else {
            serviceResult = await this.preferencesService.getPreferences(userId);
          }
          break;
        case 'reports':
          const reportsReq = {
            ...serviceRequest,
            report_type: 'summary' as const
          };
          serviceResult = await this.reportsService.generateReport(reportsReq, userId);
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      // Convert service result to chat response format
      return {
        needs_clarification: false,
        message: this.formatServiceResultAsMessage(serviceResult, serviceName),
        service_result: serviceResult,
        conversation_id: conversationId,
        routed_to: serviceName
      };

    } catch (error) {
      console.error(`[ChatService] Service routing to ${serviceName} failed:`, error);
      
      // Fallback to clarification on service errors
      return {
        needs_clarification: true,
        message: `I'd like to help with your ${serviceName} request, but I'm having trouble processing it right now. Could you please rephrase your question?`,
        suggestions: [`Try asking about ${serviceName} in a different way`, 'Check if your request has all necessary details'],
        conversation_id: conversationId,
        error: `Service ${serviceName} failed`
      };
    }
  }

  /**
   * Format service result as a conversational message
   */
  private formatServiceResultAsMessage(result: any, serviceName: string): string {
    if (!result) return "I processed your request, but didn't get any results back.";
    
    switch (serviceName) {
      case 'insights':
        if (result.productivity_score !== undefined) {
          const score = result.productivity_score;
          let message = `Your productivity score is ${score}`;
          
          if (result.trends?.daily_average) {
            message += ` (daily average: ${result.trends.daily_average})`;
          }
          
          if (result.improvement_areas && result.improvement_areas.length > 0) {
            message += `\n\nKey improvement areas:\n• ${result.improvement_areas.join('\n• ')}`;
          }
          
          if (result.recommendations && result.recommendations.length > 0) {
            message += `\n\nRecommendations:\n• ${result.recommendations.join('\n• ')}`;
          }
          
          return message;
        }
        break;
        
      case 'optimize':
        if (result.schedule) {
          return `Here's your optimized schedule:\n\n${this.formatSchedule(result.schedule)}`;
        }
        break;
        
      case 'questions':
        if (result.answer) {
          return result.answer;
        }
        break;
        
      case 'reports':
        if (result.summary) {
          return `Report generated:\n\n${result.summary}`;
        }
        break;
        
      case 'preferences':
        return 'Your preferences have been updated successfully.';
    }
    
    // Generic fallback
    return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  }

  /**
   * Format schedule data for display
   */
  private formatSchedule(schedule: any): string {
    if (!schedule) return 'No schedule data available.';
    
    if (Array.isArray(schedule)) {
      return schedule.map((item, index) => `${index + 1}. ${item}`).join('\n');
    }
    
    return JSON.stringify(schedule, null, 2);
  }

  /**
   * Generate AI-powered clarification questions for unclear intent
   */
  async clarifyIntentWithAI(request: ChatRequest, userId: string): Promise<ChatResponse> {
    // Generate conversation ID if not provided
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      // Prepare context for AI
      const contextMessages = request.context?.recent_messages || [];
      const userMessage = request.message || request.question || "I need help";
      
      // Create AI prompt for intent clarification
      const systemPrompt = `You are a productivity assistant helping users with their workflow management. 
Your role is to clarify unclear requests and provide specific, actionable suggestions.

Available services:
- insights: Productivity analysis and performance metrics
- optimize: Schedule optimization and time management
- questions: General productivity advice and Q&A
- preferences: User settings and configuration
- reports: Data export and comprehensive summaries

When a user's request is unclear, provide:
1. A helpful clarification question
2. 2-3 specific suggestions based on their context
3. Keep responses concise and actionable

User context: ${request.context?.user_time ? `Current time: ${request.context.user_time}` : 'No time context'}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.slice(-4), // Include last 4 messages for context
        { role: 'user', content: `${userMessage}\n\nPlease help clarify what I need.` }
      ];

      // Call Cloudflare Workers AI directly (runWithTools was causing errors without tools config)
      const response = await Promise.race([
        this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages,
          max_tokens: 150, // Reduced for faster response
          temperature: 0.7
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 8000) // 8 second timeout
        )
      ]) as any;

      // Parse AI response to extract clarification and suggestions
      const aiMessage = response?.response || "I'd be happy to help! Could you tell me more about what you need?";
      
      // Generate contextual suggestions based on the request
      const suggestions = this.generateContextualSuggestions(request);

      return {
        needs_clarification: true,
        message: aiMessage,
        suggestions,
        conversation_id: conversationId
      };

    } catch (error) {
      console.error('[ChatService] AI clarification failed:', error);
      // Fallback to simple clarification
      return this.clarifyIntentFallback(request, userId);
    }
  }

  /**
   * Generate contextual suggestions based on request content
   */
  private generateContextualSuggestions(request: ChatRequest, aiMessage?: string): string[] {
    const message = request.message || request.question || '';
    const timeContext = request.context?.user_time;
    const suggestions: string[] = [];

    // Time-based suggestions
    if (timeContext) {
      const hour = new Date(timeContext).getHours();
      if (hour < 10) {
        suggestions.push("Plan your morning focus session");
      } else if (hour > 16) {
        suggestions.push("Review your day's productivity");
      } else {
        suggestions.push("Optimize your current schedule");
      }
    }

    // Content-based suggestions
    if (message.toLowerCase().includes('flow') || message.toLowerCase().includes('focus')) {
      suggestions.push("Start a deep work session", "Analyze focus patterns");
    } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('time')) {
      suggestions.push("Optimize your schedule", "View time analytics");
    } else if (message.toLowerCase().includes('productive')) {
      suggestions.push("View productivity insights", "Get productivity tips");
    } else {
      // Default suggestions
      suggestions.push("View productivity insights", "Optimize your schedule", "Get productivity tips");
    }

    // Return max 3 unique suggestions
    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * Enhance service responses with follow-up insights and questions
   */
  async generateFollowUp(serviceResponse: any, serviceName: string, userId: string): Promise<any> {
    // Create enhanced response by adding follow_up section
    const enhanced = {
      ...serviceResponse,
      follow_up: this.generateFollowUpContent(serviceResponse, serviceName)
    };

    return enhanced;
  }

  /**
   * Generate contextual follow-up content based on service type and response
   */
  private generateFollowUpContent(response: any, serviceName: string): {
    insights: string[];
    questions: string[];
    recommendations: string[];
  } {
    switch (serviceName) {
      case 'insights':
        return this.generateInsightsFollowUp(response);
      
      case 'optimize':
        return this.generateOptimizeFollowUp(response);
      
      case 'questions':
        return this.generateQuestionsFollowUp(response);
      
      case 'preferences':
        return this.generatePreferencesFollowUp(response);
      
      case 'reports':
        return this.generateReportsFollowUp(response);
      
      default:
        return this.generateGenericFollowUp(response);
    }
  }

  private generateInsightsFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        `Your productivity score of ${response.productivity_score || 'N/A'} shows room for improvement`,
        'Focus on your identified improvement areas for best results'
      ],
      questions: [
        'Would you like specific strategies for your improvement areas?',
        'Should we create an action plan based on these insights?'
      ],
      recommendations: [
        'Schedule regular productivity reviews',
        'Track progress on improvement areas weekly'
      ]
    };
  }

  private generateOptimizeFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        `This schedule could save you ${response.efficiency_gains?.estimated_time_saved || 0} minutes daily`,
        'Time blocking increases focus by reducing context switching'
      ],
      questions: [
        'Would you like help implementing this schedule?',
        'Should we adjust the timing based on your energy levels?'
      ],
      recommendations: [
        'Start with one time block and gradually add more',
        'Set up notifications to stick to your schedule'
      ]
    };
  }

  private generateQuestionsFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        'Understanding your workflow is key to sustainable productivity',
        'Small consistent changes often yield the best results'
      ],
      questions: [
        'Would you like to track the impact of implementing this advice?',
        'Are there specific obstacles you anticipate?'
      ],
      recommendations: [
        'Implement one suggestion at a time',
        'Review progress in a week'
      ]
    };
  }

  private generatePreferencesFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        'Your preferences are now updated to personalize your experience',
        'These settings will help tailor future recommendations'
      ],
      questions: [
        'Would you like to see how these changes affect your insights?',
        'Should we update your schedule based on new preferences?'
      ],
      recommendations: [
        'Review and adjust preferences monthly',
        'Test new settings for at least a week'
      ]
    };
  }

  private generateReportsFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        'Regular reporting helps identify patterns and trends',
        'Data-driven insights lead to better productivity decisions'
      ],
      questions: [
        'Would you like to schedule regular reports?',
        'Should we focus on specific metrics in future reports?'
      ],
      recommendations: [
        'Export key metrics for offline analysis',
        'Share insights with your team if applicable'
      ]
    };
  }

  private generateGenericFollowUp(response: any): { insights: string[]; questions: string[]; recommendations: string[] } {
    return {
      insights: [
        'Every productivity improvement starts with awareness',
        'Consistent small changes lead to significant results'
      ],
      questions: [
        'What would you like to explore next?',
        'How can we help you take action on these insights?'
      ],
      recommendations: [
        'Set specific, measurable goals',
        'Review progress regularly'
      ]
    };
  }
}