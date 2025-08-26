/**
 * @fileoverview Hierarchical Tide Context Tools
 * 
 * This module provides tools for managing hierarchical tide contexts and context switching.
 * These tools enable seamless navigation between daily, weekly, and monthly views of the
 * same underlying workflow data.
 * 
 * ## Context Switching
 * 
 * Users can switch between different time-scale views of their workflow:
 * - **Daily Context**: Focus on today's activities and flows
 * - **Weekly Context**: View the current week's patterns and progress  
 * - **Monthly Context**: See long-term trends and monthly achievements
 * 
 * ## Automatic Context Creation
 * 
 * When switching to a context that doesn't exist, the system automatically creates:
 * - Daily tides for the specified date
 * - Weekly tides for the week containing the date
 * - Monthly tides for the month containing the date
 * 
 * ## Hierarchical Relationships
 * 
 * Context switching maintains proper hierarchical relationships:
 * ```
 * Monthly (Aug 2025)
 * ├── Weekly (Aug 18-24)
 * │   ├── Daily (Aug 18) ← You are here
 * │   ├── Daily (Aug 19)
 * │   └── Daily (Aug 20)
 * └── Weekly (Aug 25-31)
 * ```
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { TideStorage } from '../storage';

/**
 * Switches tide context to a different time scale view
 * 
 * @description Allows users to switch between daily, weekly, and monthly contexts
 * for the same underlying workflow data. Automatically creates the target context
 * if it doesn't exist, maintaining proper hierarchical relationships.
 * 
 * @param {Object} params - The context switching parameters
 * @param {'daily'|'weekly'|'monthly'} params.context - Target time context
 * @param {string} [params.date] - ISO date for context (defaults to today)
 * @param {boolean} [params.create_if_missing=true] - Create context if it doesn't exist
 * @param {TideStorage} storage - Storage instance with hierarchical support
 * 
 * @returns {Promise<ContextSwitchResponse>} Promise resolving to context switch result
 * 
 * @example
 * // Switch to weekly view for current week
 * const result = await tideSwitchContext({
 *   context: "weekly"
 * }, storage);
 * 
 * // Switch to daily view for specific date  
 * const result = await tideSwitchContext({
 *   context: "daily",
 *   date: "2025-08-15"
 * }, storage);
 * 
 * if (result.success) {
 *   // Use result.tide for display
 *   // result.hierarchy shows parent-child relationships
 * }
 * 
 * @since 2.0.0
 */
export async function tideSwitchContext(
  params: {
    context: 'daily' | 'weekly' | 'monthly';
    date?: string;
    create_if_missing?: boolean;
  },
  storage: TideStorage & { 
    getTideByContext?: (context: 'daily' | 'weekly' | 'monthly', date: string) => Promise<any>;
    getOrCreateDailyTide?: (date: string) => Promise<any>;
    getOrCreateWeeklyTide?: (date: string) => Promise<any>;
    getOrCreateMonthlyTide?: (date: string) => Promise<any>;
  }
) {
  try {
    const targetDate = params.date || new Date().toISOString().split('T')[0];
    const createIfMissing = params.create_if_missing !== false;
    
    // If storage supports hierarchical context switching, use it
    if (storage.getTideByContext) {
      const tide = await storage.getTideByContext(params.context, targetDate);
      
      if (!tide && !createIfMissing) {
        return {
          success: false,
          error: `${params.context} tide not found for ${targetDate}`,
        };
      }
      
      // Get hierarchical context (parent and children)
      const hierarchy = await buildHierarchyContext(storage, tide, params.context, targetDate);
      
      return {
        success: true,
        context: params.context,
        date: targetDate,
        tide: {
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
        },
        hierarchy,
        created: tide.created_at.split('T')[0] === targetDate,
      };
    }
    
    // Fallback for non-hierarchical storage
    const tides = await storage.listTides({
      flow_type: params.context,
      active_only: true,
    });
    
    // Simple date-based matching for fallback
    const contextTide = tides.find(t => 
      t.created_at.split('T')[0] === targetDate
    );
    
    if (!contextTide && !createIfMissing) {
      return {
        success: false,
        error: `${params.context} tide not found for ${targetDate}`,
      };
    }
    
    if (!contextTide) {
      // Create new context using existing createTide
      const { createTide } = await import('./tide-core');
      const { formatDate } = await import('../utils/date-utils');
      
      const result = await createTide({
        name: `${params.context.charAt(0).toUpperCase() + params.context.slice(1)} - ${formatDate(targetDate)}`,
        flow_type: params.context,
        description: `${params.context} context for ${targetDate}`,
      }, storage);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return {
        success: true,
        context: params.context,
        date: targetDate,
        tide: {
          id: result.tide_id,
          name: result.name,
          flow_type: result.flow_type,
          status: result.status,
          created_at: result.created_at,
          description: result.description,
          flow_count: 0,
          last_flow: null,
        },
        hierarchy: null, // No hierarchy in fallback mode
        created: true,
      };
    }
    
    return {
      success: true,
      context: params.context,
      date: targetDate,
      tide: {
        id: contextTide.id,
        name: contextTide.name,
        flow_type: contextTide.flow_type,
        status: contextTide.status,
        created_at: contextTide.created_at,
        description: contextTide.description || "",
        flow_count: contextTide.flow_sessions.length,
        last_flow: contextTide.flow_sessions.length > 0 
          ? contextTide.flow_sessions[contextTide.flow_sessions.length - 1].started_at
          : null,
      },
      hierarchy: null, // No hierarchy in fallback mode
      created: false,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Context switch failed',
    };
  }
}

/**
 * Builds hierarchical context showing parent and child relationships
 */
async function buildHierarchyContext(
  storage: any,
  tide: any, 
  currentContext: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<any> {
  const { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } = await import('../utils/date-utils');
  
  const hierarchy: any = {
    current: {
      context: currentContext,
      tide_id: tide.id,
      date_range: {
        start: tide.date_start || date,
        end: tide.date_end || date,
      }
    },
    parent: null,
    children: [],
  };
  
  try {
    // Build parent context
    if (currentContext === 'daily') {
      // Parent is weekly
      if (storage.getOrCreateWeeklyTide) {
        const weeklyTide = await storage.getOrCreateWeeklyTide(date);
        hierarchy.parent = {
          context: 'weekly',
          tide_id: weeklyTide.id,
          name: weeklyTide.name,
          date_range: {
            start: getWeekStart(date),
            end: getWeekEnd(date),
          }
        };
      }
    } else if (currentContext === 'weekly') {
      // Parent is monthly
      if (storage.getOrCreateMonthlyTide) {
        const monthlyTide = await storage.getOrCreateMonthlyTide(date);
        hierarchy.parent = {
          context: 'monthly',
          tide_id: monthlyTide.id,
          name: monthlyTide.name,
          date_range: {
            start: getMonthStart(date),
            end: getMonthEnd(date),
          }
        };
      }
    }
    
    // Build children contexts (simplified for now)
    if (currentContext === 'monthly') {
      hierarchy.children.push({
        context: 'weekly',
        available: true,
        description: 'Switch to weekly view for detailed patterns'
      });
    } else if (currentContext === 'weekly') {
      hierarchy.children.push({
        context: 'daily', 
        available: true,
        description: 'Switch to daily view for detailed activities'
      });
    }
    
  } catch (error) {
    console.warn('Failed to build complete hierarchy:', error);
  }
  
  return hierarchy;
}

/**
 * Lists available contexts for a given date range
 * 
 * @description Provides information about available tide contexts that can be
 * switched to, along with metadata about each context's availability and content.
 * 
 * @param {Object} params - The context listing parameters
 * @param {string} [params.date] - ISO date to check contexts for (defaults to today)
 * @param {boolean} [params.include_empty=true] - Include contexts with no flow sessions
 * @param {TideStorage} storage - Storage instance
 * 
 * @returns {Promise<ContextListResponse>} Promise resolving to available contexts
 * 
 * @example
 * const contexts = await tideListContexts({
 *   date: "2025-08-23"
 * }, storage);
 * 
 * // Show available contexts in UI
 * contexts.available.forEach(ctx => {
 *   console.log(`${ctx.context}: ${ctx.tide_name} (${ctx.flow_count} flows)`);
 * });
 * 
 * @since 2.0.0
 */
export async function tideListContexts(
  params: {
    date?: string;
    include_empty?: boolean;
  },
  storage: TideStorage
) {
  try {
    const targetDate = params.date || new Date().toISOString().split('T')[0];
    const includeEmpty = params.include_empty !== false;
    
    // Get all tides for the user to analyze available contexts
    const allTides = await storage.listTides({});
    const { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } = await import('../utils/date-utils');
    
    const contexts = {
      daily: null as any,
      weekly: null as any, 
      monthly: null as any,
    };
    
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);
    const monthStart = getMonthStart(targetDate);
    const monthEnd = getMonthEnd(targetDate);
    
    // Find matching contexts
    for (const tide of allTides) {
      if (tide.flow_type === 'daily' && tide.created_at.split('T')[0] === targetDate) {
        contexts.daily = {
          context: 'daily',
          tide_id: tide.id,
          tide_name: tide.name,
          flow_count: tide.flow_sessions.length,
          last_activity: tide.flow_sessions.length > 0 
            ? tide.flow_sessions[tide.flow_sessions.length - 1].started_at
            : null,
          date_range: { start: targetDate, end: targetDate }
        };
      } else if (tide.flow_type === 'weekly' && 
                 tide.created_at >= weekStart && tide.created_at <= weekEnd) {
        contexts.weekly = {
          context: 'weekly',
          tide_id: tide.id,
          tide_name: tide.name,
          flow_count: tide.flow_sessions.length,
          last_activity: tide.flow_sessions.length > 0 
            ? tide.flow_sessions[tide.flow_sessions.length - 1].started_at
            : null,
          date_range: { start: weekStart, end: weekEnd }
        };
      } else if (tide.flow_type === 'monthly' &&
                 tide.created_at >= monthStart && tide.created_at <= monthEnd) {
        contexts.monthly = {
          context: 'monthly',
          tide_id: tide.id,
          tide_name: tide.name,
          flow_count: tide.flow_sessions.length,
          last_activity: tide.flow_sessions.length > 0 
            ? tide.flow_sessions[tide.flow_sessions.length - 1].started_at
            : null,
          date_range: { start: monthStart, end: monthEnd }
        };
      }
    }
    
    // Filter out empty contexts if requested
    const available = Object.values(contexts)
      .filter(ctx => ctx !== null && (includeEmpty || ctx.flow_count > 0));
    
    return {
      success: true,
      date: targetDate,
      available,
      total_contexts: available.length,
      can_create: {
        daily: !contexts.daily,
        weekly: !contexts.weekly, 
        monthly: !contexts.monthly,
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list contexts',
      available: [],
      total_contexts: 0,
    };
  }
}