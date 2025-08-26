/**
 * @fileoverview Tides MCP Tool Handlers - Core Tide Management Tools Registration
 * 
 * This module handles the registration of core MCP tools for tide management
 * with the MCP server. It provides a clean separation between tool business logic
 * (in src/tools/) and MCP server registration concerns.
 * 
 * Follows Cloudflare MCP Server patterns and industry best practices for
 * handler-based architecture and professional tool registration.
 * 
 * @author Tides Development Team
 * @version 2.1.0
 * @since 2025-08-07
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as tideTools from "../tools";
import type { TideStorage } from "../storage";

/**
 * Register all core tide management MCP tools with the server
 * 
 * Implements Cloudflare MCP Server registration patterns with:
 * - Clear tool descriptions for LLM interaction (CRITICAL)
 * - snake_case naming convention following service_noun_verb pattern
 * - Granular tools (create, list, flow vs monolithic actions)
 * - Robust error handling with informative messages
 * - Zod schema validation for all inputs
 * - Stateless design for scalability
 * 
 * @param server - The MCP server instance to register tools with
 * @param storage - Storage instance for tool operations
 */
export function registerTideTools(server: McpServer, storage: TideStorage) {
  /**
   * MCP Tool: tide_create
   * 
   * Creates a new tide (workflow/project) in the system. This is the primary
   * tool React Native apps will use to create new workflows. Returns a complete
   * tide object with generated ID and next flow scheduling information.
   * 
   * Following service_noun_verb pattern: tide_create
   */
  server.registerTool(
    "tide_create",
    {
      title: "Create Tide",
      description: "Create a new tidal workflow for rhythmic productivity. Use when users want to start a new workflow, project, or productivity cycle. Accepts name, flow type (daily/weekly/project/seasonal), and optional description. Returns tide ID and scheduling info for follow-up actions.",
      inputSchema: {
        name: z.string().describe("Human-readable name for the tide"),
        flow_type: z.enum(["daily", "weekly", "monthly", "project", "seasonal"]).describe("Type of tide rhythm"),
        description: z.string().optional().describe("Detailed description of the tide's purpose"),
      },
    },
    async ({ name, flow_type, description }) => {
      const result = await tideTools.createTide({ name, flow_type, description }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_list
   * 
   * Lists tides with optional filtering - perfect for React Native FlatList components.
   * Returns optimized list data with summary information including flow counts.
   * 
   * Following service_noun_verb pattern: tide_list
   */
  server.registerTool(
    "tide_list",
    {
      title: "List Tides",
      description: "List all tidal workflows with optional filtering by flow type and active status. Perfect for dashboard views and workflow management. Returns array of tide summaries with flow counts and timestamps for mobile display.",
      inputSchema: {
        flow_type: z.string().optional().describe("Filter by flow type"),
        active_only: z.boolean().optional().describe("Show only active tides"),
      },
    },
    async ({ flow_type, active_only }) => {
      const result = await tideTools.listTides({ flow_type, active_only }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_flow
   * 
   * Starts a focused work session (Pomodoro-style) within a tide. This is the
   * core functionality for React Native timer implementations.
   * 
   * Following service_noun_verb pattern: tide_flow
   */
  server.registerTool(
    "tide_flow",
    {
      title: "Flow Tide",
      description: "Start or continue a focused work session within a tidal workflow. Core Pomodoro/focus functionality for productivity apps. Accepts tide ID, intensity level, duration, and context. Returns session details for timer UI components.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide to flow"),
        intensity: z.enum(["gentle", "moderate", "strong"]).optional().default("moderate").describe("Flow intensity"),
        duration: z.number().optional().default(25).describe("Duration in minutes"),
        initial_energy: z.string().optional().describe("Initial energy level"),
        work_context: z.string().optional().describe("Context or focus area for this session"),
      },
    },
    async ({ tide_id, intensity, duration, initial_energy, work_context }) => {
      const result = await tideTools.startTideFlow({ tide_id, intensity, duration, initial_energy, work_context }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_energy_add
   * 
   * Records energy levels and mood throughout a tide's lifecycle. Perfect
   * for React Native slider components and mood tracking features.
   * 
   * Following service_noun_verb pattern: tide_energy_add
   */
  server.registerTool(
    "tide_add_energy",
    {
      title: "Add Energy",
      description: "Record energy level check-in to an active tide for mood and energy tracking. Use for capturing subjective energy states during workflows. Accepts tide ID, energy level description, and optional context. Returns energy ID for tracking progression.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide"),
        energy_level: z.string().describe("Current energy level (e.g., low, medium, high)"),
        context: z.string().optional().describe("Additional context for the energy check-in"),
      },
    },
    async ({ tide_id, energy_level, context }) => {
      const result = await tideTools.addTideEnergy({ tide_id, energy_level, context }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_task_link
   * 
   * Links external tasks (GitHub issues, Obsidian notes) to a tide for
   * integrated workflow management.
   * 
   * Following service_noun_verb pattern: tide_task_link
   */
  server.registerTool(
    "tide_link_task",
    {
      title: "Link Task",
      description: "Link external tasks (GitHub issues, Obsidian notes, Linear tickets) to a tide for integrated workflow management. Creates connections between tides and external work items. Accepts tide ID, task URL, title, and optional type.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide"),
        task_url: z.string().describe("URL of the external task"),
        task_title: z.string().describe("Title of the task"),
        task_type: z.string().optional().describe("Type of task (e.g., github_issue, obsidian_note)"),
      },
    },
    async ({ tide_id, task_url, task_title, task_type }) => {
      const result = await tideTools.linkTideTask({ tide_id, task_url, task_title, task_type }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_task_links_list
   * 
   * Lists all external tasks linked to a specific tide for relationship display.
   * 
   * Following service_noun_verb pattern: tide_task_links_list
   */
  server.registerTool(
    "tide_list_task_links",
    {
      title: "List Task Links",
      description: "List all external tasks linked to a specific tide for task relationship display. Shows connected GitHub issues, notes, and other work items. Perfect for displaying task associations in UI components.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide"),
      },
    },
    async ({ tide_id }) => {
      const result = await tideTools.listTideTaskLinks({ tide_id }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_report_get
   * 
   * Generates comprehensive tide reports in multiple formats for analytics.
   * 
   * Following service_noun_verb pattern: tide_report_get
   */
  server.registerTool(
    "tide_get_report",
    {
      title: "Get Report",
      description: "Generate comprehensive tide reports in multiple formats (JSON, Markdown, CSV) for analytics and progress tracking. Use for dashboard data, progress analysis, and workflow insights. Returns formatted report data.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide"),
        format: z.enum(["json", "markdown", "csv"]).optional().default("json").describe("Report format"),
      },
    },
    async ({ tide_id, format }) => {
      const result = await tideTools.getTideReport({ tide_id, format }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_data_raw_get
   * 
   * Retrieves complete, unprocessed JSON data for a tide from R2 storage.
   * For debugging, data export, and when clients need complete raw data.
   * 
   * Following service_noun_verb pattern: tide_data_raw_get
   */
  server.registerTool(
    "tide_get_raw_json",
    {
      title: "Get Raw JSON",
      description: "Retrieve complete raw JSON data for a tide from R2 storage including all nested arrays (flow_sessions, energy_updates, task_links). Use for data export, debugging storage issues, or when complete data access is needed.",
      inputSchema: {
        tide_id: z.string().describe("ID of the tide to retrieve"),
      },
    },
    async ({ tide_id }) => {
      const result = await tideTools.getTideRawJson({ tide_id }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tides_participants_get
   * 
   * Gets participants from database for multi-user support and team features.
   * 
   * Following service_noun_verb pattern: tides_participants_get
   */
  server.registerTool(
    "tides_get_participants",
    {
      title: "Get Participants",
      description: "Get participants from database with filtering for multi-user support and team management. Filter by status, date ranges, and limit results. Returns participant list for team collaboration features.",
      inputSchema: {
        status_filter: z.string().optional().describe("Filter by status (e.g., active, pending)"),
        date_from: z.string().optional().describe("Start date (ISO format)"),
        date_to: z.string().optional().describe("End date (ISO format)"),
        limit: z.number().optional().default(100).describe("Maximum records to return"),
      },
    },
    async ({ status_filter, date_from, date_to, limit }) => {
      const result = await tideTools.getParticipants({ status_filter, date_from, date_to, limit }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // =============================================================================
  // Hierarchical Tide Tools (ADR-003 Implementation)
  // =============================================================================

  /**
   * MCP Tool: tide_get_or_create_daily
   * 
   * CRITICAL: This tool fixes the mobile app production errors. Mobile apps
   * depend on this tool for automatic daily tide management and seamless UX.
   * 
   * Following service_noun_verb pattern: tide_get_or_create_daily
   */
  server.registerTool(
    "tide_get_or_create_daily",
    {
      title: "Get or Create Daily Tide",
      description: "Get or create a daily tide for today (or specified date). This is the key tool for mobile apps to automatically manage daily workflows without user intervention. Ensures a daily tide exists and returns it with hierarchical context when available.",
      inputSchema: {
        timezone: z.string().optional().describe("User's timezone for date calculation"),
        date: z.string().optional().describe("Specific date in YYYY-MM-DD format (defaults to today)"),
      },
    },
    async ({ timezone, date }) => {
      const result = await tideTools.tideGetOrCreateDaily({ timezone, date }, storage);
      return {
        content: [
          {
            type: "text", 
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_switch_context
   * 
   * Switches between daily, weekly, and monthly tide contexts for the same
   * underlying workflow data. Core functionality for hierarchical tide navigation.
   * 
   * Following service_noun_verb pattern: tide_switch_context
   */
  server.registerTool(
    "tide_switch_context",
    {
      title: "Switch Tide Context",
      description: "Switch between daily, weekly, and monthly views of the same workflow data. Enables seamless navigation between different time-scale perspectives with automatic context creation and hierarchical relationships.",
      inputSchema: {
        context: z.enum(["daily", "weekly", "monthly"]).describe("Target time context to switch to"),
        date: z.string().optional().describe("ISO date for context (defaults to today)"),
        create_if_missing: z.boolean().optional().default(true).describe("Create context if it doesn't exist"),
      },
    },
    async ({ context, date, create_if_missing }) => {
      const result = await tideTools.tideSwitchContext({ context, date, create_if_missing }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_list_contexts
   * 
   * Lists available tide contexts for a given date with metadata about
   * each context's content and activity levels.
   * 
   * Following service_noun_verb pattern: tide_list_contexts
   */
  server.registerTool(
    "tide_list_contexts", 
    {
      title: "List Tide Contexts",
      description: "List available tide contexts (daily, weekly, monthly) for a given date with activity metadata. Shows which contexts exist, their flow session counts, and creation availability for context navigation UI.",
      inputSchema: {
        date: z.string().optional().describe("ISO date to check contexts for (defaults to today)"),
        include_empty: z.boolean().optional().default(true).describe("Include contexts with no flow sessions"),
      },
    },
    async ({ date, include_empty }) => {
      const result = await tideTools.tideListContexts({ date, include_empty }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_start_hierarchical_flow
   * 
   * Starts a flow session that automatically distributes across all relevant
   * hierarchical contexts (daily, weekly, monthly). This is the enhanced flow
   * function that implements the core ADR-003 hierarchical tide pattern.
   * 
   * Following service_noun_verb pattern: tide_start_hierarchical_flow
   */
  server.registerTool(
    "tide_start_hierarchical_flow",
    {
      title: "Start Hierarchical Flow",
      description: "Start a flow session that automatically distributes to daily, weekly, and monthly contexts simultaneously. Implements the hierarchical tide pattern where one flow session contributes to all relevant time scales with automatic context creation.",
      inputSchema: {
        intensity: z.enum(["gentle", "moderate", "strong"]).optional().default("moderate").describe("Work intensity level"),
        duration: z.number().optional().default(25).describe("Session duration in minutes"),
        initial_energy: z.string().optional().default("medium").describe("Starting energy level"),
        work_context: z.string().optional().default("General work").describe("Description of work being done"),
        date: z.string().optional().describe("Date for the session (defaults to today)"),
      },
    },
    async ({ intensity, duration, initial_energy, work_context, date }) => {
      const result = await tideTools.startHierarchicalFlow({ 
        intensity, 
        duration, 
        initial_energy, 
        work_context, 
        date 
      }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  /**
   * MCP Tool: tide_get_todays_summary
   * 
   * Gets a summary of today's hierarchical tide contexts showing activity
   * across daily, weekly, and monthly views for dashboard displays.
   * 
   * Following service_noun_verb pattern: tide_get_todays_summary
   */
  server.registerTool(
    "tide_get_todays_summary",
    {
      title: "Get Today's Context Summary",
      description: "Get a summary of today's hierarchical tide contexts showing flow sessions and activity across daily, weekly, and monthly views. Perfect for dashboard displays and activity overviews.",
      inputSchema: {
        date: z.string().optional().describe("Date to get context summary for (defaults to today)"),
      },
    },
    async ({ date }) => {
      const result = await tideTools.getTodaysContextSummary({ date }, storage);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}