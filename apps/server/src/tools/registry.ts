/**
 * @fileoverview Tool Registry for Dynamic MCP Tool Discovery and Execution
 * 
 * This module provides a centralized registry for dynamically discovering and
 * executing MCP tools. It enables runtime tool discovery, metadata access,
 * and type-safe dynamic execution while maintaining full compatibility with
 * both MCP and direct access patterns.
 * 
 * Key features:
 * - Dynamic tool discovery and enumeration
 * - Runtime tool metadata access (schemas, descriptions)
 * - Type-safe dynamic tool execution
 * - Tool validation and error handling
 * - Integration with both MCP and direct access patterns
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import type { TideStorage } from '../storage';
import { DirectToolAccess, type ToolMethodName } from './direct-access';
import {
  ValidationSchemas,
  validateInput,
  type ValidatedToolName,
} from './validation';
import type { z } from 'zod';

/**
 * Metadata for a registered tool including schema and description
 */
export interface ToolMetadata {
  name: string;
  description: string;
  schema: z.ZodSchema<any>;
  category: 'core' | 'sessions' | 'tasks' | 'analytics';
  mcpToolName: string;
  methodName: ToolMethodName;
}

/**
 * Result of tool execution with metadata
 */
export interface ToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  toolName: string;
  executionTime: number;
}

/**
 * Tool registry for dynamic MCP tool discovery and execution
 * 
 * Provides a unified interface for discovering available tools, accessing
 * their metadata, and executing them dynamically. Useful for building
 * dynamic UIs, API gateways, or debugging tools.
 * 
 * @example
 * ```typescript
 * const registry = new ToolRegistry(storage);
 * 
 * // Discover available tools
 * const tools = registry.getToolNames();
 * 
 * // Get tool metadata
 * const metadata = registry.getToolMetadata('createTide');
 * 
 * // Execute tool dynamically
 * const result = await registry.execute('createTide', {
 *   name: "New Tide",
 *   flow_type: "daily"
 * });
 * ```
 */
export class ToolRegistry {
  private storage: TideStorage;
  private directAccess: DirectToolAccess;
  private toolMetadata: Map<string, ToolMetadata>;

  constructor(storage: TideStorage) {
    this.storage = storage;
    this.directAccess = new DirectToolAccess(storage);
    this.toolMetadata = new Map();
    this.initializeRegistry();
  }

  /**
   * Initialize the tool registry with all available tools
   */
  private initializeRegistry(): void {
    const tools: ToolMetadata[] = [
      {
        name: 'createTide',
        description: 'Create a new tidal workflow for rhythmic productivity. Use when users want to start a new workflow, project, or productivity cycle.',
        schema: ValidationSchemas.createTide,
        category: 'core',
        mcpToolName: 'tide_create',
        methodName: 'createTide',
      },
      {
        name: 'listTides',
        description: 'List all tidal workflows with optional filtering by flow type and active status. Perfect for dashboard views and workflow management.',
        schema: ValidationSchemas.listTides,
        category: 'core',
        mcpToolName: 'tide_list',
        methodName: 'listTides',
      },
      {
        name: 'startTideFlow',
        description: 'Start or continue a focused work session within a tidal workflow. Core Pomodoro/focus functionality for productivity apps.',
        schema: ValidationSchemas.startTideFlow,
        category: 'sessions',
        mcpToolName: 'tide_flow',
        methodName: 'startTideFlow',
      },
      {
        name: 'addTideEnergy',
        description: 'Record energy level check-in to an active tide for mood and energy tracking. Use for capturing subjective energy states during workflows.',
        schema: ValidationSchemas.addTideEnergy,
        category: 'sessions',
        mcpToolName: 'tide_add_energy',
        methodName: 'addTideEnergy',
      },
      {
        name: 'linkTideTask',
        description: 'Link external tasks (GitHub issues, Obsidian notes, Linear tickets) to a tide for integrated workflow management.',
        schema: ValidationSchemas.linkTideTask,
        category: 'tasks',
        mcpToolName: 'tide_link_task',
        methodName: 'linkTideTask',
      },
      {
        name: 'listTideTaskLinks',
        description: 'List all external tasks linked to a specific tide for task relationship display. Shows connected GitHub issues, notes, and other work items.',
        schema: ValidationSchemas.listTideTaskLinks,
        category: 'tasks',
        mcpToolName: 'tide_list_task_links',
        methodName: 'listTideTaskLinks',
      },
      {
        name: 'getTideReport',
        description: 'Generate comprehensive tide reports in multiple formats (JSON, Markdown, CSV) for analytics and progress tracking.',
        schema: ValidationSchemas.getTideReport,
        category: 'analytics',
        mcpToolName: 'tide_get_report',
        methodName: 'getTideReport',
      },
      {
        name: 'getTideRawJson',
        description: 'Retrieve complete raw JSON data for a tide from R2 storage including all nested arrays for data export and debugging.',
        schema: ValidationSchemas.getTideRawJson,
        category: 'analytics',
        mcpToolName: 'tide_get_raw_json',
        methodName: 'getTideRawJson',
      },
      {
        name: 'getParticipants',
        description: 'Get participants from database with filtering for multi-user support and team management.',
        schema: ValidationSchemas.getParticipants,
        category: 'analytics',
        mcpToolName: 'tides_get_participants',
        methodName: 'getParticipants',
      },
    ];

    for (const tool of tools) {
      this.toolMetadata.set(tool.name, tool);
    }
  }

  /**
   * Get all available tool names
   * 
   * @returns Array of tool names
   */
  getToolNames(): string[] {
    return Array.from(this.toolMetadata.keys());
  }

  /**
   * Get tools by category
   * 
   * @param category - Tool category to filter by
   * @returns Array of tool names in the category
   */
  getToolsByCategory(category: ToolMetadata['category']): string[] {
    return Array.from(this.toolMetadata.values())
      .filter(tool => tool.category === category)
      .map(tool => tool.name);
  }

  /**
   * Get metadata for a specific tool
   * 
   * @param toolName - Name of the tool
   * @returns Tool metadata or undefined if not found
   */
  getToolMetadata(toolName: string): ToolMetadata | undefined {
    return this.toolMetadata.get(toolName);
  }

  /**
   * Get all tool metadata
   * 
   * @returns Array of all tool metadata
   */
  getAllToolMetadata(): ToolMetadata[] {
    return Array.from(this.toolMetadata.values());
  }

  /**
   * Check if a tool exists in the registry
   * 
   * @param toolName - Name of the tool to check
   * @returns True if tool exists, false otherwise
   */
  hasToolName(toolName: string): boolean {
    return this.toolMetadata.has(toolName);
  }

  /**
   * Get the validation schema for a tool
   * 
   * @param toolName - Name of the tool
   * @returns Zod schema or undefined if tool not found
   */
  getToolSchema(toolName: string): z.ZodSchema<any> | undefined {
    const metadata = this.toolMetadata.get(toolName);
    return metadata?.schema;
  }

  /**
   * Validate parameters for a specific tool
   * 
   * @param toolName - Name of the tool
   * @param params - Parameters to validate
   * @returns Validation result
   */
  validateToolParams(toolName: string, params: unknown): 
    { success: true; data: any } | { success: false; error: string } {
    const schema = this.getToolSchema(toolName);
    if (!schema) {
      return { success: false, error: `Tool '${toolName}' not found in registry` };
    }

    return validateInput(schema, params);
  }

  /**
   * Execute a tool dynamically by name
   * 
   * @param toolName - Name of the tool to execute
   * @param params - Parameters for the tool
   * @returns Tool execution result
   */
  async execute(toolName: string, params: unknown = {}): Promise<ToolExecutionResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    // Check if tool exists
    const metadata = this.toolMetadata.get(toolName);
    if (!metadata) {
      return {
        success: false,
        error: `Tool '${toolName}' not found in registry`,
        timestamp,
        toolName,
        executionTime: performance.now() - startTime,
      };
    }

    // Validate parameters
    const validation = this.validateToolParams(toolName, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
        toolName,
        executionTime: performance.now() - startTime,
      };
    }

    try {
      // Execute the tool using direct access
      const methodName = metadata.methodName;
      const method = this.directAccess[methodName] as Function;
      
      if (!method) {
        return {
          success: false,
          error: `Method '${methodName}' not found in DirectToolAccess`,
          timestamp,
          toolName,
          executionTime: performance.now() - startTime,
        };
      }

      const result = await method.call(this.directAccess, params);
      const executionTime = performance.now() - startTime;

      if (result.success) {
        return {
          success: true,
          data: result.data,
          timestamp,
          toolName,
          executionTime,
        };
      } else {
        return {
          success: false,
          error: result.error,
          timestamp,
          toolName,
          executionTime,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        timestamp,
        toolName,
        executionTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Get tool execution statistics
   * 
   * @returns Registry statistics
   */
  getRegistryStats(): {
    totalTools: number;
    toolsByCategory: Record<string, number>;
    availableCategories: string[];
  } {
    const tools = Array.from(this.toolMetadata.values());
    const toolsByCategory: Record<string, number> = {};
    
    for (const tool of tools) {
      toolsByCategory[tool.category] = (toolsByCategory[tool.category] || 0) + 1;
    }

    return {
      totalTools: tools.length,
      toolsByCategory,
      availableCategories: Object.keys(toolsByCategory),
    };
  }

  /**
   * Generate OpenAPI-style documentation for all tools
   * 
   * @returns Documentation object suitable for API documentation
   */
  generateDocumentation(): Record<string, any> {
    const docs: Record<string, any> = {};
    
    for (const [toolName, metadata] of this.toolMetadata.entries()) {
      docs[toolName] = {
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        mcpToolName: metadata.mcpToolName,
        schema: metadata.schema._def, // Zod schema definition
      };
    }

    return docs;
  }
}

/**
 * Factory function to create a ToolRegistry instance
 * 
 * @param storage - Storage instance for tool operations
 * @returns New ToolRegistry instance
 */
export function createToolRegistry(storage: TideStorage): ToolRegistry {
  return new ToolRegistry(storage);
}