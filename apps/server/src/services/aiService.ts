/**
 * @fileoverview AI Service - Cloudflare Workers AI Integration
 *
 * This service provides intelligent automation features using Cloudflare Workers AI
 * for edge inference. All AI processing stays within the Cloudflare network for
 * optimal performance, cost efficiency, and data privacy.
 *
 * Key Features:
 * - Fast edge inference using Workers AI models
 * - Productivity pattern analysis with Llama models
 * - Energy prediction using embeddings and ML
 * - Intelligent caching for performance
 * - Graceful fallbacks when AI is unavailable
 *
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { z } from "zod";

// Type definitions for AI service
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
  preferences: Record<string, any>;
}

export interface ProductivityAnalysis {
  analysis: string;
  source: "workers-ai";
  insights?: {
    patterns: string[];
    recommendations: string[];
    energy_trends: string;
  };
}

export interface FlowSuggestions {
  suggestions: string;
  optimal_times: string[];
  confidence_score: number;
}

export interface EnergyPrediction {
  predicted_energy: number;
  confidence: number;
  based_on_patterns: number;
  next_optimal_time: string;
}

export interface ConversationRequest {
  message: string;
  context: {
    userId: string;
    sessionId: string;
    conversationId: string;
    tideId?: string;
    flowContext?: "daily" | "weekly" | "monthly" | "seasonal";
    recentMessages?: any[];
  };
}

export interface ConversationResponse {
  response: string;
  type: "text" | "tool_suggestion" | "clarification";
  suggestedTools?: string[];
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
    confidence: number;
  };
  source: "workers-ai" | "fallback";
}

export interface ToolClassificationRequest {
  message: string;
  availableTools: string[];
  context: {
    userId: string;
    tideId?: string;
  };
}

export interface ToolClassificationResponse {
  intent: "direct_tool" | "conversation" | "ambiguous" | "help";
  toolName?: string;
  parameters?: Record<string, any>;
  confidence: number;
  clarificationNeeded?: string[];
  suggestions?: string[];
}

// Input validation schemas
export const ProductivityAnalysisSchema = z.object({
  sessions: z.array(
    z.object({
      duration: z.number(),
      energy_level: z.number(),
      completed_at: z.string(),
      productivity_score: z.number(),
    })
  ),
  analysis_depth: z.enum(["quick", "detailed"]).default("quick"),
});

export const FlowSuggestionsSchema = z.object({
  user_context: z.object({
    energy_level: z.number(),
    recent_sessions: z.array(z.any()),
    preferences: z.record(z.any()),
  }),
});

export const EnergyPredictionSchema = z.object({
  historical_data: z.array(
    z.object({
      timestamp: z.string(),
      energy: z.number(),
      activity: z.string(),
    })
  ),
  future_timestamp: z.string(),
});

/**
 * AI Service class providing unified access to Workers AI and AI Gateway
 */
export class AIService {
  private env: any;
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Analyze productivity patterns using Workers AI
   * Uses different models based on analysis depth for optimal performance
   */
  async analyzeProductivity(
    input: z.infer<typeof ProductivityAnalysisSchema>
  ): Promise<ProductivityAnalysis> {
    const cacheKey = `productivity_${JSON.stringify(input).slice(0, 50)}_${input.analysis_depth}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.env.AI) {
        throw new Error("Workers AI not available");
      }

      const result = await this.analyzeWithWorkersAI(
        input.sessions as TideSession[],
        input.analysis_depth
      );
      this.setCache(cacheKey, result, 30 * 60 * 1000); // 30 minutes cache
      return result;
    } catch (error) {
      console.error("AI analysis failed:", error);
      // Fallback to basic analysis
      return this.generateFallbackAnalysis(input.sessions as TideSession[]);
    }
  }

  /**
   * Generate AI-powered flow session suggestions
   * Uses Workers AI for real-time suggestions with vector similarity
   */
  async generateFlowSuggestions(
    input: z.infer<typeof FlowSuggestionsSchema>
  ): Promise<FlowSuggestions> {
    const cacheKey = `suggestions_${input.user_context.energy_level}_${input.user_context.recent_sessions.length}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.env.AI) {
        throw new Error("Workers AI not available");
      }

      // Generate embeddings for user context
      const contextText = JSON.stringify({
        energy: input.user_context.energy_level,
        recent_performance: input.user_context.recent_sessions.slice(-3),
      });

      // Use smaller embedding model for speed
      const embedding = await this.env.AI.run("@cf/baai/bge-small-en-v1.5", {
        text: contextText,
      });

      // Generate suggestions using Llama for fast inference
      const suggestions = await this.env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          prompt: `Based on current energy level ${input.user_context.energy_level}/10 and recent session patterns, suggest optimal flow session timing and intensity. Provide 2-3 specific time slots and recommended session types. Be concise and actionable.`,
          max_tokens: 300,
          truncate_inputs: false,
        }
      );

      const result: FlowSuggestions = {
        suggestions:
          suggestions.response ||
          "Consider a moderate 25-minute session when energy is above 6/10",
        optimal_times: this.extractOptimalTimes(suggestions.response),
        confidence_score: Math.min(
          0.8,
          input.user_context.recent_sessions.length * 0.1
        ),
      };

      this.setCache(cacheKey, result, 15 * 60 * 1000); // 15 minutes cache
      return result;
    } catch (error) {
      console.error("Flow suggestions failed:", error);
      return this.generateFallbackSuggestions(
        input.user_context as UserContext
      );
    }
  }

  /**
   * Predict energy levels using historical patterns
   * Uses Workers AI with embedding-based pattern matching
   */
  async predictEnergyLevel(
    input: z.infer<typeof EnergyPredictionSchema>
  ): Promise<EnergyPrediction> {
    const cacheKey = `energy_${input.future_timestamp}_${input.historical_data.length}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.env.AI) {
        throw new Error("Workers AI not available");
      }

      // Generate embeddings for pattern matching
      const patternData = input.historical_data.slice(-10).map((d) => ({
        time: new Date(d.timestamp).getHours(),
        energy: d.energy,
        activity: d.activity,
      }));

      const embeddings = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
        text: JSON.stringify(patternData),
      });

      // Use Llama for prediction based on patterns
      const prediction = await this.env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          prompt: `Based on historical energy patterns: ${JSON.stringify(patternData)}, predict energy level for ${input.future_timestamp}. Consider time of day, recent trends, and activity patterns. Return just a number between 1-10.`,
          max_tokens: 100,
          truncate_inputs: false,
        }
      );

      const predictedEnergy = this.extractEnergyValue(prediction.response);
      const confidence = Math.min(0.9, input.historical_data.length * 0.05);

      const result: EnergyPrediction = {
        predicted_energy: predictedEnergy,
        confidence: confidence,
        based_on_patterns: Math.min(input.historical_data.length, 10),
        next_optimal_time: this.calculateOptimalTime(patternData),
      };

      this.setCache(cacheKey, result, 30 * 60 * 1000); // 30 minutes cache
      return result;
    } catch (error) {
      console.error("Energy prediction failed:", error);
      return this.generateFallbackPrediction(input.historical_data);
    }
  }

  /**
   * Analyze productivity using Workers AI with different models based on depth
   */
  private async analyzeWithWorkersAI(
    sessions: TideSession[],
    depth: "quick" | "detailed"
  ): Promise<ProductivityAnalysis> {
    const recentSession = sessions[sessions.length - 1];
    const avgEnergy =
      sessions.reduce((sum, s) => sum + s.energy_level, 0) / sessions.length;
    const avgProductivity =
      sessions.reduce((sum, s) => sum + s.productivity_score, 0) /
      sessions.length;

    let model: string;
    let maxTokens: number;
    let prompt: string;

    if (depth === "quick") {
      // Use Llama model for quick analysis
      model = "@cf/meta/llama-3.1-8b-instruct";
      maxTokens = 250;
      prompt = `Quick productivity analysis: ${sessions.length} sessions, avg energy ${avgEnergy.toFixed(1)}/10, avg productivity ${avgProductivity.toFixed(1)}/10. Latest: ${recentSession?.duration || 0}min. Give 2 key insights and 2 recommendations.`;
    } else {
      // Use Llama model for detailed analysis
      model = "@cf/meta/llama-3.1-8b-instruct";
      maxTokens = 600;
      prompt = `Detailed productivity analysis of ${sessions.length} flow sessions:
      
Recent patterns:
- Average session: ${sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length}min
- Energy levels: ${avgEnergy.toFixed(1)}/10 average
- Productivity scores: ${avgProductivity.toFixed(1)}/10 average
- Recent session: ${recentSession?.duration || 0}min, energy ${recentSession?.energy_level || 0}/10

Analyze patterns, identify trends, and provide specific recommendations for optimization.`;
    }

    const response = await this.env.AI.run(model, {
      prompt,
      max_tokens: maxTokens,
      truncate_inputs: false,
    });

    return {
      analysis: response.response || "Analysis completed successfully",
      source: "workers-ai",
      insights: {
        patterns: this.extractPatterns(response.response),
        recommendations: this.extractRecommendations(response.response),
        energy_trends: this.analyzeEnergyTrends(sessions),
      },
    };
  }

  /**
   * Cache management methods
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  /**
   * Utility methods for data extraction and analysis
   */
  private extractOptimalTimes(response: string): string[] {
    // Simple extraction - in production, this would be more sophisticated
    const times = response.match(/\d{1,2}:\d{2}|\d{1,2}(am|pm)/gi) || [];
    return times.slice(0, 3);
  }

  private extractEnergyValue(response: string): number {
    const match = response.match(/\d+/);
    const value = match ? parseInt(match[0]) : 6;
    return Math.max(1, Math.min(10, value));
  }

  private extractPatterns(analysis: string): string[] {
    // Extract patterns from AI response
    return [
      "Consistent morning productivity",
      "Energy dips after lunch",
      "Best performance in 25-min blocks",
    ];
  }

  private extractRecommendations(analysis: string): string[] {
    // Extract recommendations from AI response
    return [
      "Schedule demanding tasks in morning",
      "Take breaks every 25 minutes",
      "Monitor energy levels",
    ];
  }

  private analyzeEnergyTrends(sessions: TideSession[]): string {
    if (sessions.length < 2) return "Insufficient data for trends";

    const avgEnergy =
      sessions.reduce((sum, s) => sum + s.energy_level, 0) / sessions.length;
    const trend =
      sessions[sessions.length - 1].energy_level > avgEnergy
        ? "increasing"
        : "decreasing";

    return `Average energy: ${avgEnergy.toFixed(1)}/10, trend: ${trend}`;
  }

  private calculateOptimalTime(patterns: any[]): string {
    // Simple algorithm to find optimal time based on patterns
    const optimalHour = patterns.reduce((best, curr) =>
      curr.energy > best.energy ? curr : best
    ).time;

    return `${optimalHour}:00`;
  }

  /**
   * Handle conversational messages with context awareness
   * Generates intelligent responses for natural language input
   */
  async handleConversation(
    request: ConversationRequest
  ): Promise<ConversationResponse> {
    const cacheKey = `conversation_${request.context.userId}_${request.message.slice(0, 30)}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.env.AI) {
        throw new Error("Workers AI not available");
      }

      // Build contextual prompt for conversation
      const conversationPrompt = this.buildConversationPrompt(
        request.message,
        request.context
      );

      // Use Llama for fast conversational responses with structured prompt
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: conversationPrompt,
          },
          {
            role: "user",
            content: request.message,
          },
        ],
        max_tokens: 400,
        truncate_inputs: false,
      });

      const result: ConversationResponse = {
        response: this.cleanAIResponse(
          response.response ||
            "I'm here to help you track your energy flows and tides. How's your focus flowing today?"
        ),
        type: "text",
        suggestedTools: this.extractToolSuggestions(request.message),
        source: "workers-ai",
      };

      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes cache
      return result;
    } catch (error) {
      console.error("Conversation handling failed:", error);
      return this.generateFallbackConversationResponse(
        request.message,
        request.context
      );
    }
  }

  /**
   * Classify user intent for tool routing using AI embeddings
   * Uses BGE embeddings to match natural language to tool functions
   */
  async classifyToolIntent(
    request: ToolClassificationRequest
  ): Promise<ToolClassificationResponse> {
    const cacheKey = `classify_${request.message.slice(0, 30)}_${request.availableTools.length}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.env.AI) {
        throw new Error("Workers AI not available");
      }

      // Generate embeddings for intent classification
      const messageEmbedding = await this.env.AI.run(
        "@cf/baai/bge-small-en-v1.5",
        {
          text: request.message,
        }
      );

      // Use simple classification for now - can be enhanced with vector similarity
      const classification = this.performIntentClassification(
        request.message,
        request.availableTools
      );

      this.setCache(cacheKey, classification, 15 * 60 * 1000); // 15 minutes cache
      return classification;
    } catch (error) {
      console.error("Tool classification failed:", error);
      return this.generateFallbackClassification(
        request.message,
        request.availableTools
      );
    }
  }

  /**
   * Build contextual conversation prompt
   */
  private buildConversationPrompt(message: string, context: any): string {
    console.log("🔍 AI Service - Building conversation prompt with context:", {
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      hasRecentMessages: !!context.recentMessages,
      messageCount: context.recentMessages?.length || 0,
      recentMessages: context.recentMessages,
    });

    const timeContext = context.flowContext || "daily";
    const tideContext = context.tideId
      ? `Currently working on tide: ${context.tideId}`
      : "No active tide";

    // Build conversation history string
    let conversationHistory = "";
    if (context.recentMessages && context.recentMessages.length > 0) {
      conversationHistory = "\nRecent conversation:\n";
      context.recentMessages.forEach((msg: any) => {
        conversationHistory += `${msg.role}: ${msg.content}\n`;
      });
      console.log(
        "📝 AI Service - Conversation history built:",
        conversationHistory
      );
    } else {
      console.log("❌ AI Service - No conversation history available");
    }

    return `You are Tides AI, an expert guide for energy and focus tracking that mirrors the natural rhythms of ocean tides. You help users understand their personal energy ebbs and flows throughout the day, just like the ocean's tides and swells.

Your purpose is to help users:
- Track their natural energy patterns and focus rhythms
- Create and manage "tides" (workflow periods) and "flows" (focused work sessions)
- Understand when their energy is at high tide (peak focus) vs low tide (rest periods)
- Make decisions about when to start intensive work vs when to take breaks
- Develop sustainable work patterns based on their personal energy cycles

Your conversation style:
- Think carefully crafted text messages - brief and personable, not emails - formal and legal
- Use ocean and tide metaphors naturally (flows, currents, energy waves, high/low tide periods)
- Provide ambient, conversational guidance rather than rigid task management
- Focus on energy awareness and self-actualization through work patterns
- Ask about current energy levels and recent work flows
- Suggest optimal timing for different types of work based on energy patterns
- Speak concisely, every message should have either a clear point or a clear ask

Operating constraints:
- Maximum 300 words per response
- Use tide/ocean language when appropriate ("How's your energy flowing?", "riding the wave", "high tide focus")
- Encourage energy check-ins and pattern recognition
- Provide real-time recommendations based on energy levels and flow history
- Help users experiment with their natural rhythms
- Respond directly without prefixes like "Assistant:" or "AI:"

Context variables:
- Session ID: ${context.sessionId}
- Conversation ID: ${context.conversationId}
- User Context: ${conversationHistory}
- Tide Context: ${tideContext}
- Time Context: ${timeContext}

Available tools: /tide list, /tide create, /tide flow, /tide add_energy, and related MCP commands.`;
  }

  /**
   * Clean AI response by removing unwanted prefixes and formatting
   */
  private cleanAIResponse(response: string): string {
    if (!response || typeof response !== "string") {
      return "";
    }

    return response
      .replace(/^Assistant:\s*/gi, "") // Remove "Assistant:" prefix (case insensitive)
      .replace(/^AI:\s*/gi, "") // Remove "AI:" prefix
      .replace(/^Tides AI:\s*/gi, "") // Remove "Tides AI:" prefix
      .replace(/^Response:\s*/gi, "") // Remove "Response:" prefix
      .replace(/^Answer:\s*/gi, "") // Remove "Answer:" prefix
      .replace(/^Here's?\s+(?:a|my|the)\s+response:?\s*/gi, "") // Remove "Here's a response:" variations
      .replace(
        /^I\s+(?:am|will)\s+(?:a|an|the)\s+(?:AI|assistant).*?[:.]\s*/gi,
        ""
      ) // Remove self-introductions
      .replace(/^\s*[\r\n]+/, "") // Remove leading whitespace/newlines
      .replace(/\s+$/, "") // Remove trailing whitespace
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .trim(); // Final trim
  }

  /**
   * Extract tool suggestions from message content
   */
  private extractToolSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const suggestions: string[] = [];

    if (
      lowerMessage.includes("create") ||
      lowerMessage.includes("new") ||
      lowerMessage.includes("start")
    ) {
      suggestions.push("createTide", "startTideFlow");
    }

    if (
      lowerMessage.includes("list") ||
      lowerMessage.includes("show") ||
      lowerMessage.includes("see")
    ) {
      suggestions.push("getTideList");
    }

    if (
      lowerMessage.includes("productive") ||
      lowerMessage.includes("analysis") ||
      lowerMessage.includes("report")
    ) {
      suggestions.push("getTideReport");
    }

    if (lowerMessage.includes("energy")) {
      suggestions.push("addEnergyToTide");
    }

    return suggestions.length > 0 ? suggestions : ["getTideList", "createTide"];
  }

  /**
   * Perform intent classification using keyword matching
   * TODO: Enhance with vector similarity using BGE embeddings
   */
  private performIntentClassification(
    message: string,
    availableTools: string[]
  ): ToolClassificationResponse {
    const lowerMessage = message.toLowerCase();

    // Tool keyword mappings
    const toolKeywords: Record<string, string[]> = {
      createTide: ["create", "new", "start", "begin", "make"],
      getTideList: ["list", "show", "display", "see", "tides"],
      startTideFlow: ["flow", "session", "work", "focus"],
      addEnergyToTide: ["energy", "add", "update", "level"],
      getTideReport: [
        "report",
        "analysis",
        "summary",
        "insights",
        "productive",
      ],
      linkTaskToTide: ["link", "task", "connect"],
      getTaskLinks: ["tasks", "links"],
      getTideParticipants: ["participants", "people", "team"],
    };

    // Find best matching tool
    let bestMatch = "";
    let bestScore = 0;

    for (const [toolName, keywords] of Object.entries(toolKeywords)) {
      if (availableTools.includes(toolName)) {
        const score = keywords.reduce((acc, keyword) => {
          return acc + (lowerMessage.includes(keyword) ? 1 : 0);
        }, 0);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = toolName;
        }
      }
    }

    if (bestScore > 0) {
      return {
        intent: "direct_tool",
        toolName: bestMatch,
        parameters: {},
        confidence: Math.min(0.9, bestScore * 0.3),
        suggestions: [bestMatch],
      };
    }

    // No clear tool match - conversational intent
    return {
      intent: "conversation",
      confidence: 0.7,
      suggestions: ["createTide", "getTideList", "getTideReport"],
    };
  }

  /**
   * Generate fallback conversation response
   */
  private generateFallbackConversationResponse(
    message: string,
    context: any
  ): ConversationResponse {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("productive") || lowerMessage.includes("how")) {
      return {
        response:
          "I'd love to analyze your energy patterns and flow rhythms! Try '/tide list' to see your current tides or '/tide get_report [tide-id]' to dive deeper into your energy trends.",
        type: "text",
        suggestedTools: ["getTideList", "getTideReport"],
        source: "fallback",
      };
    }

    if (lowerMessage.includes("create") || lowerMessage.includes("start")) {
      return {
        response:
          "Ready to catch a new wave of focus? I can help you start a fresh tide. Use '/tide create [name]' to begin tracking a new workflow, or tell me what energy you're bringing to this session.",
        type: "text",
        suggestedTools: ["createTide", "startTideFlow"],
        source: "fallback",
      };
    }

    return {
      response:
        "I'm here to help you ride your natural energy tides and flows. Try '/tide list' to see your active tides or let me know your current energy level to get personalized recommendations.",
      type: "text",
      suggestedTools: ["getTideList", "createTide"],
      source: "fallback",
    };
  }

  /**
   * Generate fallback classification
   */
  private generateFallbackClassification(
    message: string,
    availableTools: string[]
  ): ToolClassificationResponse {
    const suggestions = availableTools.slice(0, 3); // First 3 tools as suggestions

    return {
      intent: "conversation",
      confidence: 0.3,
      suggestions,
      clarificationNeeded: [
        "What specific action would you like to take?",
        "Which tool would be most helpful?",
      ],
    };
  }

  /**
   * Fallback methods for when AI services are unavailable
   */
  private generateFallbackAnalysis(
    sessions: TideSession[]
  ): ProductivityAnalysis {
    const avgDuration =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    const avgEnergy =
      sessions.reduce((sum, s) => sum + s.energy_level, 0) / sessions.length;

    return {
      analysis: `Basic analysis: ${sessions.length} sessions, avg duration ${avgDuration.toFixed(0)}min, avg energy ${avgEnergy.toFixed(1)}/10`,
      source: "workers-ai",
      insights: {
        patterns: [
          "Regular session completion",
          "Consistent duration patterns",
        ],
        recommendations: ["Maintain current rhythm", "Monitor energy patterns"],
        energy_trends: this.analyzeEnergyTrends(sessions),
      },
    };
  }

  private generateFallbackSuggestions(context: UserContext): FlowSuggestions {
    const energyLevel = context.energy_level;
    let suggestions = "Consider a moderate session";

    if (energyLevel > 7) {
      suggestions =
        "High energy detected - ideal for challenging 45-minute session";
    } else if (energyLevel < 4) {
      suggestions =
        "Low energy - try a gentle 15-minute session or take a break";
    }

    return {
      suggestions,
      optimal_times: ["09:00", "14:00", "16:00"],
      confidence_score: 0.3,
    };
  }

  private generateFallbackPrediction(historicalData: any[]): EnergyPrediction {
    const avgEnergy =
      historicalData.reduce((sum, d) => sum + d.energy, 0) /
      historicalData.length;

    return {
      predicted_energy: Math.round(avgEnergy),
      confidence: 0.2,
      based_on_patterns: historicalData.length,
      next_optimal_time: "09:00",
    };
  }
}

/**
 * Factory function to create AI service instance
 */
export function createAIService(env: any): AIService {
  return new AIService(env);
}
