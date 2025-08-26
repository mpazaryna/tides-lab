# Productivity Pattern Insights

## Context Template

```
PRODUCTIVITY INSIGHTS ANALYSIS REQUEST

TIDE OVERVIEW:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Analysis Period: {{time_period || 'All available data'}}
- Comparison Baseline: {{comparison_baseline || 'None specified'}}

PRODUCTIVITY METRICS:
- Total Flow Sessions: {{flowSessions.length}}
- Total Productive Time: {{totalDuration}} minutes ({{Math.round(totalDuration / 60 * 10) / 10}} hours)
- Average Session Length: {{averageDuration}} minutes
- Session Frequency: {{sessionFrequency}} sessions per week
- Peak Performance Hours: {{peakHours}}

TIMING PATTERNS:
{{timingAnalysis}}

SESSION EFFECTIVENESS:
- Most Productive Sessions: {{mostProductiveSessions}}
- Least Productive Sessions: {{leastProductiveSessions}}
- Duration Sweet Spot: {{optimalDuration}} minutes
- Intensity Preference: {{preferredIntensity}}

ENERGY CORRELATION:
- High Energy Sessions: {{highEnergySessions.length}} ({{highEnergyAvgDuration}}min avg)
- Medium Energy Sessions: {{mediumEnergySessions.length}} ({{mediumEnergyAvgDuration}}min avg)
- Low Energy Sessions: {{lowEnergySessions.length}} ({{lowEnergyAvgDuration}}min avg)

INTERRUPTION ANALYSIS:
- Sessions With Interruptions: {{interruptedSessions}}%
- Common Interruption Times: {{commonInterruptionTimes}}
- Impact on Completion: {{interruptionImpact}}

WEEKLY RHYTHM:
{{weeklyPattern}}

ENVIRONMENTAL FACTORS:
- Context Analysis: {{contextEffectiveness}}
- Task Type Correlation: {{taskTypeAnalysis}}

Please analyze these patterns and provide:

1. OPTIMAL TIMING RECOMMENDATIONS
   - Best time blocks for flow sessions
   - Duration optimization based on performance data
   - Weekly scheduling suggestions
   - Energy-aware timing strategies

2. PRODUCTIVITY OPTIMIZATION
   - Session structure improvements
   - Intensity level optimization
   - Context optimization strategies
   - Environmental factor adjustments

3. INTERRUPTION MITIGATION
   - Pattern identification and solutions
   - Proactive scheduling adjustments
   - Focus protection strategies
   - Recovery optimization techniques

4. PERFORMANCE ENHANCEMENT
   - Energy management for peak performance
   - Session preparation optimization
   - Progress tracking improvements
   - Motivation and momentum strategies

Focus on actionable insights that can immediately improve productivity patterns and flow session effectiveness.
```

## Schema

```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  time_period: string;                       // Optional: '7_days', '30_days', 'all_time'
  comparison_baseline: string;               // Optional: 'previous_period', 'personal_average'
}
```

## Metadata

- **Title**: Productivity Pattern Insights
- **Description**: Identify patterns, trends, and optimization opportunities across flow sessions and workflows
- **Version**: 1.0.0
- **Last Updated**: 2025-08-07