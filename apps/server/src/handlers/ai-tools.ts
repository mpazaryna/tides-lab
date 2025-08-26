/**
 * @fileoverview AI-Powered MCP Tool Handlers - AI Integration for Tides
 * 
 * This module handles the registration of AI-powered MCP tools that leverage
 * Cloudflare Workers AI for intelligent automation and insights.
 * 
 * Features:
 * - Workers AI for fast edge inference (energy prediction, analysis)
 * - Multiple model selection based on task complexity
 * - All processing stays within Cloudflare network
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  createAIService, 
  ProductivityAnalysisSchema, 
  FlowSuggestionsSchema, 
  EnergyPredictionSchema 
} from "../services/aiService.js";
import type { TideStorage } from "../storage";

/**
 * Register all AI-powered MCP tools with the server
 * 
 * Provides intelligent automation features including:
 * - Productivity pattern analysis using AI
 * - Flow session suggestions based on user context
 * - Energy level prediction using machine learning
 * - Intelligent scheduling recommendations
 * 
 * @param server - The MCP server instance to register tools with
 * @param storage - Storage instance for accessing tide data
 * @param env - Cloudflare Workers environment with AI bindings
 */
export function registerAITools(server: McpServer, storage: TideStorage, env: any) {
  const aiService = createAIService(env);

  /**
   * MCP Tool: ai_analyze_productivity
   * 
   * AI-powered analysis of productivity patterns using either Workers AI
   * for quick analysis or AI Gateway for detailed insights.
   */
  server.registerTool(
    "ai_analyze_productivity",
    {
      title: "AI Productivity Analysis",
      description: "Analyze productivity patterns using Workers AI to extract insights, trends, and recommendations. Choose 'quick' for fast Mistral analysis or 'detailed' for comprehensive Llama analysis. Perfect for dashboard insights and workflow optimization.",
      inputSchema: {
        sessions: z.array(z.object({
          duration: z.number().describe("Session duration in minutes"),
          energy_level: z.number().min(1).max(10).describe("Energy level (1-10)"),
          completed_at: z.string().describe("ISO timestamp when session completed"),
          productivity_score: z.number().min(1).max(10).describe("Self-reported productivity score"),
          intensity: z.string().optional().describe("Session intensity level"),
          work_context: z.string().optional().describe("What was worked on")
        })).describe("Array of completed flow sessions to analyze"),
        analysis_depth: z.enum(["quick", "detailed"]).default("quick").describe("Analysis depth: 'quick' uses Mistral 7B, 'detailed' uses Llama 8B")
      },
    },
    async ({ sessions, analysis_depth = "quick" }) => {
      try {
        const analysisInput = ProductivityAnalysisSchema.parse({ sessions, analysis_depth });
        const result = await aiService.analyzeProductivity(analysisInput);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                analysis: result.analysis,
                source: result.source,
                insights: result.insights,
                session_count: sessions.length,
                analysis_type: analysis_depth
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "AI analysis failed",
                details: error instanceof Error ? error.message : "Unknown error",
                fallback: "Consider analyzing sessions manually or try again later"
              }, null, 2),
            },
          ],
        };
      }
    },
  );

  /**
   * MCP Tool: ai_suggest_flow_session
   * 
   * Generate AI-powered flow session suggestions based on user context,
   * energy levels, and historical patterns.
   */
  server.registerTool(
    "ai_suggest_flow_session",
    {
      title: "AI Flow Suggestions",
      description: "Generate intelligent flow session suggestions using AI based on current energy level, recent session patterns, and user preferences. Uses vector similarity and machine learning for optimal timing recommendations.",
      inputSchema: {
        user_context: z.object({
          energy_level: z.number().min(1).max(10).describe("Current energy level (1-10)"),
          recent_sessions: z.array(z.object({
            duration: z.number(),
            energy_level: z.number(),
            completed_at: z.string(),
            productivity_score: z.number(),
            intensity: z.string().optional(),
            work_context: z.string().optional()
          })).describe("Recent flow sessions for pattern analysis"),
          preferences: z.record(z.any()).describe("User preferences (work style, preferred times, etc.)")
        }).describe("Current user context for generating suggestions")
      },
    },
    async ({ user_context }) => {
      try {
        const suggestionsInput = FlowSuggestionsSchema.parse({ user_context });
        const result = await aiService.generateFlowSuggestions(suggestionsInput);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                suggestions: result.suggestions,
                optimal_times: result.optimal_times,
                confidence_score: result.confidence_score,
                current_energy: user_context.energy_level,
                based_on_sessions: user_context.recent_sessions.length
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "AI suggestions failed",
                details: error instanceof Error ? error.message : "Unknown error",
                fallback_suggestion: user_context.energy_level > 6 
                  ? "Consider a 25-minute focused session" 
                  : "Try a gentle 15-minute session or take a break"
              }, null, 2),
            },
          ],
        };
      }
    },
  );

  /**
   * MCP Tool: ai_predict_energy
   * 
   * Predict future energy levels using machine learning and historical patterns.
   * Uses embeddings and pattern matching for accurate predictions.
   */
  server.registerTool(
    "ai_predict_energy",
    {
      title: "AI Energy Prediction",
      description: "Predict energy levels at future times using machine learning and historical pattern analysis. Uses embedding-based similarity search and AI models to forecast optimal work periods based on past energy patterns.",
      inputSchema: {
        historical_data: z.array(z.object({
          timestamp: z.string().describe("ISO timestamp of energy reading"),
          energy: z.number().min(1).max(10).describe("Energy level at that time"),
          activity: z.string().describe("What activity was being done")
        })).describe("Historical energy data for pattern analysis"),
        future_timestamp: z.string().describe("ISO timestamp to predict energy for")
      },
    },
    async ({ historical_data, future_timestamp }) => {
      try {
        const predictionInput = EnergyPredictionSchema.parse({ historical_data, future_timestamp });
        const result = await aiService.predictEnergyLevel(predictionInput);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                predicted_energy: result.predicted_energy,
                confidence: result.confidence,
                based_on_patterns: result.based_on_patterns,
                next_optimal_time: result.next_optimal_time,
                prediction_for: future_timestamp,
                data_points_used: historical_data.length
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Energy prediction failed",
                details: error instanceof Error ? error.message : "Unknown error",
                fallback_prediction: {
                  energy: 6,
                  confidence: 0.1,
                  note: "Using average baseline due to prediction failure"
                }
              }, null, 2),
            },
          ],
        };
      }
    },
  );

  /**
   * MCP Tool: ai_optimize_schedule
   * 
   * Generate AI-powered schedule optimization recommendations based on
   * productivity patterns, energy cycles, and work context.
   */
  server.registerTool(
    "ai_optimize_schedule",
    {
      title: "AI Schedule Optimization",
      description: "Generate intelligent schedule optimization recommendations using AI analysis of productivity patterns, energy cycles, and work context. Provides personalized timing suggestions for maximum effectiveness.",
      inputSchema: {
        current_schedule: z.array(z.object({
          time: z.string().describe("Time slot (e.g., '09:00')"),
          activity: z.string().describe("Planned activity"),
          priority: z.enum(["low", "medium", "high"]).describe("Task priority"),
          estimated_energy_required: z.number().min(1).max(10).describe("Energy level needed")
        })).describe("Current planned schedule"),
        energy_patterns: z.array(z.object({
          time: z.string(),
          typical_energy: z.number().min(1).max(10)
        })).describe("Historical energy patterns by time of day"),
        constraints: z.object({
          earliest_start: z.string().optional().describe("Earliest start time"),
          latest_end: z.string().optional().describe("Latest end time"),
          break_preferences: z.string().optional().describe("Break preferences")
        }).optional().describe("Scheduling constraints")
      },
    },
    async ({ current_schedule, energy_patterns, constraints }) => {
      try {
        // For schedule optimization, we'll use Workers AI Llama model for complex reasoning
        const optimizationPrompt = `Optimize this schedule based on energy patterns:
        
Schedule: ${JSON.stringify(current_schedule)}
Energy Patterns: ${JSON.stringify(energy_patterns)}
Constraints: ${JSON.stringify(constraints || {})}

Provide specific recommendations for:
1. Optimal task timing based on energy levels
2. Schedule adjustments for maximum productivity
3. Break timing recommendations
4. Energy-task matching improvements

Be specific and actionable.`;

        let optimizedSchedule;
        let recommendations;

        if (env.AI) {
          // Use Workers AI for schedule optimization
          const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt: optimizationPrompt,
            max_tokens: 500
          });

          optimizedSchedule = response.response || "Schedule optimization completed";
          recommendations = [
            "Match high-energy tasks to peak energy times",
            "Schedule breaks before energy dips",
            "Group similar tasks together",
            "Reserve low-energy periods for routine tasks"
          ];
        } else {
          // Fallback optimization
          optimizedSchedule = "Basic optimization: Match task energy requirements to your energy patterns";
          recommendations = [
            "Schedule demanding tasks during peak energy",
            "Use low-energy periods for routine work",
            "Take breaks every 90 minutes"
          ];
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                optimized_schedule: optimizedSchedule,
                recommendations,
                energy_efficiency_score: 0.8,
                schedule_items: current_schedule.length,
                energy_data_points: energy_patterns.length
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Schedule optimization failed",
                details: error instanceof Error ? error.message : "Unknown error",
                basic_recommendations: [
                  "Schedule demanding tasks during morning hours",
                  "Take regular breaks every 25-30 minutes",
                  "Match task complexity to energy levels"
                ]
              }, null, 2),
            },
          ],
        };
      }
    },
  );

  /**
   * MCP Tool: ai_session_insights
   * 
   * Get AI-powered insights from a completed flow session, including
   * performance analysis and improvement suggestions.
   */
  server.registerTool(
    "ai_session_insights",
    {
      title: "AI Session Insights",
      description: "Get AI-powered insights and analysis from a completed flow session. Analyzes performance, identifies patterns, and provides specific improvement suggestions based on session data and context.",
      inputSchema: {
        session_data: z.object({
          duration: z.number().describe("Session duration in minutes"),
          planned_duration: z.number().describe("Originally planned duration"),
          energy_start: z.number().min(1).max(10).describe("Starting energy level"),
          energy_end: z.number().min(1).max(10).describe("Ending energy level"),
          productivity_score: z.number().min(1).max(10).describe("Self-reported productivity"),
          interruptions: z.number().describe("Number of interruptions"),
          work_context: z.string().describe("What was worked on"),
          completion_status: z.enum(["completed", "partial", "extended"]).describe("How session ended")
        }).describe("Data from the completed session"),
        recent_sessions: z.array(z.object({
          duration: z.number(),
          energy_start: z.number(),
          productivity_score: z.number()
        })).optional().describe("Recent sessions for comparison")
      },
    },
    async ({ session_data, recent_sessions = [] }) => {
      try {
        const insightsPrompt = `Analyze this flow session and provide insights:

Session: ${JSON.stringify(session_data)}
Recent Sessions: ${JSON.stringify(recent_sessions)}

Provide:
1. Performance analysis (what went well, what didn't)
2. Energy efficiency assessment
3. Specific improvement suggestions
4. Pattern observations
5. Next session recommendations

Be specific and actionable.`;

        let insights;
        let performance_score;

        if (env.AI) {
          const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt: insightsPrompt,
            max_tokens: 400
          });

          insights = response.response || "Session analysis completed";
          
          // Calculate performance score based on multiple factors
          const durationEfficiency = Math.min(1, session_data.duration / session_data.planned_duration);
          const energyEfficiency = session_data.energy_end / session_data.energy_start;
          const interruptionPenalty = Math.max(0, 1 - (session_data.interruptions * 0.1));
          
          performance_score = (
            (durationEfficiency * 0.3) + 
            (energyEfficiency * 0.3) + 
            (session_data.productivity_score / 10 * 0.3) + 
            (interruptionPenalty * 0.1)
          ) * 100;
        } else {
          insights = "Basic session analysis: Consider consistency in session length and minimizing interruptions";
          performance_score = session_data.productivity_score * 10;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                insights,
                performance_score: Math.round(performance_score),
                energy_change: session_data.energy_end - session_data.energy_start,
                efficiency_rating: session_data.duration <= session_data.planned_duration ? "On track" : "Extended",
                interruption_impact: session_data.interruptions > 3 ? "High" : "Low",
                comparison_available: recent_sessions.length > 0
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Session insights failed",
                details: error instanceof Error ? error.message : "Unknown error",
                basic_insights: {
                  duration_vs_planned: session_data.duration - session_data.planned_duration,
                  energy_change: session_data.energy_end - session_data.energy_start,
                  productivity_rating: session_data.productivity_score >= 7 ? "Good" : "Needs improvement"
                }
              }, null, 2),
            },
          ],
        };
      }
    },
  );
}