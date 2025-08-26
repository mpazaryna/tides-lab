/**
 * @fileoverview Prompt MCP Handlers - Tide Analysis Prompt Registration
 * 
 * This module handles the registration of MCP prompts for tide analysis and insights.
 * Provides templated prompts for productivity analysis, energy optimization, and
 * team collaboration insights using tide data.
 * 
 * Follows MCP prompt patterns with template processing and dynamic data injection.
 * 
 * @author Tides Development Team
 * @version 2.1.0
 * @since 2025-08-07
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as tideTools from "../tools";
import type { TideStorage } from "../storage";
import type { AuthContext } from "../storage/d1-r2";
import { getPromptTemplate, processTemplate } from "../prompts/registry";

/**
 * Helper function to fetch common tide data for prompts with auth context handling
 * 
 * @param tide_id - ID of the tide to fetch data for
 * @param storage - Storage instance
 * @param authContext - Authentication context for multi-user support
 * @returns Common tide data structure with analytics
 */
async function getCommonTideData(tide_id: string, storage: TideStorage, authContext?: AuthContext | null) {
  // Ensure auth context is set on storage for this prompt execution
  if (authContext && 'setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
    (storage as any).setAuthContext(authContext);
  }
  
  const tide = await storage.getTide(tide_id);
  if (!tide) {
    throw new Error(`Tide with ID "${tide_id}" not found. Please verify the tide ID and try again.`);
  }

  const flowSessions = await storage.getFlowSessions(tide_id);
  const energyUpdates = await storage.getEnergyUpdates(tide_id);  
  const taskLinks = await storage.getTaskLinks(tide_id);

  // Calculate analytics
  const totalDuration = flowSessions.reduce((sum: number, session: any) => sum + session.duration, 0);
  const averageDuration = flowSessions.length > 0 ? Math.round(totalDuration / flowSessions.length) : 0;

  return {
    tide,
    flowSessions,
    energyUpdates,
    taskLinks,
    totalDuration,
    averageDuration,
    Math: Math,
    Date: Date
  };
}

/**
 * Helper function to register a prompt from template registry with error handling
 * 
 * @param server - MCP server instance
 * @param promptName - Name of the prompt template
 * @param getData - Function to fetch prompt data
 * @param authContext - Authentication context for multi-user support
 * @param storage - Storage instance
 */
function registerPromptFromTemplate(
  server: McpServer,
  promptName: string,
  getData: (args: any) => Promise<any>,
  authContext?: AuthContext | null,
  storage?: TideStorage
) {
  try {
    const template = getPromptTemplate(promptName);
    if (!template) {
      throw new Error(`Template not found for prompt: ${promptName}`);
    }

    server.registerPrompt(
      promptName,
      {
        title: template.metadata.title,
        description: template.metadata.description,
        argsSchema: template.zodSchema,
      },
      async (args: any) => {
        try {
          // Ensure auth context is set on storage for this prompt execution
          if (authContext && storage && 'setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
            (storage as any).setAuthContext(authContext);
            console.log(`[PROMPT] Set auth context for ${promptName}: ${authContext.userId}`);
          }
          
          const data = await getData(args);
          
          // Debug: Check if data is empty (indicates auth/storage issue)
          if (!data.tide) {
            console.warn(`[PROMPT] No tide data found for ${promptName} with args:`, args);
            console.warn(`[PROMPT] Storage auth context:`, authContext?.userId || 'no auth context');
          }
          
          const contextText = processTemplate(template.contextTemplate, data);
          
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: contextText,
                },
              },
            ],
          };
        } catch (error) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Error processing ${promptName}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                },
              },
            ],
          };
        }
      }
    );
  } catch (error) {
    console.error(`Failed to register prompt ${promptName}:`, error);
    // Fallback registration with basic functionality
    server.registerPrompt(
      promptName,
      {
        title: promptName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Analysis prompt (template loading failed)`,
        argsSchema: { tide_id: z.string() },
      },
      () => ({
        messages: [
          {
            role: "user", 
            content: {
              type: "text",
              text: `Prompt template for ${promptName} could not be loaded. Please check the configuration.`,
            },
          },
        ],
      })
    );
  }
}

/**
 * Register all MCP prompts for tide analysis with the server
 * 
 * Provides templated prompts for:
 * - Comprehensive tide analysis with productivity patterns
 * - Productivity insights with time-based comparisons  
 * - Energy optimization recommendations
 * - Team collaboration insights
 * - Custom analysis with flexible question handling
 * 
 * @param server - The MCP server instance to register prompts with
 * @param storage - Storage instance for data access
 * @param authContext - Authentication context for multi-user support
 */
export function registerPromptHandlers(server: McpServer, storage: TideStorage, authContext?: AuthContext | null) {
  // Register analyze_tide prompt for comprehensive productivity analysis
  registerPromptFromTemplate(
    server,
    "analyze_tide", 
    async ({ tide_id, analysis_depth, focus_areas }) => {
      const commonData = await getCommonTideData(tide_id, storage, authContext);
      return {
        ...commonData,
        analysis_depth,
        focus_areas
      };
    },
    authContext,
    storage
  );

  // Register productivity_insights prompt for time-based performance analysis
  registerPromptFromTemplate(
    server,
    "productivity_insights",
    async ({ tide_id, time_period, comparison_baseline }) => {
      const commonData = await getCommonTideData(tide_id, storage, authContext);
      return {
        ...commonData,
        time_period,
        comparison_baseline
      };
    },
    authContext,
    storage
  );

  // Register optimize_energy prompt for energy management recommendations
  registerPromptFromTemplate(
    server,
    "optimize_energy",
    async ({ tide_id, target_schedule, energy_goals }) => {
      const commonData = await getCommonTideData(tide_id, storage, authContext);
      return {
        ...commonData,
        target_schedule,
        energy_goals
      };
    },
    authContext,
    storage
  );

  // Register team_insights prompt for collaborative workflow analysis
  registerPromptFromTemplate(
    server,
    "team_insights",
    async ({ participant_ids, date_range, collaboration_focus }) => {
      // Ensure auth context is set on storage for this prompt execution
      if (authContext && 'setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
        (storage as any).setAuthContext(authContext);
      }
      
      // Get participants data - this will use the existing tides_get_participants tool
      const participantsResult = await tideTools.getParticipants({ 
        status_filter: 'active',
        date_from: date_range?.split('_to_')[0],
        date_to: date_range?.split('_to_')[1],
        limit: 100 
      }, storage);

      if (!participantsResult.success) {
        throw new Error(`Failed to get participants data`);
      }

      return {
        participants: participantsResult.participants || [],
        participant_ids,
        date_range,
        collaboration_focus,
        Math: Math
      };
    },
    authContext,
    storage
  );

  // Register custom_tide_analysis prompt for flexible analysis questions
  registerPromptFromTemplate(
    server,
    "custom_tide_analysis",
    async ({ tide_id, analysis_question, context, output_format }) => {
      const commonData = await getCommonTideData(tide_id, storage, authContext);
      return {
        ...commonData,
        analysis_question,
        context,
        output_format
      };
    },
    authContext,
    storage
  );
}