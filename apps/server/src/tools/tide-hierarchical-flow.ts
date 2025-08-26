/**
 * @fileoverview Enhanced Hierarchical Flow Sessions
 * 
 * This module provides enhanced flow session management that automatically distributes
 * flow sessions across hierarchical tide contexts (daily, weekly, monthly). When a user
 * starts a flow, it contributes to all relevant time contexts simultaneously.
 * 
 * ## Key Features
 * 
 * ### Automatic Context Distribution
 * A single flow session automatically contributes to:
 * - Daily tide for the session date
 * - Weekly tide containing that date  
 * - Monthly tide containing that date
 * 
 * ### Smart Auto-Creation
 * Missing hierarchical contexts are created automatically with proper linking:
 * ```
 * User starts flow → Daily tide created (if needed)
 *                 → Weekly tide created (if needed) 
 *                 → Monthly tide created (if needed)
 *                 → Flow session added to all three
 * ```
 * 
 * ### Seamless User Experience
 * Users don't need to think about tide management:
 * - Just start working → system handles context creation
 * - All time scales automatically updated
 * - Natural journaling workflow maintained
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { TideStorage } from '../storage';

/**
 * Starts a hierarchical flow session that distributes across all relevant contexts
 * 
 * @description This is the enhanced flow session function that implements the core
 * hierarchical tide pattern from ADR-003. When called, it:
 * 1. Auto-creates daily, weekly, monthly tides as needed
 * 2. Adds the flow session to all relevant hierarchical contexts
 * 3. Maintains proper parent-child relationships
 * 4. Returns information about all affected contexts
 * 
 * @param {Object} params - The hierarchical flow parameters
 * @param {'gentle'|'moderate'|'strong'} [params.intensity='moderate'] - Work intensity level
 * @param {number} [params.duration=25] - Session duration in minutes
 * @param {string} [params.initial_energy='medium'] - Starting energy level
 * @param {string} [params.work_context='General work'] - Description of work
 * @param {string} [params.date] - Date for the session (defaults to today)
 * @param {TideStorage} storage - Storage instance with hierarchical support
 * 
 * @returns {Promise<HierarchicalFlowResponse>} Promise resolving to hierarchical flow result
 * 
 * @example
 * // Simple usage - just start working
 * const result = await startHierarchicalFlow({
 *   intensity: "moderate",
 *   duration: 25,
 *   work_context: "Code review for authentication PR"
 * }, storage);
 * 
 * if (result.success) {
 *   // Session automatically added to daily, weekly, monthly tides
 *   console.log(`Session created: ${result.session_id}`);
 *   console.log(`Contexts updated: ${result.contexts.length}`);
 * }
 * 
 * @since 2.0.0
 */
export async function startHierarchicalFlow(
  params: {
    intensity?: 'gentle' | 'moderate' | 'strong';
    duration?: number;
    initial_energy?: string;
    work_context?: string;
    date?: string;
  },
  storage: TideStorage & { 
    getOrCreateDailyTide?: (date: string) => Promise<any>;
    getOrCreateWeeklyTide?: (date: string) => Promise<any>;
    getOrCreateMonthlyTide?: (date: string) => Promise<any>;
  }
) {
  try {
    const intensity = params.intensity || 'moderate';
    const duration = params.duration || 25;
    const energy_level = params.initial_energy || 'medium';
    const work_context = params.work_context || 'General work';
    const sessionDate = params.date || new Date().toISOString().split('T')[0];
    const started_at = new Date().toISOString();
    
    // Check if storage supports hierarchical operations
    if (!storage.getOrCreateDailyTide || !storage.getOrCreateWeeklyTide || !storage.getOrCreateMonthlyTide) {
      // Fallback to single tide flow session
      return await fallbackFlowSession(params, storage);
    }
    
    console.log(`🌊 Starting hierarchical flow for ${sessionDate}`);
    
    // Auto-create hierarchical tides
    const [dailyTide, weeklyTide, monthlyTide] = await Promise.all([
      storage.getOrCreateDailyTide(sessionDate),
      storage.getOrCreateWeeklyTide(sessionDate), 
      storage.getOrCreateMonthlyTide(sessionDate),
    ]);
    
    console.log(`📊 Created/retrieved tides: daily=${dailyTide.id}, weekly=${weeklyTide.id}, monthly=${monthlyTide.id}`);
    
    // Create the flow session object
    const sessionData = {
      intensity,
      duration,
      started_at,
      energy_level,
      work_context,
    };
    
    // Add flow session to all relevant tides
    const [dailySession, weeklySession, monthlySession] = await Promise.all([
      storage.addFlowSession(dailyTide.id, sessionData),
      storage.addFlowSession(weeklyTide.id, sessionData),
      storage.addFlowSession(monthlyTide.id, sessionData),
    ]);
    
    console.log(`✅ Flow sessions created: ${dailySession.id}, ${weeklySession.id}, ${monthlySession.id}`);
    
    return {
      success: true,
      session_id: dailySession.id, // Use daily session as primary
      date: sessionDate,
      intensity,
      duration,
      started_at,
      energy_level,
      work_context,
      contexts: [
        {
          context: 'daily',
          tide_id: dailyTide.id,
          tide_name: dailyTide.name,
          session_id: dailySession.id,
          created: dailyTide.created_at.split('T')[0] === sessionDate,
        },
        {
          context: 'weekly', 
          tide_id: weeklyTide.id,
          tide_name: weeklyTide.name,
          session_id: weeklySession.id,
          created: weeklyTide.created_at.split('T')[0] === sessionDate,
        },
        {
          context: 'monthly',
          tide_id: monthlyTide.id, 
          tide_name: monthlyTide.name,
          session_id: monthlySession.id,
          created: monthlyTide.created_at.split('T')[0] === sessionDate,
        }
      ],
      message: `Hierarchical flow session started across ${3} contexts`,
    };
    
  } catch (error) {
    console.error('❌ Hierarchical flow session failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hierarchical flow creation failed',
    };
  }
}

/**
 * Fallback flow session for non-hierarchical storage
 */
async function fallbackFlowSession(
  params: any,
  storage: TideStorage
): Promise<any> {
  console.log('⚠️  Hierarchical storage not available, using fallback flow session');
  
  try {
    // Import and use the existing startTideFlow function
    const { startTideFlow } = await import('./tide-sessions');
    
    // Try to find or create a daily tide for today
    const tides = await storage.listTides({
      flow_type: 'daily',
      active_only: true,
    });
    
    const today = new Date().toISOString().split('T')[0];
    let dailyTide = tides.find(t => t.created_at.split('T')[0] === today);
    
    if (!dailyTide) {
      // Create a daily tide for today
      const { createTide } = await import('./tide-core');
      const result = await createTide({
        name: `Daily Focus - ${new Date().toLocaleDateString()}`,
        flow_type: 'daily',
        description: `Daily tide for ${today}`,
      }, storage);
      
      if (!result.success) {
        throw new Error(`Failed to create daily tide: ${result.error}`);
      }
      
      // Need to get the actual tide object
      const newTides = await storage.listTides({
        flow_type: 'daily',
        active_only: true,
      });
      dailyTide = newTides.find(t => t.id === result.tide_id);
    }
    
    if (!dailyTide) {
      throw new Error('Failed to find or create daily tide');
    }
    
    // Start flow session on the daily tide
    const flowResult = await startTideFlow({
      tide_id: dailyTide.id,
      intensity: params.intensity,
      duration: params.duration,
      initial_energy: params.initial_energy,
      work_context: params.work_context,
    }, storage);
    
    if (!flowResult.success) {
      throw new Error(flowResult.error);
    }
    
    // Return in hierarchical format for consistency
    return {
      success: true,
      session_id: flowResult.session_id,
      date: today,
      intensity: flowResult.intensity,
      duration: flowResult.duration,
      started_at: flowResult.started_at,
      energy_level: flowResult.energy_level,
      work_context: flowResult.work_context,
      contexts: [
        {
          context: 'daily',
          tide_id: dailyTide.id,
          tide_name: dailyTide.name,
          session_id: flowResult.session_id,
          created: dailyTide.created_at.split('T')[0] === today,
        }
      ],
      message: `Flow session started (fallback mode)`,
      fallback_mode: true,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fallback flow session failed',
    };
  }
}

/**
 * Gets today's hierarchical context summary
 * 
 * @description Provides a summary of today's hierarchical tide contexts,
 * showing flow sessions across daily, weekly, and monthly views.
 * 
 * @param {Object} params - The context summary parameters
 * @param {string} [params.date] - Date to get context for (defaults to today)
 * @param {TideStorage} storage - Storage instance
 * 
 * @returns {Promise<ContextSummaryResponse>} Promise resolving to context summary
 * 
 * @example
 * const summary = await getTodaysContextSummary({}, storage);
 * 
 * // Show context summary in UI
 * summary.contexts.forEach(ctx => {
 *   console.log(`${ctx.context}: ${ctx.flow_count} sessions, ${ctx.total_minutes} minutes`);
 * });
 * 
 * @since 2.0.0
 */
export async function getTodaysContextSummary(
  params: {
    date?: string;
  },
  storage: TideStorage & { 
    getOrCreateDailyTide?: (date: string) => Promise<any>;
    getOrCreateWeeklyTide?: (date: string) => Promise<any>;
    getOrCreateMonthlyTide?: (date: string) => Promise<any>;
  }
) {
  try {
    const targetDate = params.date || new Date().toISOString().split('T')[0];
    
    // If hierarchical storage not available, provide basic summary
    if (!storage.getOrCreateDailyTide) {
      const tides = await storage.listTides({ active_only: true });
      const dailyTides = tides.filter(t => 
        t.flow_type === 'daily' && 
        t.created_at.split('T')[0] === targetDate
      );
      
      const totalSessions = dailyTides.reduce((sum, t) => sum + t.flow_sessions.length, 0);
      const totalMinutes = dailyTides.reduce((sum, t) => 
        sum + t.flow_sessions.reduce((s, session) => s + session.duration, 0), 0
      );
      
      return {
        success: true,
        date: targetDate,
        contexts: [
          {
            context: 'daily',
            flow_count: totalSessions,
            total_minutes: totalMinutes,
            tide_count: dailyTides.length,
            available: dailyTides.length > 0,
          }
        ],
        total_flow_sessions: totalSessions,
        total_minutes: totalMinutes,
        fallback_mode: true,
      };
    }
    
    // Get hierarchical contexts (don't auto-create, just check what exists)
    const tides = await storage.listTides({});
    const { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } = await import('../utils/date-utils');
    
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);
    const monthStart = getMonthStart(targetDate);
    const monthEnd = getMonthEnd(targetDate);
    
    const contexts = [];
    let totalSessions = 0;
    let totalMinutes = 0;
    
    // Daily context
    const dailyTide = tides.find(t => 
      t.flow_type === 'daily' && 
      t.created_at.split('T')[0] === targetDate
    );
    
    if (dailyTide) {
      const dailyMinutes = dailyTide.flow_sessions.reduce((sum, s) => sum + s.duration, 0);
      contexts.push({
        context: 'daily',
        tide_id: dailyTide.id,
        tide_name: dailyTide.name,
        flow_count: dailyTide.flow_sessions.length,
        total_minutes: dailyMinutes,
        available: true,
      });
      totalSessions += dailyTide.flow_sessions.length;
      totalMinutes += dailyMinutes;
    } else {
      contexts.push({
        context: 'daily',
        flow_count: 0,
        total_minutes: 0,
        available: false,
      });
    }
    
    // Weekly context
    const weeklyTide = tides.find(t => 
      t.flow_type === 'weekly' &&
      t.created_at >= weekStart && t.created_at <= weekEnd
    );
    
    if (weeklyTide) {
      const weeklyMinutes = weeklyTide.flow_sessions.reduce((sum, s) => sum + s.duration, 0);
      contexts.push({
        context: 'weekly',
        tide_id: weeklyTide.id,
        tide_name: weeklyTide.name,
        flow_count: weeklyTide.flow_sessions.length,
        total_minutes: weeklyMinutes,
        available: true,
      });
    } else {
      contexts.push({
        context: 'weekly',
        flow_count: 0,
        total_minutes: 0,
        available: false,
      });
    }
    
    // Monthly context
    const monthlyTide = tides.find(t => 
      t.flow_type === 'monthly' &&
      t.created_at >= monthStart && t.created_at <= monthEnd
    );
    
    if (monthlyTide) {
      const monthlyMinutes = monthlyTide.flow_sessions.reduce((sum, s) => sum + s.duration, 0);
      contexts.push({
        context: 'monthly',
        tide_id: monthlyTide.id,
        tide_name: monthlyTide.name,
        flow_count: monthlyTide.flow_sessions.length,
        total_minutes: monthlyMinutes,
        available: true,
      });
    } else {
      contexts.push({
        context: 'monthly',
        flow_count: 0,
        total_minutes: 0,
        available: false,
      });
    }
    
    return {
      success: true,
      date: targetDate,
      contexts,
      total_flow_sessions: totalSessions,
      total_minutes: totalMinutes,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get context summary',
      contexts: [],
    };
  }
}