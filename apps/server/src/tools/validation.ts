/**
 * @fileoverview Centralized Validation Schemas for Tides MCP Tools
 * 
 * This module contains all Zod validation schemas used by both MCP tool handlers
 * and direct tool access. By centralizing validation logic, we ensure consistency
 * between MCP and direct access patterns while reducing code duplication.
 * 
 * All schemas are extracted from the original MCP handler implementations and
 * maintain the same validation rules and error messages.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import { z } from "zod";

/**
 * Validation schema for tide creation
 * Used by: tide_create MCP tool and createTide direct access
 */
export const CreateTideSchema = z.object({
  name: z.string().describe("Human-readable name for the tide"),
  flow_type: z.enum(["daily", "weekly", "project", "seasonal"]).describe("Type of tide rhythm"),
  description: z.string().optional().describe("Detailed description of the tide's purpose"),
});

/**
 * Validation schema for tide listing with filters
 * Used by: tide_list MCP tool and listTides direct access
 */
export const ListTidesSchema = z.object({
  flow_type: z.string().optional().describe("Filter by flow type"),
  active_only: z.boolean().optional().describe("Show only active tides"),
});

/**
 * Validation schema for starting tide flow sessions
 * Used by: tide_flow MCP tool and startTideFlow direct access
 */
export const TideFlowSchema = z.object({
  tide_id: z.string().describe("ID of the tide to flow"),
  intensity: z.enum(["gentle", "moderate", "strong"]).optional().default("moderate").describe("Flow intensity"),
  duration: z.number().optional().default(25).describe("Duration in minutes"),
  initial_energy: z.string().optional().describe("Initial energy level"),
  work_context: z.string().optional().describe("Context or focus area for this session"),
});

/**
 * Validation schema for adding energy updates
 * Used by: tide_add_energy MCP tool and addTideEnergy direct access
 */
export const AddEnergySchema = z.object({
  tide_id: z.string().describe("ID of the tide"),
  energy_level: z.string().describe("Current energy level (e.g., low, medium, high)"),
  context: z.string().optional().describe("Additional context for the energy check-in"),
});

/**
 * Validation schema for linking external tasks
 * Used by: tide_link_task MCP tool and linkTideTask direct access
 */
export const LinkTaskSchema = z.object({
  tide_id: z.string().describe("ID of the tide"),
  task_url: z.string().describe("URL of the external task"),
  task_title: z.string().describe("Title of the task"),
  task_type: z.string().optional().describe("Type of task (e.g., github_issue, obsidian_note)"),
});

/**
 * Validation schema for listing task links
 * Used by: tide_list_task_links MCP tool and listTideTaskLinks direct access
 */
export const ListTaskLinksSchema = z.object({
  tide_id: z.string().describe("ID of the tide"),
});

/**
 * Validation schema for getting tide reports
 * Used by: tide_get_report MCP tool and getTideReport direct access
 */
export const GetReportSchema = z.object({
  tide_id: z.string().describe("ID of the tide"),
  format: z.enum(["json", "markdown", "csv"]).optional().default("json").describe("Report format"),
});

/**
 * Validation schema for getting raw JSON data
 * Used by: tide_get_raw_json MCP tool and getTideRawJson direct access
 */
export const GetRawJsonSchema = z.object({
  tide_id: z.string().describe("ID of the tide to retrieve"),
});

/**
 * Validation schema for getting participants
 * Used by: tides_get_participants MCP tool and getParticipants direct access
 */
export const GetParticipantsSchema = z.object({
  status_filter: z.string().optional().describe("Filter by status (e.g., active, pending)"),
  date_from: z.string().optional().describe("Start date (ISO format)"),
  date_to: z.string().optional().describe("End date (ISO format)"),
  limit: z.number().optional().default(100).describe("Maximum records to return"),
});

/**
 * Inferred TypeScript types for all schemas
 * These provide type safety for both MCP handlers and direct access
 */
export type CreateTideInput = z.infer<typeof CreateTideSchema>;
export type ListTidesInput = z.infer<typeof ListTidesSchema>;
export type TideFlowInput = z.infer<typeof TideFlowSchema>;
export type AddEnergyInput = z.infer<typeof AddEnergySchema>;
export type LinkTaskInput = z.infer<typeof LinkTaskSchema>;
export type ListTaskLinksInput = z.infer<typeof ListTaskLinksSchema>;
export type GetReportInput = z.infer<typeof GetReportSchema>;
export type GetRawJsonInput = z.infer<typeof GetRawJsonSchema>;
export type GetParticipantsInput = z.infer<typeof GetParticipantsSchema>;

/**
 * Validation helper function that provides consistent error handling
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data or error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, error: `Validation error: ${errorMessages}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Registry of all validation schemas mapped by tool name
 * Useful for dynamic validation in the tool registry
 */
export const ValidationSchemas = {
  createTide: CreateTideSchema,
  listTides: ListTidesSchema,
  startTideFlow: TideFlowSchema,
  addTideEnergy: AddEnergySchema,
  linkTideTask: LinkTaskSchema,
  listTideTaskLinks: ListTaskLinksSchema,
  getTideReport: GetReportSchema,
  getTideRawJson: GetRawJsonSchema,
  getParticipants: GetParticipantsSchema,
} as const;

/**
 * Type for tool names that have validation schemas
 */
export type ValidatedToolName = keyof typeof ValidationSchemas;