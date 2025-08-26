/**
 * @fileoverview Direct Access Interface for Tides MCP Tools
 * 
 * This module provides a unified interface for directly calling MCP tools without
 * going through the MCP server layer. It maintains the same validation and
 * functionality as the MCP tools while providing a more convenient programmatic API.
 * 
 * Key features:
 * - Type-safe method calls with full TypeScript support
 * - Consistent validation using shared Zod schemas
 * - Unified error handling and response formatting
 * - No MCP overhead for direct programmatic access
 * - Maintains backward compatibility with existing tool functions
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import type { TideStorage } from '../storage';
import * as tideTools from './index';
import {
  validateInput,
  CreateTideSchema,
  ListTidesSchema,
  TideFlowSchema,
  AddEnergySchema,
  LinkTaskSchema,
  ListTaskLinksSchema,
  GetReportSchema,
  GetRawJsonSchema,
  GetParticipantsSchema,
  type CreateTideInput,
  type ListTidesInput,
  type TideFlowInput,
  type AddEnergyInput,
  type LinkTaskInput,
  type ListTaskLinksInput,
  type GetReportInput,
  type GetRawJsonInput,
  type GetParticipantsInput,
} from './validation';

/**
 * Standard response wrapper for all direct access methods
 * Maintains consistency with MCP tool response patterns
 */
type DirectAccessResponse<T> = {
  success: true;
  data: T;
  timestamp: string;
} | {
  success: false;
  error: string;
  timestamp: string;
};

/**
 * Direct access interface for all Tides MCP tools
 * 
 * Provides a unified, type-safe way to call all MCP tools directly
 * without MCP server overhead. Each method corresponds to an MCP tool
 * and maintains the same validation and functionality.
 * 
 * @example
 * ```typescript
 * const directAccess = new DirectToolAccess(storage);
 * 
 * // Create a new tide
 * const result = await directAccess.createTide({
 *   name: "Daily Standup",
 *   flow_type: "daily",
 *   description: "Morning preparation"
 * });
 * 
 * if (result.success) {
 *   console.log('Created tide:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export class DirectToolAccess {
  private storage: TideStorage;

  constructor(storage: TideStorage) {
    this.storage = storage;
  }

  /**
   * Create a new tide (workflow/project)
   * 
   * @param params - Tide creation parameters
   * @returns Promise resolving to creation result
   */
  async createTide(params: CreateTideInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(CreateTideSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.createTide(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * List tides with optional filtering
   * 
   * @param params - Filtering parameters
   * @returns Promise resolving to tide list
   */
  async listTides(params: ListTidesInput = {}): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(ListTidesSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.listTides(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Start a focused work session within a tide
   * 
   * @param params - Flow session parameters
   * @returns Promise resolving to session details
   */
  async startTideFlow(params: TideFlowInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(TideFlowSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.startTideFlow(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Add energy level check-in to a tide
   * 
   * @param params - Energy update parameters
   * @returns Promise resolving to energy update result
   */
  async addTideEnergy(params: AddEnergyInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(AddEnergySchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.addTideEnergy(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Link external task to a tide
   * 
   * @param params - Task linking parameters
   * @returns Promise resolving to link result
   */
  async linkTideTask(params: LinkTaskInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(LinkTaskSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.linkTideTask(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * List all task links for a tide
   * 
   * @param params - Tide ID parameter
   * @returns Promise resolving to task links list
   */
  async listTideTaskLinks(params: ListTaskLinksInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(ListTaskLinksSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.listTideTaskLinks(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Generate comprehensive tide report
   * 
   * @param params - Report generation parameters
   * @returns Promise resolving to report data
   */
  async getTideReport(params: GetReportInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(GetReportSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.getTideReport(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Get complete raw JSON data for a tide
   * 
   * @param params - Tide ID parameter
   * @returns Promise resolving to raw JSON data
   */
  async getTideRawJson(params: GetRawJsonInput): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(GetRawJsonSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.getTideRawJson(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }

  /**
   * Get participants for multi-user support
   * 
   * @param params - Participant filtering parameters
   * @returns Promise resolving to participants list
   */
  async getParticipants(params: GetParticipantsInput = {}): Promise<DirectAccessResponse<any>> {
    const timestamp = new Date().toISOString();
    
    // Validate input
    const validation = validateInput(GetParticipantsSchema, params);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        timestamp,
      };
    }

    try {
      const result = await tideTools.getParticipants(params, this.storage);
      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };
    }
  }
}

/**
 * Factory function to create a DirectToolAccess instance
 * 
 * @param storage - Storage instance for tool operations
 * @returns New DirectToolAccess instance
 * 
 * @example
 * ```typescript
 * const directAccess = createDirectToolAccess(storage);
 * const result = await directAccess.createTide({...});
 * ```
 */
export function createDirectToolAccess(storage: TideStorage): DirectToolAccess {
  return new DirectToolAccess(storage);
}

/**
 * Type definitions for tool method names
 * Useful for type-safe dynamic method calls
 */
export type ToolMethodName = keyof DirectToolAccess;

/**
 * Helper type to extract the parameter type for any tool method
 */
export type ToolMethodParams<T extends ToolMethodName> = 
  DirectToolAccess[T] extends (params: infer P) => any ? P : never;

/**
 * Helper type to extract the return type for any tool method
 */
export type ToolMethodReturn<T extends ToolMethodName> = 
  DirectToolAccess[T] extends (...args: any[]) => infer R ? R : never;