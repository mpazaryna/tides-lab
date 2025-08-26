# Custom Tide Analysis

## Context Template

```
CUSTOM TIDE ANALYSIS REQUEST

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
{{flowSessions.map((session, index) => `
Session ${index + 1} (${session.started_at}):
- Duration: ${session.duration} minutes
- Intensity: ${session.intensity}
- Initial Energy: ${session.energy_level || 'Not specified'}
- Work Context: ${session.work_context || 'No context'}
- Focus Rating: ${session.focus_rating || 'Not rated'}/10`).join('')}}

ENERGY TRACKING DATA:
{{energyUpdates.map((update, index) => `
${index + 1}. ${update.timestamp}: ${update.energy_level}
   Context: ${update.context || 'No additional context'}
   Time: ${new Date(update.timestamp).toLocaleString()}`).join('')}}

LINKED TASKS AND PROJECTS:
{{taskLinks.map((task, index) => `
${index + 1}. ${task.task_title} (${task.task_type || 'Unspecified type'})
   URL: ${task.task_url}
   Linked: ${task.linked_at}
   Description: ${task.description || 'No description'}`).join('')}}

CALCULATED ANALYTICS:
- Peak Performance Hours: {{peakHours}}
- Most Effective Session Duration: {{optimalDuration}} minutes
- Preferred Intensity Level: {{preferredIntensity}}
- Energy-Performance Correlation: {{energyPerformanceCorrelation}}
- Task Completion Patterns: {{taskCompletionPatterns}}
- Productivity Trends: {{productivityTrends}}

PATTERN RECOGNITION:
- Weekly Rhythm: {{weeklyRhythm}}
- Daily Patterns: {{dailyPatterns}}
- Seasonal Trends: {{seasonalTrends}}
- Interruption Patterns: {{interruptionPatterns}}

Please analyze this tide data specifically in relation to the user's question: "{{analysis_question}}"

Consider the additional context: "{{context}}"

{{output_format === 'structured' ? 'Please provide a structured response with clear sections, bullet points, and organized insights.' : 
  output_format === 'actionable' ? 'Please focus on actionable recommendations and specific steps the user can take immediately.' :
  'Please provide a narrative analysis that flows naturally and tells the story of this tide\'s performance and patterns.'}}

Base your analysis on the concrete data provided, identify relevant patterns, and provide insights that directly address the user's specific question and context.
```

## Schema

```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  analysis_question: string;                 // Required: User's specific question
  context: string;                           // Optional: Additional context for analysis
  output_format: 'narrative'|'structured'|'actionable'; // Optional: Response format preference
}
```

## Metadata

- **Title**: Custom Tide Analysis
- **Description**: Flexible analysis prompt that handles user-defined questions and custom analysis requirements
- **Version**: 1.0.0
- **Last Updated**: 2025-08-07