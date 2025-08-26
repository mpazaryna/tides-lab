/**
 * @fileoverview Example MCP Handlers - Demo Tools and Resources
 * 
 * This module handles the registration of example MCP tools and resources
 * for demonstration and reference purposes. Includes the classic dice roll tool
 * and app config resource examples from MCP documentation.
 * 
 * Can be removed in production but useful for MCP learning and testing.
 * 
 * @author Tides Development Team
 * @version 2.1.0
 * @since 2025-08-07
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register example MCP tools and resources with the server
 * 
 * Includes reference implementations from MCP documentation:
 * - Dice roll tool for basic tool testing
 * - App config resource for resource pattern demonstration
 * - Code review prompt for prompt pattern demonstration
 * 
 * @param server - The MCP server instance to register examples with
 */
export function registerExampleHandlers(server: McpServer) {
  // Example tool: Roll dice for testing basic tool functionality
  server.registerTool(
    "roll_dice",
    {
      title: "Roll Dice",
      description: "Rolls an N-sided dice for testing basic MCP tool functionality. Use for demonstrating tool calls and random number generation.",
      inputSchema: { sides: z.number().int().min(2) },
    },
    ({ sides }) => ({
      content: [
        {
          type: "text",
          text: `🎲 You rolled a ${1 + Math.floor(Math.random() * sides)}!`,
        },
      ],
    }),
  );

  // Example resource: App Config for testing resource functionality
  server.registerResource(
    "app_config",
    "app://config",
    {
      title: "App Config",
      description: "Application configuration: API keys and user settings",
      mimeType: "text/plain",
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: "<APP_CONFIG>",
        },
      ],
    }),
  );

  // Example prompt: Code Review for testing prompt functionality
  server.registerPrompt(
    "review_code",
    {
      title: "Review Code",
      description: "Review code for best practices and potential issues",
      argsSchema: { code: z.string() },
    },
    ({ code }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review this code:\n\n${code}`,
          },
        },
      ],
    }),
  );
}