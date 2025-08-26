/**
 * @fileoverview Mobile Tool Registry Service
 * 
 * Provides direct tool access functionality for the mobile app, mirroring
 * the server's DirectToolAccess and ToolRegistry pattern. This service
 * bridges the gap between mobile UI and server MCP tools while providing
 * enhanced features like dynamic discovery and validation.
 * 
 * @author Tides Mobile Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import { LoggingService } from './LoggingService';
import { BaseService } from './base/BaseService';
import type { 
  FlowIntensity, 
  FlowType,
  EnergyLevel,
  TideCreateResponse,
  FlowSessionResponse,
  EnergyUpdate,
  TaskLinkResponse,
  TaskLinksResponse,
  TideReportResponse,
  ParticipantsResponse
} from '../types';

/**
 * Tool metadata for mobile display and validation
 */
export interface MobileToolMetadata {
  name: string;
  displayName: string;
  description: string;
  category: 'core' | 'sessions' | 'tasks' | 'analytics';
  icon: string; // Lucide icon name
  mcpToolName: string;
  parameters: ToolParameter[];
}

/**
 * Parameter definition for tool validation and UI generation
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description: string;
  options?: string[]; // For enum types
  defaultValue?: any;
}

/**
 * Result of tool execution with mobile-specific metadata
 */
export interface MobileToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  toolName: string;
  executionTime: number;
  displayMessage?: string; // User-friendly message for mobile UI
}

/**
 * Mobile Tool Registry Service
 * 
 * Provides dynamic tool discovery, validation, and execution for the mobile app.
 * Acts as a bridge between the mobile UI and server MCP tools while adding
 * mobile-specific enhancements like better error messages and UI metadata.
 */
export class ToolRegistryService extends BaseService {
  private static readonly SERVICE_NAME = "ToolRegistryService";
  private static instance: ToolRegistryService | null = null;
  private toolMetadata: Map<string, MobileToolMetadata>;

  constructor() {
    super({ baseUrl: "" }); // Not used for tool registry
    this.toolMetadata = new Map();
    this.initializeRegistry();
  }

  /**
   * Singleton pattern
   */
  static getInstance(): ToolRegistryService {
    if (!ToolRegistryService.instance) {
      ToolRegistryService.instance = new ToolRegistryService();
    }
    return ToolRegistryService.instance;
  }

  /**
   * Initialize the tool registry with all available tools
   */
  private initializeRegistry(): void {
    const tools: MobileToolMetadata[] = [
      {
        name: 'createTide',
        displayName: 'Create Tide',
        description: 'Create a new tidal workflow for rhythmic productivity',
        category: 'core',
        icon: 'Plus',
        mcpToolName: 'tide_create',
        parameters: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name of the tide workflow'
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Optional description of the tide'
          },
          {
            name: 'flowType',
            type: 'enum',
            required: false,
            description: 'Type of flow rhythm',
            options: ['daily', 'weekly', 'project', 'seasonal'],
            defaultValue: 'project'
          }
        ]
      },
      {
        name: 'listTides',
        displayName: 'List Tides',
        description: 'List all tidal workflows with optional filtering',
        category: 'core',
        icon: 'Waves',
        mcpToolName: 'tide_list',
        parameters: []
      },
      {
        name: 'startTideFlow',
        displayName: 'Start Flow',
        description: 'Start a focused work session within a tide',
        category: 'sessions',
        icon: 'Clock',
        mcpToolName: 'tide_flow',
        parameters: [
          {
            name: 'tideId',
            type: 'string',
            required: true,
            description: 'ID of the tide to start flowing'
          },
          {
            name: 'intensity',
            type: 'enum',
            required: false,
            description: 'Flow intensity level',
            options: ['gentle', 'moderate', 'strong'],
            defaultValue: 'moderate'
          },
          {
            name: 'duration',
            type: 'number',
            required: false,
            description: 'Duration in minutes',
            defaultValue: 25
          },
          {
            name: 'energyLevel',
            type: 'enum',
            required: false,
            description: 'Initial energy level',
            options: ['low', 'medium', 'high'],
            defaultValue: 'high'
          },
          {
            name: 'workContext',
            type: 'string',
            required: false,
            description: 'Context or focus area for this session',
            defaultValue: 'General work'
          }
        ]
      },
      {
        name: 'addEnergyToTide',
        displayName: 'Add Energy',
        description: 'Record energy level check-in to a tide',
        category: 'sessions',
        icon: 'Zap',
        mcpToolName: 'tide_add_energy',
        parameters: [
          {
            name: 'tideId',
            type: 'string',
            required: true,
            description: 'ID of the tide'
          },
          {
            name: 'energyLevel',
            type: 'enum',
            required: true,
            description: 'Current energy level',
            options: ['low', 'medium', 'high']
          },
          {
            name: 'context',
            type: 'string',
            required: false,
            description: 'Additional context for the energy check-in'
          }
        ]
      },
      {
        name: 'linkTaskToTide',
        displayName: 'Link Task',
        description: 'Link external tasks to a tide for integrated workflow management',
        category: 'tasks',
        icon: 'Link',
        mcpToolName: 'tide_link_task',
        parameters: [
          {
            name: 'tideId',
            type: 'string',
            required: true,
            description: 'ID of the tide'
          },
          {
            name: 'taskUrl',
            type: 'string',
            required: true,
            description: 'URL of the external task'
          },
          {
            name: 'taskTitle',
            type: 'string',
            required: true,
            description: 'Title of the task'
          },
          {
            name: 'taskType',
            type: 'string',
            required: false,
            description: 'Type of task (e.g., github_issue, obsidian_note)'
          }
        ]
      },
      {
        name: 'getTaskLinks',
        displayName: 'View Task Links',
        description: 'List all external tasks linked to a specific tide',
        category: 'tasks',
        icon: 'FileText',
        mcpToolName: 'tide_list_task_links',
        parameters: [
          {
            name: 'tideId',
            type: 'string',
            required: true,
            description: 'ID of the tide'
          }
        ]
      },
      {
        name: 'getTideReport',
        displayName: 'Get Report',
        description: 'Generate comprehensive tide reports for analytics',
        category: 'analytics',
        icon: 'BarChart3',
        mcpToolName: 'tide_get_report',
        parameters: [
          {
            name: 'tideId',
            type: 'string',
            required: true,
            description: 'ID of the tide'
          },
          {
            name: 'format',
            type: 'enum',
            required: false,
            description: 'Report format',
            options: ['json', 'markdown', 'csv'],
            defaultValue: 'json'
          }
        ]
      },
      {
        name: 'getTideParticipants',
        displayName: 'View Participants',
        description: 'Get participants for multi-user support and team management',
        category: 'analytics',
        icon: 'Users',
        mcpToolName: 'tides_get_participants',
        parameters: [
          {
            name: 'statusFilter',
            type: 'string',
            required: false,
            description: 'Filter by status (e.g., active, pending)'
          },
          {
            name: 'dateFrom',
            type: 'string',
            required: false,
            description: 'Start date (ISO format)'
          },
          {
            name: 'dateTo',
            type: 'string',
            required: false,
            description: 'End date (ISO format)'
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum records to return',
            defaultValue: 100
          }
        ]
      }
    ];

    for (const tool of tools) {
      this.toolMetadata.set(tool.name, tool);
    }

    LoggingService.info(
      ToolRegistryService.SERVICE_NAME,
      "Tool registry initialized",
      { toolCount: tools.length }
    );
  }

  /**
   * Get all available tool names
   */
  getToolNames(): string[] {
    return Array.from(this.toolMetadata.keys());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category?: string): Record<string, MobileToolMetadata[]> {
    const allTools = Array.from(this.toolMetadata.values());
    
    if (category) {
      return { [category]: allTools.filter(tool => tool.category === category) };
    }

    const grouped: Record<string, MobileToolMetadata[]> = {};
    for (const tool of allTools) {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    }

    return grouped;
  }

  /**
   * Get metadata for a specific tool
   */
  getToolMetadata(toolName: string): MobileToolMetadata | undefined {
    return this.toolMetadata.get(toolName);
  }

  /**
   * Find tool by partial name match
   */
  findToolByPartialName(partialName: string): string | undefined {
    const tools = this.getToolNames();
    
    // Exact match first
    if (tools.includes(partialName)) {
      return partialName;
    }

    // Partial match (case insensitive)
    const matches = tools.filter(name => 
      name.toLowerCase().includes(partialName.toLowerCase())
    );

    return matches.length === 1 ? matches[0] : undefined;
  }

  /**
   * Validate parameters for a specific tool
   */
  validateToolParams(toolName: string, params: Record<string, any>): 
    { success: true; validatedParams: Record<string, any> } | { success: false; error: string } {
    
    const metadata = this.toolMetadata.get(toolName);
    if (!metadata) {
      return { success: false, error: `Tool '${toolName}' not found in registry` };
    }

    const validatedParams: Record<string, any> = {};
    const errors: string[] = [];

    // Check required parameters
    for (const param of metadata.parameters) {
      const value = params[param.name];

      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required parameter '${param.name}' is missing`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type validation
        switch (param.type) {
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`Parameter '${param.name}' must be a number`);
            } else {
              validatedParams[param.name] = numValue;
            }
            break;
          case 'boolean':
            if (typeof value === 'boolean') {
              validatedParams[param.name] = value;
            } else if (typeof value === 'string') {
              validatedParams[param.name] = value.toLowerCase() === 'true';
            } else {
              errors.push(`Parameter '${param.name}' must be a boolean`);
            }
            break;
          case 'enum':
            if (param.options && !param.options.includes(value)) {
              errors.push(`Parameter '${param.name}' must be one of: ${param.options.join(', ')}`);
            } else {
              validatedParams[param.name] = value;
            }
            break;
          default:
            validatedParams[param.name] = String(value);
        }
      } else if (param.defaultValue !== undefined) {
        validatedParams[param.name] = param.defaultValue;
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join('; ') };
    }

    return { success: true, validatedParams };
  }

  /**
   * Execute a tool dynamically using the existing mcpService
   */
  async execute(toolName: string, params: Record<string, any> = {}): Promise<MobileToolExecutionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    LoggingService.info(
      ToolRegistryService.SERVICE_NAME,
      "Executing tool via registry",
      { toolName, params }
    );

    // Validate parameters
    const validation = this.validateToolParams(toolName, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
        toolName,
        executionTime: Date.now() - startTime,
        displayMessage: `Invalid parameters: ${validation.error}`
      };
    }

    try {
      let result: any;
      const validatedParams = validation.validatedParams;

      // Dynamically import mcpService to avoid circular dependency
      const { mcpService } = await import('./mcpService');

      // Route to appropriate mcpService method
      switch (toolName) {
        case 'createTide':
          result = await mcpService.createTide(
            validatedParams.name,
            validatedParams.description,
            validatedParams.flowType
          );
          break;
        case 'listTides':
          result = await mcpService.listTides();
          break;
        case 'startTideFlow':
          result = await mcpService.startTideFlow(
            validatedParams.tideId,
            validatedParams.intensity,
            validatedParams.duration,
            validatedParams.energyLevel,
            validatedParams.workContext
          );
          break;
        case 'addEnergyToTide':
          result = await mcpService.addEnergyToTide(
            validatedParams.tideId,
            validatedParams.energyLevel,
            validatedParams.context
          );
          break;
        case 'linkTaskToTide':
          result = await mcpService.linkTaskToTide(
            validatedParams.tideId,
            validatedParams.taskUrl,
            validatedParams.taskTitle,
            validatedParams.taskType
          );
          break;
        case 'getTaskLinks':
          result = await mcpService.listTaskLinks(validatedParams.tideId);
          break;
        case 'getTideReport':
          result = await mcpService.getTideReport(
            validatedParams.tideId,
            validatedParams.format
          );
          break;
        case 'getTideParticipants':
          result = await mcpService.getTideParticipants(
            validatedParams.statusFilter,
            validatedParams.dateFrom,
            validatedParams.dateTo,
            validatedParams.limit
          );
          break;
        default:
          throw new Error(`Tool '${toolName}' not implemented in registry`);
      }

      const executionTime = Date.now() - startTime;
      const metadata = this.getToolMetadata(toolName);

      return {
        success: true,
        data: result,
        timestamp,
        toolName,
        executionTime,
        displayMessage: `${metadata?.displayName || toolName} executed successfully`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      LoggingService.error(
        ToolRegistryService.SERVICE_NAME,
        "Tool execution failed",
        { error: errorMessage, toolName, params }
      );

      return {
        success: false,
        error: errorMessage,
        timestamp,
        toolName,
        executionTime,
        displayMessage: `Failed to execute tool: ${errorMessage}`
      };
    }
  }

  /**
   * Get registry statistics
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
}

// Export singleton instance for easy access
export const toolRegistryService = ToolRegistryService.getInstance();