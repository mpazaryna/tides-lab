/**
 * @fileoverview Tides MCP Server - Model Context Protocol server for tidal workflow management
 * 
 * This module provides the MCP (Model Context Protocol) server implementation that exposes
 * tidal workflow management tools to AI models and React Native applications. The server
 * acts as a bridge between the core business logic in tools/tides.ts and external clients.
 * 
 * ## MCP Tool Reference for React Native Integration
 * 
 * 
 * | MCP Tool Name            | Function                     | Purpose |
 * |--------------------------|------------------------------|-----------------------------------|
 * | `tide_create`            | Creates new workflow/project | Main tide creation                |
 * | `tide_list`              | Lists tides with filtering   | Perfect for FlatList data         |
 * | `tide_flow`              | Starts flow session          | Core Pomodoro/focus functionality |
 * | `tide_add_energy`        | Records energy levels        | Mood/energy tracking              |
 * | `tide_link_task`         | Links external tasks         | GitHub/Linear integration         |
 * | `tide_list_task_links`   | Lists linked tasks           | Task relationship display         |
 * | `tide_get_report`        | Generates analytics          | Dashboard/progress data           |
 * | `tide_get_raw_json`      | Gets complete raw JSON       | Export/debugging data             |
 * | `tides_get_participants` | Lists all users              | Multi-user support                |
 * | `auth_validate_key`      | Validates API keys           | Multi-user auth testing           |
 * 
 * ## MCP Prompts for Analysis
 * 
 * | Prompt Name             | Purpose                             | Use Case                         |
 * |-------------------------|-------------------------------------|----------------------------------|
 * | `analyze_tide`          | Comprehensive tide analysis         | Productivity patterns & insights |
 * | `productivity_insights` | Time-based performance analysis     | Progress tracking & comparisons  |
 * | `optimize_energy`       | Energy management recommendations   | Workflow optimization            |
 * | `team_insights`         | Collaborative workflow analysis     | Team productivity metrics        |
 * | `custom_tide_analysis`  | Flexible analysis questions         | Custom reporting needs           |
 * 
 * ## MCP Resources
 * 
 * | Resource Name | URI            | Purpose                       |
 * |---------------|----------------|-------------------------------|
 * | `app_config`  | `app://config` | Application configuration data |
 * 
 * ## React Native Usage Pattern
 * 
 * ```typescript
 * // Example: Creating a new tide
 * const result = await mcpClient.callTool('tide_create', {
 *   name: "Daily Standup Prep",
 *   flow_type: "daily",
 *   description: "Prepare talking points for standup"
 * });
 * 
 * // Example: Getting tides for FlatList
 * const tidesResult = await mcpClient.callTool('tide_list', {
 *   flow_type: "daily",
 *   active_only: true
 * });
 * ```
 * 
 * ## Key Differences from tools/tides.ts
 * 
 * - **MCP tool names** use underscore convention (`tide_create` vs `createTide`)
 * - **Input validation** using Zod schemas for type safety
 * - **Standardized responses** with consistent error handling
 * - **Authentication context** automatically applied from server
 * - **Storage abstraction** handled transparently
 * 
 * ## Authentication
 * 
 * The server automatically applies authentication context to all operations.
 * React Native clients should provide bearer tokens in the Authorization header.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-02-01
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createStorage } from "./storage";
import type { AuthContext } from "./storage/d1-r2";
// Use any for Env to avoid type conflicts in different environments
type Env = any;

// Import handler modules for clean separation of concerns
import { registerTideTools } from "./handlers/tools";
import { registerAuthHandlers } from "./handlers/auth";
import { registerPromptHandlers } from "./handlers/prompts";
import { registerExampleHandlers } from "./handlers/examples";

// Package info - in production this comes from package.json via build process
const packageJson = { name: "tides", version: "0.0.1" };

/**
 * Creates and configures the Tides MCP server with all tools registered
 * 
 * @description Factory function that creates a fully configured MCP server instance
 * with all tide management tools registered. This is the main entry point for
 * React Native applications and AI models to interact with the tidal workflow system.
 * 
 * @param {Env} env - Cloudflare Workers environment containing bindings and secrets
 * @param {AuthContext|null} [authContext] - Optional authentication context for multi-user support
 * 
 * @returns {McpServer} Fully configured MCP server with all tools registered
 * 
 * @example
 * // React Native integration - this is handled by the Worker, but shows the concept
 * const server = createServer(env, { userId: "user123", email: "user@example.com" });
 * 
 * // The server provides these MCP tools for React Native:
 * // - tide_create: Create new workflows
 * // - tide_list: Get tides for FlatList display  
 * // - tide_flow: Start Pomodoro sessions
 * // - tide_add_energy: Track mood/energy
 * // - tide_link_task: Connect GitHub/Linear tasks
 * // - tide_list_task_links: Show task relationships
 * // - tide_get_report: Analytics dashboard data
 * // - tides_get_participants: Multi-user support
 * 
 * @since 1.0.0
 */
export function createServer(env: Env, authContext?: AuthContext | null) {
  const server = new McpServer({
    title: "Tides",
    name: packageJson.name,
    version: packageJson.version,
  });

  const storage = createStorage(env);
  
  // Set auth context on storage if provided and storage supports it
  if (authContext && 'setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
    (storage as any).setAuthContext(authContext);
  }

  // Register all tool categories using handler modules
  registerTideTools(server, storage);
  registerAuthHandlers(server, storage);
  registerPromptHandlers(server, storage, authContext);
  registerExampleHandlers(server);


  return server;
}

// Export factory function only - backwards compatibility removed for Phase 2