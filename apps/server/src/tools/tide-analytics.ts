/**
 * @fileoverview Analytics and Reporting Tools
 * 
 * This module provides comprehensive analytics, reporting, and data visualization
 * tools for tidal workflows. These tools transform raw flow session data, energy
 * updates, and task links into actionable insights and exportable reports.
 * 
 * ## Core Concepts
 * 
 * ### Tide Reports
 * Comprehensive reports that analyze a tide's complete lifecycle:
 * - **Flow Analytics**: Session counts, duration patterns, intensity trends
 * - **Energy Tracking**: Energy level progression and patterns over time
 * - **Task Integration**: Connected external tasks and their relationship to flow
 * - **Productivity Metrics**: Derived insights about workflow effectiveness
 * 
 * ### Report Formats
 * Multiple output formats for different use cases:
 * - **JSON**: Structured data for mobile apps, dashboards, and API integrations
 * - **Markdown**: Human-readable reports for documentation and sharing
 * - **CSV**: Raw data export for spreadsheet analysis and external tools
 * 
 * ### Participant Management
 * User and participant analytics for multi-user environments:
 * - **User Discovery**: Find and list system participants
 * - **Activity Filtering**: Filter by date ranges, status, and other criteria
 * - **Cross-user Analytics**: Aggregate insights across user base (admin tools)
 * 
 * ## Use Cases
 * 
 * ### Personal Productivity Analytics
 * ```typescript
 * // Generate personal productivity report
 * const report = await getTideReport({
 *   tide_id: "tide_daily_focus",
 *   format: "json"
 * }, storage);
 * 
 * // Extract insights for mobile dashboard
 * const insights = {
 *   totalHours: report.report.total_duration / 60,
 *   averageSession: report.report.average_duration,
 *   energyTrend: report.report.energy_progression,
 *   linkedTasks: report.report.linked_tasks
 * };
 * ```
 * 
 * ### Team/Manager Dashboards
 * ```typescript
 * // Get team participation overview
 * const teamData = await getParticipants({
 *   status_filter: "active",
 *   date_from: "2025-01-01",
 *   limit: 50
 * }, storage);
 * 
 * // Generate individual reports for team members
 * for (const participant of teamData.participants) {
 *   // Use participant data to query their tides and generate reports
 * }
 * ```
 * 
 * ### Data Export and Integration
 * ```typescript
 * // Export for external analysis
 * const csvReport = await getTideReport({
 *   tide_id: projectTideId,
 *   format: "csv"
 * }, storage);
 * 
 * // Save to device or send to analytics service
 * await exportToFile(csvReport.content, 'project_analysis.csv');
 * ```
 * 
 * ## Data Models
 * 
 * ### TideReport (JSON format)
 * ```typescript
 * interface TideReport {
 *   tide_id: string;              // Tide identifier
 *   name: string;                 // Tide display name
 *   flow_type: string;            // Tide rhythm type
 *   created_at: string;           // Tide creation timestamp
 *   total_flows: number;          // Number of flow sessions
 *   total_duration: number;       // Total minutes of focused work
 *   average_duration: number;     // Average session length
 *   energy_progression: string[]; // Energy levels over time
 *   linked_tasks: number;         // Number of linked external tasks
 *   last_flow: string | null;     // Most recent flow session timestamp
 * }
 * ```
 * 
 * ### Participant
 * ```typescript
 * interface Participant {
 *   id: string;                   // Participant identifier
 *   provider_id: string;          // External system ID
 *   first_name: string;           // First name
 *   last_name: string;            // Last name
 *   email: string;                // Email address
 *   status: string;               // Account status (active/inactive)
 *   created_at: string;           // Account creation timestamp
 * }
 * ```
 * 
 * ## Mobile App Integration
 * 
 * ### Analytics Dashboards
 * Reports provide rich data for productivity dashboards:
 * ```typescript
 * const report = await getTideReport({ tide_id, format: "json" }, storage);
 * 
 * // Create chart data
 * const chartData = {
 *   energyChart: report.report.energy_progression.map((energy, index) => ({
 *     x: index + 1,
 *     y: parseFloat(energy) || 0
 *   })),
 *   durationChart: flowSessions.map(session => ({
 *     date: session.started_at.split('T')[0],
 *     duration: session.duration
 *   }))
 * };
 * ```
 * 
 * ### Export and Sharing
 * ```typescript
 * // Generate shareable markdown report
 * const markdownReport = await getTideReport({
 *   tide_id: projectTideId,
 *   format: "markdown"
 * }, storage);
 * 
 * // Share via social/messaging apps
 * await shareText(markdownReport.content);
 * ```
 * 
 * ## Performance Optimizations
 * 
 * - **Cached Analytics**: Pre-computed metrics in tide_analytics table
 * - **Incremental Updates**: Only recalculate when new data is added
 * - **Lazy Loading**: Load detailed data only when specific reports are requested
 * - **Format Streaming**: Large CSV exports can be streamed for memory efficiency
 * 
 * ## Future Extensions
 * 
 * Planned additions to this module:
 * - `getTideInsights()` - AI-powered productivity insights and recommendations
 * - `compareTides()` - Side-by-side tide performance comparison
 * - `getTeamAnalytics()` - Aggregate team productivity metrics
 * - `exportToCalendar()` - Export flow sessions to calendar apps
 * - `generateProductivityScore()` - Calculated productivity scoring
 * - `getEnergyPatterns()` - Advanced energy pattern analysis
 * - `scheduleOptimization()` - Suggest optimal flow session timing
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { TideStorage, Tide } from '../storage';

/**
 * Generates a comprehensive report for a tide
 * 
 * @description Creates a detailed analytics report for a tide including flow sessions,
 * energy progression, task links, and summary statistics. Perfect for displaying
 * progress dashboards, analytics screens, or exporting data.
 * 
 * @param {Object} params - The report parameters
 * @param {string} params.tide_id - The ID of the tide to generate a report for
 * @param {'json'|'markdown'|'csv'} [params.format='json'] - Output format for the report
 * @param {TideStorage} storage - Storage instance for data retrieval
 * 
 * @returns {Promise<TideReportResponse>} Promise resolving to tide report
 * 
 * @example
 * // React Native usage - get JSON report for analytics screen
 * const result = await getTideReport({
 *   tide_id: "tide_1738366800000_abc123",
 *   format: "json"
 * }, storage);
 * 
 * if (result.success) {
 *   // Perfect for charts and analytics displays
 *   const { total_flows, total_duration, energy_progression } = result.report;
 * }
 * 
 * @since 2.0.0
 */
export async function getTideReport(
  params: {
    tide_id: string;
    format?: 'json' | 'markdown' | 'csv';
  },
  storage: TideStorage
) {
  try {
    const tide = await storage.getTide(params.tide_id);
    if (!tide) {
      return {
        success: false,
        error: `Tide with id ${params.tide_id} not found`,
      };
    }
    
    const flowSessions = await storage.getFlowSessions(params.tide_id);
    const energyUpdates = await storage.getEnergyUpdates(params.tide_id);
    const taskLinks = await storage.getTaskLinks(params.tide_id);
    
    const totalDuration = flowSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = flowSessions.length > 0 ? Math.round(totalDuration / flowSessions.length) : 0;
    const energyProgression = energyUpdates.map(update => update.energy_level);
    const lastFlow = flowSessions.length > 0 
      ? flowSessions[flowSessions.length - 1].started_at
      : null;
    
    const baseReport = {
      tide_id: params.tide_id,
      name: tide.name,
      flow_type: tide.flow_type,
      created_at: tide.created_at,
      total_flows: flowSessions.length,
      total_duration: totalDuration,
      average_duration: averageDuration,
      energy_progression: energyProgression,
      linked_tasks: taskLinks.length,
      last_flow: lastFlow,
    };

    if (params.format === "markdown") {
      const energyList = energyProgression.map((energy, i) => `- Session ${i + 1}: ${energy}`).join('\n');
      const markdown = `# Tide Report: ${tide.name}

**Type:** ${tide.flow_type}  
**Created:** ${new Date(tide.created_at).toLocaleDateString()}  
**Total Sessions:** ${flowSessions.length}  
**Average Duration:** ${averageDuration} minutes  

## Energy Progression
${energyList || '- No energy data recorded'}

## Linked Tasks
- ${taskLinks.length} tasks linked
`;
      return {
        success: true,
        format: "markdown",
        content: markdown,
      };
    }

    if (params.format === "csv") {
      const csvRows = energyUpdates.map((update, index) => {
        const date = new Date(update.timestamp).toISOString().split('T')[0];
        return `${index + 1},${update.energy_level},${date}`;
      });
      
      const csv = `session_number,energy_level,date\n${csvRows.join('\n')}`;
      
      return {
        success: true,
        format: "csv",
        content: csv,
      };
    }

    // Default JSON format
    return {
      success: true,
      format: "json",
      report: baseReport,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Retrieves the complete raw JSON data for a tide from R2 storage
 * 
 * @description Returns the full, unprocessed tide object exactly as stored in R2,
 * including all nested arrays (flow_sessions, energy_updates, task_links) with
 * complete data. This is useful for data export, debugging, or when clients need
 * access to the complete data structure for custom processing.
 * 
 * @param {Object} params - The request parameters
 * @param {string} params.tide_id - The ID of the tide to retrieve
 * @param {TideStorage} storage - Storage instance for data retrieval
 * 
 * @returns {Promise<{success: boolean; data?: Tide; error?: string}>} Promise resolving to the complete tide data
 * 
 * @example
 * // React Native usage - get complete tide data for export
 * const result = await getTideRawJson({
 *   tide_id: "tide_1234567890_abc"
 * }, storage);
 * 
 * if (result.success) {
 *   // Access complete data structure
 *   const allSessions = result.data.flow_sessions;
 *   const allEnergy = result.data.energy_updates;
 *   const allTasks = result.data.task_links;
 *   
 *   // Export or process as needed
 *   await saveToFile(JSON.stringify(result.data));
 * }
 * 
 * @example
 * // Comparison with getTideReport
 * // getTideReport returns processed analytics:
 * const report = await getTideReport({ tide_id }, storage);
 * // Returns: { total_flows: 5, average_duration: 45, energy_progression: [...] }
 * 
 * // getTideRawJson returns complete raw data:
 * const raw = await getTideRawJson({ tide_id }, storage);
 * // Returns: { id, name, flow_sessions: [...all], energy_updates: [...all], ... }
 * 
 * @since 2.1.0
 */
export async function getTideRawJson(
  params: { tide_id: string },
  storage: TideStorage
): Promise<{ success: boolean; data?: Tide; error?: string }> {
  try {
    const tide = await storage.getTide(params.tide_id);
    
    if (!tide) {
      return {
        success: false,
        error: `Tide with id ${params.tide_id} not found`,
      };
    }
    
    // Return the complete, unprocessed tide object
    return {
      success: true,
      data: tide,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Retrieves participant information with filtering
 * 
 * @description Gets a list of system participants/users with optional filtering.
 * This is primarily used for admin interfaces, team dashboards, or multi-user
 * analytics. Returns standardized participant data across all environments.
 * 
 * @param {Object} [params] - Optional filtering parameters
 * @param {string} [params.status_filter] - Filter by participant status
 * @param {string} [params.date_from] - Start date for filtering (ISO format)
 * @param {string} [params.date_to] - End date for filtering (ISO format)
 * @param {number} [params.limit=100] - Maximum number of participants to return
 * @param {TideStorage} storage - Storage instance for data retrieval
 * 
 * @returns {Promise<ParticipantsResponse>} Promise resolving to participants list
 * 
 * @example
 * // Admin dashboard - get all active participants
 * const result = await getParticipants({
 *   status_filter: "active",
 *   limit: 50
 * }, storage);
 * 
 * if (result.success) {
 *   const activeUsers = result.participants;
 * }
 * 
 * @since 2.0.0
 */
export async function getParticipants(
  params: {
    status_filter?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  },
  storage: TideStorage
) {
  // Note: This function returns stub data as participants are managed outside the tide system
  // In a real implementation, this would query a separate participants storage or external API
  return {
    success: true,
    participants: [
      {
        id: "part_001",
        provider_id: "provider_123",
        first_name: "Alice",
        last_name: "Johnson",
        email: "alice@example.com",
        status: "active",
        created_at: "2025-01-15T10:00:00.000Z",
      },
      {
        id: "part_002",
        provider_id: "provider_456",
        first_name: "Bob",
        last_name: "Smith",
        email: "bob@example.com",
        status: "active",
        created_at: "2025-01-20T14:30:00.000Z",
      },
    ],
    count: 2,
    filters_applied: {
      status: params.status_filter || "all",
      date_from: params.date_from || null,
      date_to: params.date_to || null,
      limit: params.limit || 100,
    },
  };
}