/**
 * @fileoverview Flow Sessions and Energy Tracking Tools
 * 
 * This module handles the real-time aspects of tidal workflows: flow sessions
 * (focused work periods) and energy tracking (mood/energy monitoring throughout
 * the day). These tools capture the dynamic, time-based elements of productivity.
 * 
 * ## Core Concepts
 * 
 * ### Flow Sessions
 * Flow sessions represent focused work periods within a tide. They track:
 * - **Intensity**: How demanding the work is (gentle/moderate/strong)
 * - **Duration**: Length of the focused work period (typically 15-90 minutes)
 * - **Context**: What specific work is being done
 * - **Energy**: Starting energy level for the session
 * 
 * ### Energy Tracking
 * Energy updates capture subjective state throughout the day:
 * - **Energy Level**: Numeric (1-10) or descriptive (low/medium/high)
 * - **Context**: What's affecting energy (coffee, lunch, challenging task)
 * - **Timestamp**: When the energy was recorded for trending
 * 
 * ## Use Cases
 * 
 * ### Pomodoro Technique Integration
 * ```typescript
 * // Start 25-minute focused session
 * const session = await startTideFlow({
 *   tide_id: "tide_morning_work",
 *   intensity: "moderate",
 *   duration: 25,
 *   work_context: "Implementing authentication flow"
 * }, storage);
 * 
 * // Timer completes, record energy check-in
 * const energyUpdate = await addTideEnergy({
 *   tide_id: "tide_morning_work", 
 *   energy_level: "8",
 *   context: "Completed feature successfully"
 * }, storage);
 * ```
 * 
 * ### Energy Pattern Analysis
 * ```typescript
 * // Morning energy check-in
 * await addTideEnergy({
 *   tide_id: dailyTideId,
 *   energy_level: "high",
 *   context: "Fresh start after coffee"
 * }, storage);
 * 
 * // Post-lunch dip
 * await addTideEnergy({
 *   tide_id: dailyTideId,
 *   energy_level: "low", 
 *   context: "Post-lunch energy dip"
 * }, storage);
 * 
 * // Use getTideReport() to analyze patterns
 * ```
 * 
 * ### Mobile App Integration
 * These tools are designed for real-time mobile interactions:
 * - **Quick flow starts**: One-tap to begin focused work
 * - **Energy sliders**: Simple 1-10 scale inputs
 * - **Context capture**: Voice notes or quick text for work context
 * - **Timer integration**: Duration tracking with notifications
 * 
 * ## Data Models
 * 
 * ### FlowSession
 * ```typescript
 * interface FlowSession {
 *   id: string;                    // Format: "session_TIMESTAMP_HASH"
 *   tide_id: string;              // Parent tide ID
 *   intensity: 'gentle' | 'moderate' | 'strong';
 *   duration: number;             // Minutes
 *   started_at: string;           // ISO timestamp
 *   completed_at?: string;        // ISO timestamp when finished
 *   energy_level: string;         // Starting energy
 *   work_context: string;         // What work was done
 *   notes?: string;               // Optional session notes
 * }
 * ```
 * 
 * ### EnergyUpdate
 * ```typescript
 * interface EnergyUpdate {
 *   id: string;                   // Format: "energy_TIMESTAMP_HASH"
 *   tide_id: string;             // Parent tide ID
 *   energy_level: string;        // Energy level (1-10 or descriptive)
 *   context: string;             // What's affecting energy
 *   timestamp: string;           // ISO timestamp
 * }
 * ```
 * 
 * ## Performance & UX Considerations
 * 
 * ### Real-time Updates
 * - Sessions start immediately (no async delays)
 * - Energy updates are lightweight and fast
 * - Both operations update analytics in background
 * 
 * ### Offline Support
 * - Both operations work well with offline-first patterns
 * - Timestamps ensure proper ordering when syncing
 * - IDs are deterministic for conflict resolution
 * 
 * ### Battery Optimization
 * - Use efficient timers for flow session tracking
 * - Batch energy updates if recording frequently
 * - Consider user notification preferences
 * 
 * ## Future Extensions
 * 
 * Planned additions to this module:
 * - `pauseFlowSession()` - Pause and resume sessions
 * - `completeFlowSession()` - Mark sessions as finished with notes
 * - `getFlowSessionHistory()` - Retrieve session history for analysis
 * - `bulkEnergyUpdate()` - Batch energy recording for efficiency
 * - `energyTrends()` - Real-time energy trend analysis
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { TideStorage } from '../storage';

/**
 * Starts a new flow session for a tide
 * 
 * @description Initiates a focused work session within a tide. This is the core function
 * for starting a "flow state" - a timed, focused work period. Perfect for Pomodoro-style
 * work sessions or any focused work period tracking.
 * 
 * @param {Object} params - The flow session parameters
 * @param {string} params.tide_id - The ID of the tide to start a flow session for
 * @param {'gentle'|'moderate'|'strong'} [params.intensity='moderate'] - Work intensity level
 * @param {number} [params.duration=25] - Session duration in minutes
 * @param {string} [params.initial_energy='high'] - Starting energy level description
 * @param {string} [params.work_context='General work'] - Context or description of work
 * @param {TideStorage} storage - Storage instance for persistence
 * 
 * @returns {Promise<StartFlowResponse>} Promise resolving to flow session details
 * 
 * @example
 * // React Native usage - start a Pomodoro session
 * const result = await startTideFlow({
 *   tide_id: "tide_1738366800000_abc123",
 *   intensity: "moderate",
 *   duration: 25,
 *   initial_energy: "high",
 *   work_context: "Implementing user authentication"
 * }, storage);
 * 
 * if (result.success) {
 *   // Start timer UI with result.duration
 *   // Show intensity indicator with result.intensity
 * }
 * 
 * @since 2.0.0
 */
export async function startTideFlow(
  params: {
    tide_id: string;
    intensity?: 'gentle' | 'moderate' | 'strong';
    duration?: number;
    initial_energy?: string;
    work_context?: string;
  },
  storage: TideStorage
) {
  try {
    const intensity = params.intensity || 'moderate';
    const duration = params.duration || 25;
    const energy_level = params.initial_energy || "high";
    const work_context = params.work_context || "General work";
    const started_at = new Date().toISOString();
    
    const session = await storage.addFlowSession(params.tide_id, {
      intensity,
      duration,
      started_at,
      energy_level,
      work_context,
    });
    
    return {
      success: true,
      session_id: session.id,
      tide_id: params.tide_id,
      intensity,
      duration,
      started_at,
      energy_level,
      work_context,
      message: `Flow session started for ${duration} minutes at ${intensity} intensity`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Records an energy level update for a tide
 * 
 * @description Tracks energy levels throughout a tide's lifecycle. Perfect for mood
 * tracking, energy monitoring, or any subjective state tracking. Use this to capture
 * how users feel during different parts of their workflow.
 * 
 * @param {Object} params - The energy update parameters
 * @param {string} params.tide_id - The ID of the tide to add energy to
 * @param {string} params.energy_level - Energy level (recommend 1-10 scale or descriptive terms)
 * @param {string} [params.context] - Optional context about the energy state
 * @param {TideStorage} storage - Storage instance for persistence
 * 
 * @returns {Promise<AddEnergyResponse>} Promise resolving to energy update details
 * 
 * @example
 * // React Native usage - energy slider (1-10 scale)
 * const result = await addTideEnergy({
 *   tide_id: "tide_1738366800000_abc123",
 *   energy_level: "8",
 *   context: "Feeling very focused after coffee break"
 * }, storage);
 * 
 * @since 2.0.0
 */
export async function addTideEnergy(
  params: {
    tide_id: string;
    energy_level: string;
    context?: string;
  },
  storage: TideStorage
) {
  try {
    const timestamp = new Date().toISOString();
    const context = params.context || "";
    
    const energyUpdate = await storage.addEnergyUpdate(params.tide_id, {
      energy_level: params.energy_level,
      context,
      timestamp,
    });
    
    return {
      success: true,
      energy_id: energyUpdate.id,
      tide_id: params.tide_id,
      energy_level: params.energy_level,
      context,
      timestamp,
      message: `Energy level '${params.energy_level}' recorded`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}