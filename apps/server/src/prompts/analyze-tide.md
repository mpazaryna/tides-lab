# Comprehensive Tide Analysis

## Context Template

```
COMPREHENSIVE TIDE ANALYSIS REQUEST

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
{{flowSessions.map((session, index) => `
Session ${index + 1} (${session.started_at}):
- Duration: ${session.duration} minutes
- Intensity: ${session.intensity}
- Energy Level: ${session.energy_level || 'Not specified'}
- Context: ${session.work_context || 'No context provided'}`).join('')}}

ENERGY PROGRESSION: [{{energyUpdates.length}} data points]
{{energyUpdates.map((update, index) => `
${index + 1}. ${update.timestamp}: ${update.energy_level}${update.context ? ` (${update.context})` : ''}`).join('')}}

LINKED TASKS: [{{taskLinks.length}} tasks]
{{taskLinks.map((task, index) => `
${index + 1}. ${task.task_title} (${task.task_type})
   URL: ${task.task_url}
   Linked: ${task.linked_at}`).join('')}}

ANALYSIS REQUEST:
- Analysis Depth: {{analysis_depth || 'detailed'}}
{{focus_areas ? `- Focus Areas: ${focus_areas}` : ''}}

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

Please structure your response with clear sections and specific, actionable insights based on the data provided.
```

## Schema

```typescript
{
  tide_id: string;                           // Required: ID of the tide to analyze
  analysis_depth: 'basic'|'detailed'|'comprehensive'; // Optional: Analysis depth (default: detailed)
  focus_areas: string;                       // Optional: Comma-separated areas to emphasize
}
```

## Metadata

- **Title**: Analyze Tide
- **Description**: Comprehensive analysis of a tide's performance, patterns, and optimization opportunities
- **Version**: 1.0.0
- **Last Updated**: 2025-08-07