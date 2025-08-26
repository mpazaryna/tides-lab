/**
 * @fileoverview MCP Prompt Template Registry
 * 
 * This module provides a template registry that works in Cloudflare Workers
 * by inlining prompt templates as JavaScript objects. This avoids file system
 * dependencies while maintaining the separation of prompt logic from code.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { z } from "zod";

/**
 * Interface for prompt template metadata
 */
interface PromptMetadata {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
}

/**
 * Interface for prompt template
 */
interface PromptTemplate {
  metadata: PromptMetadata;
  contextTemplate: string;
  zodSchema: any;
}

/**
 * Registry of all prompt templates
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  analyze_tide: {
    metadata: {
      title: "Analyze Tide",
      description: "Comprehensive analysis of a tide's performance, patterns, and optimization opportunities",
      version: "1.0.0",
      lastUpdated: "2025-08-07"
    },
    zodSchema: {
      tide_id: z.string().describe("ID of the tide to analyze"),
      analysis_depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().describe("Depth of analysis (default: detailed)"),
      focus_areas: z.string().optional().describe("Comma-separated areas to emphasize in analysis")
    },
    contextTemplate: `COMPREHENSIVE TIDE ANALYSIS REQUEST

TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Description: {{tide.description || 'No description provided'}}
- Created: {{tide.created_at}}
- Status: {{tide.status || 'active'}}

PERFORMANCE METRICS:
- Total Sessions: {{flowSessions.length}}
- Total Duration: {{totalDuration}} minutes ({{Math.round(totalDuration / 60 * 10) / 10}} hours)
- Average Session: {{averageDuration}} minutes

FLOW SESSIONS ANALYSIS: [{{flowSessions.length}} sessions]
{{flowSessions.map((session, index) => \`
Session \${index + 1} (\${session.started_at}):
- Duration: \${session.duration} minutes
- Intensity: \${session.intensity}
- Energy Level: \${session.energy_level || 'Not specified'}
- Context: \${session.work_context || 'No context provided'}\`).join('')}}

ENERGY PROGRESSION: [{{energyUpdates.length}} data points]
{{energyUpdates.map((update, index) => \`
\${index + 1}. \${update.timestamp}: \${update.energy_level}\${update.context ? \` (\${update.context})\` : ''}\`).join('')}}

LINKED TASKS: [{{taskLinks.length}} tasks]
{{taskLinks.map((task, index) => \`
\${index + 1}. \${task.task_title} (\${task.task_type})
   URL: \${task.task_url}
   Linked: \${task.linked_at}\`).join('')}}

ANALYSIS REQUEST:
- Analysis Depth: {{analysis_depth || 'detailed'}}
{{focus_areas ? \`- Focus Areas: \${focus_areas}\` : ''}}

Please provide a {{analysis_depth || 'detailed'}} analysis of this tide's performance, identifying:

1. PRODUCTIVITY PATTERNS
   - Peak performance periods and conditions
   - Session duration effectiveness
   - Intensity vs. performance correlation
   - Energy level impacts on productivity

2. OPTIMIZATION OPPORTUNITIES  
   - Timing optimization recommendations
   - Session structure improvements
   - Interruption reduction strategies
   - Energy management suggestions

3. INSIGHTS & TRENDS
   - Progress trajectory analysis
   - Work context effectiveness
   - Task linkage value assessment
   - Completion rate factors

4. ACTIONABLE RECOMMENDATIONS
   - Specific changes to improve performance
   - Scheduling optimization suggestions
   - Workflow structure improvements
   - Energy management strategies

Please structure your response with clear sections and specific, actionable insights based on the data provided.`
  },

  productivity_insights: {
    metadata: {
      title: "Productivity Pattern Insights",
      description: "Identify patterns, trends, and optimization opportunities across flow sessions and workflows",
      version: "1.0.0",
      lastUpdated: "2025-08-07"
    },
    zodSchema: {
      tide_id: z.string().describe("ID of the tide to analyze"),
      time_period: z.string().optional().describe("Analysis time period: '7_days', '30_days', 'all_time'"),
      comparison_baseline: z.string().optional().describe("Comparison baseline: 'previous_period', 'personal_average'")
    },
    contextTemplate: `PRODUCTIVITY INSIGHTS ANALYSIS REQUEST

TIDE OVERVIEW:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Analysis Period: {{time_period || 'All available data'}}
- Comparison Baseline: {{comparison_baseline || 'None specified'}}

PRODUCTIVITY METRICS:
- Total Flow Sessions: {{flowSessions.length}}
- Total Productive Time: {{totalDuration}} minutes ({{Math.round(totalDuration / 60 * 10) / 10}} hours)
- Average Session Length: {{averageDuration}} minutes
- Peak Performance Hours: Based on session timing analysis

SESSION EFFECTIVENESS:
{{flowSessions.map((session, index) => \`
Session \${index + 1} (\${session.started_at}):
- Duration: \${session.duration} minutes (vs avg: \${averageDuration})
- Intensity: \${session.intensity}
- Energy Level: \${session.energy_level || 'Not specified'}
- Context: \${session.work_context || 'No context'}\`).join('')}}

ENERGY CORRELATION:
{{energyUpdates.map((update, index) => \`
\${index + 1}. \${update.timestamp}: \${update.energy_level}
   Context: \${update.context || 'No context'}\`).join('')}}

PERFORMANCE ANALYSIS:
- Most Productive Sessions: {{flowSessions.filter(s => s.duration >= averageDuration).length}} sessions above average
- Session Duration Distribution: {{flowSessions.map(s => s.duration).join(', ')}} minutes
- Intensity Patterns: {{flowSessions.map(s => s.intensity).join(', ')}}

Please analyze these patterns and provide:

1. OPTIMAL TIMING RECOMMENDATIONS
   - Best time blocks for flow sessions based on historical data
   - Duration optimization based on performance patterns
   - Energy-aware timing strategies
   - Weekly scheduling suggestions

2. PRODUCTIVITY OPTIMIZATION
   - Session structure improvements
   - Intensity level optimization based on success patterns
   - Context optimization strategies
   - Environmental factor adjustments

3. PERFORMANCE ENHANCEMENT
   - Energy management for peak performance
   - Session preparation optimization
   - Progress tracking improvements
   - Motivation and momentum strategies

Focus on actionable insights that can immediately improve productivity patterns and flow session effectiveness.`
  },

  optimize_energy: {
    metadata: {
      title: "Energy Optimization Analysis", 
      description: "Analyze energy patterns and provide scheduling recommendations for optimal performance",
      version: "1.0.0",
      lastUpdated: "2025-08-07"
    },
    zodSchema: {
      tide_id: z.string().describe("ID of the tide to analyze"),
      target_schedule: z.string().optional().describe("Target schedule preference: 'morning_focused', 'afternoon_preferred', 'maximize_peak_hours'"),
      energy_goals: z.string().optional().describe("Comma-separated energy goals")
    },
    contextTemplate: `ENERGY OPTIMIZATION ANALYSIS REQUEST

TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Target Schedule: {{target_schedule || 'Not specified'}}
- Energy Goals: {{energy_goals || 'General optimization'}}

ENERGY PATTERNS:
- Total Energy Data Points: {{energyUpdates.length}}
- Flow Sessions with Energy Data: {{flowSessions.filter(s => s.energy_level).length}}

ENERGY PROGRESSION ANALYSIS:
{{energyUpdates.map((update, index) => \`
\${index + 1}. \${update.timestamp}: \${update.energy_level}
   Context: \${update.context || 'No context'}
   Time: \${new Date(update.timestamp).toLocaleTimeString()}
   Day: \${new Date(update.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}\`).join('')}}

FLOW SESSION ENERGY CORRELATION:
{{flowSessions.map((session, index) => \`
Session \${index + 1}:
- Start: \${session.started_at}
- Duration: \${session.duration} minutes
- Intensity: \${session.intensity}
- Energy: \${session.energy_level || 'Not recorded'}\`).join('')}}

ENERGY-PERFORMANCE INSIGHTS:
- High Energy Sessions: {{flowSessions.filter(s => s.energy_level === 'high').length}} sessions
- Medium Energy Sessions: {{flowSessions.filter(s => s.energy_level === 'medium').length}} sessions  
- Low Energy Sessions: {{flowSessions.filter(s => s.energy_level === 'low').length}} sessions

Please provide an energy optimization analysis focusing on:

1. OPTIMAL SCHEDULING
   - Best time windows for high-intensity work based on energy patterns
   - Energy-aware session planning recommendations
   - Peak performance scheduling optimization
   - Energy recovery scheduling strategies

2. ENERGY MANAGEMENT STRATEGIES
   - Techniques to maintain consistent energy levels
   - Methods to avoid energy crashes and dips
   - Energy restoration and renewal practices
   - Sustainable work rhythm development

3. PERSONALIZED RECOMMENDATIONS
   - Time-of-day optimization based on observed patterns
   - Duration adjustments matched to energy capacity
   - Intensity matching to available energy levels
   - Strategic break timing for energy renewal

4. PROACTIVE ENERGY PLANNING
   - Weekly energy rhythm optimization strategies
   - Workload distribution based on energy forecasts
   - Preventive energy management techniques
   - Long-term sustainability planning

Focus on creating a sustainable, personalized energy optimization strategy based on the observed patterns and data.`
  },

  team_insights: {
    metadata: {
      title: "Team Collaboration Insights",
      description: "Analyze multi-user productivity patterns and provide team collaboration optimization insights",
      version: "1.0.0", 
      lastUpdated: "2025-08-07"
    },
    zodSchema: {
      participant_ids: z.array(z.string()).optional().describe("Specific team member IDs to analyze"),
      date_range: z.string().describe("Date range in format: 'YYYY-MM-DD_to_YYYY-MM-DD'"),
      collaboration_focus: z.string().optional().describe("Focus area: 'sync_sessions', 'productivity_comparison', 'workflow_optimization'")
    },
    contextTemplate: `TEAM COLLABORATION INSIGHTS ANALYSIS

TEAM OVERVIEW:
- Analysis Period: {{date_range}}
- Team Members: {{participant_ids ? participant_ids.length : 'All participants'}} members
- Collaboration Focus: {{collaboration_focus || 'General team productivity'}}

PARTICIPANT SUMMARY:
{{participants.map((participant, index) => \`
\${index + 1}. User ID: \${participant.user_id}
   - Total Tides: \${participant.total_tides || 0}
   - Active Flow Sessions: \${participant.flow_sessions || 0}
   - Average Session: \${participant.avg_session_duration || 0} minutes\`).join('')}}

TEAM PRODUCTIVITY METRICS:
- Combined Flow Sessions: {{participants.reduce((sum, p) => sum + (p.flow_sessions || 0), 0)}}
- Total Team Productive Time: {{participants.reduce((sum, p) => sum + ((p.flow_sessions || 0) * (p.avg_session_duration || 0)), 0)}} minutes
- Most Active Member: {{participants.reduce((max, p) => (p.flow_sessions || 0) > (max.flow_sessions || 0) ? p : max, participants[0] || {}).user_id || 'None'}}

COLLABORATION OPPORTUNITIES:
Based on individual tide data and flow patterns, identify:
- Peak productivity hours across team members
- Complementary work schedules and energy patterns  
- Opportunities for synchronized focus sessions
- Knowledge sharing and collaboration potential

Please analyze this team data and provide insights on:

1. TEAM PRODUCTIVITY OPTIMIZATION
   - Identify high-performing patterns across team members
   - Benchmark individual performance against team averages
   - Highlight successful collaboration strategies observed
   - Recommend productivity improvement techniques

2. SYNCHRONIZATION OPPORTUNITIES  
   - Optimal team meeting times based on productivity patterns
   - Coordinated flow session scheduling recommendations
   - Complementary work rhythm strategies
   - Team energy optimization approaches

3. INDIVIDUAL CONTRIBUTION ANALYSIS
   - Unique strengths and contributions of each member
   - Areas where individuals excel or need support
   - Productivity complementarity assessment
   - Personal development recommendations

4. COLLABORATIVE WORKFLOW OPTIMIZATION
   - Task coordination and handoff improvement strategies
   - Communication timing optimization
   - Shared focus time coordination techniques
   - Team momentum building approaches

Focus on actionable recommendations that enhance both individual performance and team collaboration effectiveness.`
  },

  custom_tide_analysis: {
    metadata: {
      title: "Custom Tide Analysis",
      description: "Flexible analysis prompt that handles user-defined questions and custom analysis requirements",
      version: "1.0.0",
      lastUpdated: "2025-08-07"
    },
    zodSchema: {
      tide_id: z.string().describe("ID of the tide to analyze"),
      analysis_question: z.string().describe("User's specific question or analysis request"),
      context: z.string().optional().describe("Additional context for the analysis"),
      output_format: z.enum(['narrative', 'structured', 'actionable']).optional().describe("Preferred response format")
    },
    contextTemplate: `CUSTOM TIDE ANALYSIS REQUEST

TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Description: {{tide.description || 'No description provided'}}
- Created: {{tide.created_at}}
- Status: {{tide.status || 'active'}}

USER ANALYSIS QUESTION:
{{analysis_question}}

ADDITIONAL CONTEXT PROVIDED:
{{context || 'No additional context provided'}}

OUTPUT FORMAT PREFERENCE: {{output_format || 'narrative'}}

COMPREHENSIVE TIDE DATA:

PERFORMANCE OVERVIEW:
- Total Sessions: {{flowSessions.length}}
- Total Duration: {{totalDuration}} minutes
- Average Session: {{averageDuration}} minutes
- Energy Data Points: {{energyUpdates.length}}
- Linked Tasks: {{taskLinks.length}}

DETAILED FLOW SESSIONS:
{{flowSessions.map((session, index) => \`
Session \${index + 1} (\${session.started_at}):
- Duration: \${session.duration} minutes
- Intensity: \${session.intensity}
- Energy: \${session.energy_level || 'Not specified'}
- Context: \${session.work_context || 'No context'}\`).join('')}}

ENERGY TRACKING DATA:
{{energyUpdates.map((update, index) => \`
\${index + 1}. \${update.timestamp}: \${update.energy_level}
   Context: \${update.context || 'No context'}
   Time: \${new Date(update.timestamp).toLocaleString()}\`).join('')}}

LINKED TASKS AND PROJECTS:
{{taskLinks.map((task, index) => \`
\${index + 1}. \${task.task_title} (\${task.task_type || 'Unspecified'})
   URL: \${task.task_url}
   Linked: \${task.linked_at}\`).join('')}}

Please analyze this tide data specifically in relation to the user's question: "{{analysis_question}}"

{{context ? \`Consider the additional context: "\${context}"\` : ''}}

{{output_format === 'structured' ? 'Please provide a structured response with clear sections, bullet points, and organized insights.' : 
  output_format === 'actionable' ? 'Please focus on actionable recommendations and specific steps the user can take immediately.' :
  'Please provide a narrative analysis that flows naturally and tells the story of this tide\'s performance and patterns.'}}

Base your analysis on the concrete data provided, identify relevant patterns, and provide insights that directly address the user's specific question and context.`
  }
};

/**
 * Process template with data substitution
 * 
 * @param template Context template string
 * @param data Data object for template variable substitution
 * @returns Processed template with variables substituted
 */
export function processTemplate(template: string, data: any): string {
  try {
    // Simple template substitution using {{variable}} syntax
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // Create a function that evaluates the expression in the context of the data
        const func = new Function('data', `
          with(data) { 
            try {
              return ${expression};
            } catch (e) {
              return "${match}";
            }
          }
        `);
        const result = func(data);
        return result !== undefined && result !== null ? String(result) : match;
      } catch (error) {
        console.warn(`Template variable evaluation failed for: ${expression}`, error);
        return match; // Return original if evaluation fails
      }
    });
  } catch (error) {
    console.error('Template processing failed:', error);
    return template; // Return original template if processing fails
  }
}

/**
 * Get prompt template by name
 * 
 * @param promptName Name of the prompt
 * @returns Prompt template or null if not found
 */
export function getPromptTemplate(promptName: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[promptName] || null;
}

/**
 * Get all available prompt names
 * 
 * @returns Array of available prompt names
 */
export function getAvailablePrompts(): string[] {
  return Object.keys(PROMPT_TEMPLATES);
}