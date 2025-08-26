/**
 * @fileoverview Core Tide Management Tools
 * 
 * This module contains the fundamental tide creation and management tools that form
 * the backbone of the Tides workflow system. These tools handle the basic CRUD
 * operations for tidal workflows and their lifecycle management.
 * 
 * ## Core Concepts
 * 
 * ### Tide Workflows
 * A **tide** represents a recurring workflow or project pattern with its own rhythm:
 * - **Daily tides**: Recurring daily activities (standup prep, morning routine)
 * - **Weekly tides**: Weekly patterns (planning, reviews, retrospectives)  
 * - **Project tides**: One-time or irregular projects with defined scope
 * - **Seasonal tides**: Long-term cyclical workflows (quarterly reviews, annual planning)
 * 
 * ### Tide Lifecycle
 * ```
 * Create → Active → [Flow Sessions] → [Completed/Paused]
 * ```
 * 
 * - **Active**: Tide is running and can accept flow sessions
 * - **Completed**: Tide has finished (project completed, goal achieved)
 * - **Paused**: Temporarily inactive but may resume later
 * 
 * ### Data Model
 * ```typescript
 * interface Tide {
 *   id: string;                    // Format: "tide_TIMESTAMP_HASH"
 *   name: string;                  // User-friendly display name
 *   flow_type: FlowType;          // Rhythm pattern (daily/weekly/project/seasonal)
 *   description?: string;          // Optional detailed description
 *   status: TideStatus;           // Lifecycle state (active/completed/paused)
 *   created_at: string;           // ISO timestamp of creation
 *   updated_at: string;           // ISO timestamp of last modification
 *   flow_sessions: FlowSession[]; // All associated flow sessions
 *   energy_updates: EnergyUpdate[]; // All energy check-ins
 *   task_links: TaskLink[];       // All linked external tasks
 * }
 * ```
 * 
 * ## Usage Patterns
 * 
 * ### For AI Models/Agents
 * These tools are designed for AI models to help users create and manage
 * their productivity workflows:
 * 
 * ```typescript
 * // Create a new daily workflow
 * const morningTide = await createTide({
 *   name: "Morning Deep Work",
 *   flow_type: "daily", 
 *   description: "90-minute focused work session before meetings"
 * }, storage);
 * 
 * // List user's active workflows
 * const activeTides = await listTides({
 *   active_only: true
 * }, storage);
 * ```
 * 
 * ### For Mobile/Web Applications
 * The consistent return format makes these tools ideal for frontend integration:
 * 
 * ```typescript
 * // Handle creation with error states
 * const result = await createTide(formData, storage);
 * if (result.success) {
 *   navigation.navigate('TideDetail', { tideId: result.tide_id });
 * } else {
 *   showError(result.error);
 * }
 * ```
 * 
 * ## Performance Considerations
 * 
 * - **listTides()**: Uses D1 indexes for fast filtering, avoids full R2 scans
 * - **createTide()**: Atomic operation across D1 metadata and R2 storage
 * - **Caching**: Consider client-side caching of tide lists for offline support
 * - **Pagination**: Future versions may add pagination for large tide lists
 * 
 * ## Security & Multi-tenancy
 * 
 * All operations respect user isolation through the storage layer's auth context:
 * - Users can only see/modify their own tides
 * - API key authentication required for all operations
 * - Cross-user data access is prevented at the storage level
 * 
 * ## Error Handling
 * 
 * All functions return a consistent response format:
 * ```typescript
 * type Response<T> = {
 *   success: true;
 *   // ... success fields
 * } | {
 *   success: false;
 *   error: string;
 * }
 * ```
 * 
 * Common error scenarios:
 * - **Storage errors**: Database connection issues, quota limits
 * - **Validation errors**: Invalid input parameters, missing required fields
 * - **Authorization errors**: Invalid API keys, insufficient permissions
 * 
 * @author Tides Development Team
 * @version 2.0.0 
 * @since 2025-01-01
 */

import type { TideStorage, CreateTideInput, TideFilter } from '../storage';

/**
 * Creates a new tide (workflow/project) in the system
 * 
 * @description Creates a new tide with the specified parameters. Each tide represents
 * a workflow or project that can have flow sessions, energy updates, and task links.
 * The system automatically calculates the next flow time based on the flow type.
 * 
 * @param {Object} params - The tide creation parameters
 * @param {string} params.name - The display name for the tide (max 100 chars recommended)
 * @param {'daily'|'weekly'|'project'|'seasonal'} params.flow_type - How often this tide flows
 * @param {string} [params.description] - Optional description (max 500 chars recommended)
 * @param {TideStorage} storage - Storage instance for persistence
 * 
 * @returns {Promise<CreateTideResponse>} Promise resolving to creation result
 * 
 * @example
 * // React Native usage example
 * const result = await createTide({
 *   name: "Daily Standup Prep",
 *   flow_type: "daily",
 *   description: "Prepare talking points for daily standup meeting"
 * }, storage);
 * 
 * if (result.success) {
 *   console.log('Created tide:', result.tide_id);
 * } else {
 *   console.error('Failed to create tide:', result.error);
 * }
 * 
 * @since 2.0.0
 */
export async function createTide(
  params: {
    name: string;
    flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
    description?: string;
  },
  storage: TideStorage
) {
  try {
    const input: CreateTideInput = {
      name: params.name,
      flow_type: params.flow_type,
      description: params.description,
    };
    
    const tide = await storage.createTide(input);
    
    // Determine next flow time based on flow type
    let next_flow = null;
    const now = new Date();
    
    if (params.flow_type === "daily") {
      next_flow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + " 09:00";
    } else if (params.flow_type === "weekly") {
      next_flow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (params.flow_type === "project") {
      next_flow = "When project phase begins";
    } else if (params.flow_type === "seasonal") {
      next_flow = "Next seasonal transition";
    }
    
    return {
      success: true,
      tide_id: tide.id,
      name: tide.name,
      flow_type: tide.flow_type,
      created_at: tide.created_at,
      status: tide.status,
      description: tide.description || "",
      next_flow,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Lists tides with optional filtering
 * 
 * @description Retrieves a list of tides with optional filtering by flow type and status.
 * Returns a formatted list optimized for display in lists and cards, including summary
 * information like flow count and last flow time.
 * 
 * @param {Object} params - The filtering parameters
 * @param {string} [params.flow_type] - Filter by flow type ('daily', 'weekly', 'project', 'seasonal')
 * @param {boolean} [params.active_only=false] - If true, only return active tides
 * @param {TideStorage} storage - Storage instance for data retrieval
 * 
 * @returns {Promise<ListTidesResponse>} Promise resolving to tide list
 * 
 * @example
 * // Get all active daily tides
 * const result = await listTides({
 *   flow_type: "daily",
 *   active_only: true
 * }, storage);
 * 
 * if (result.success) {
 *   const tidesForList = result.tides;
 * }
 * 
 * @since 2.0.0
 */
export async function listTides(
  params: {
    flow_type?: string;
    active_only?: boolean;
  },
  storage: TideStorage
) {
  try {
    const tides = await storage.listTides({
      flow_type: params.flow_type,
      active_only: params.active_only,
    });
    
    const formattedTides = tides.map(tide => ({
      id: tide.id,
      name: tide.name,
      flow_type: tide.flow_type,
      status: tide.status,
      created_at: tide.created_at,
      description: tide.description || "",
      flow_count: tide.flow_sessions.length,
      last_flow: tide.flow_sessions.length > 0 
        ? tide.flow_sessions[tide.flow_sessions.length - 1].started_at
        : null,
    }));
    
    return {
      success: true,
      tides: formattedTides,
      count: formattedTides.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tides: [],
      count: 0,
    };
  }
}