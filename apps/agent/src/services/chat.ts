/**
 * Chat Service - AI-Powered Implementation
 * Handles intent clarification and response enhancement
 */

import type { Env, ChatRequest, ChatResponse } from '../types.js';

export class ChatService {
  private env: Env;
  private readonly CONFIDENCE_THRESHOLD = 70;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Check if a request needs clarification based on confidence score
   */
  needsClarification(confidence: number): boolean {
    return confidence < this.CONFIDENCE_THRESHOLD;
  }

  /**
   * Generate clarification questions for unclear intent
   * Now uses direct AI calls instead of runWithTools (which was causing errors)
   */
  async clarifyIntent(request: ChatRequest, userId: string): Promise<ChatResponse> {
    try {
      return await this.clarifyIntentWithAI(request, userId);
    } catch (error) {
      console.error('[ChatService] AI clarification failed, using fallback:', error);
      return this.clarifyIntentFallback(request, userId);
    }
  }

  /**
   * Fallback clarification when AI is not available
   */
  private async clarifyIntentFallback(request: ChatRequest, userId: string): Promise<ChatResponse> {
    // Generate conversation ID if not provided
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      needs_clarification: true,
      message: "I'd be happy to help! Could you tell me more about what you need?",
      suggestions: this.generateContextualSuggestions(request),
      conversation_id: conversationId
    };
  }

  /**
   * Generate AI-powered clarification questions for unclear intent
   */
  async clarifyIntentWithAI(request: ChatRequest, userId: string): Promise<ChatResponse> {
    // Generate conversation ID if not provided
    const conversationId = request.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      const suggestions = this.generateContextualSuggestions(request, aiMessage);

      return {
        needs_clarification: true,
        message: aiMessage,
        suggestions,
        conversation_id: conversationId
      };

    } catch (error) {
      console.error('[ChatService] AI clarification failed:', error);
      // Fallback to simple clarification
      return this.clarifyIntent(request, userId);
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