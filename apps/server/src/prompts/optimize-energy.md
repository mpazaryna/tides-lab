# Energy Optimization Analysis

## Context Template

```
ENERGY OPTIMIZATION ANALYSIS REQUEST

TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Target Schedule: {{target_schedule || 'Not specified'}}
- Energy Goals: {{energy_goals || 'General optimization'}}

ENERGY PATTERNS:
- Total Energy Data Points: {{energyUpdates.length}}
- Energy Tracking Period: {{energyTrackingPeriod}}
- Average Energy Level: {{averageEnergyLevel}}

ENERGY PROGRESSION ANALYSIS:
{{energyUpdates.map((update, index) => `
${index + 1}. ${update.timestamp}: ${update.energy_level}
   Context: ${update.context || 'No context'}
   Time of Day: ${new Date(update.timestamp).toLocaleTimeString()}
   Day of Week: ${new Date(update.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}`).join('')}}

FLOW SESSION ENERGY CORRELATION:
{{flowSessions.map((session, index) => `
Session ${index + 1}:
- Start Time: ${session.started_at}
- Duration: ${session.duration} minutes
- Intensity: ${session.intensity}
- Initial Energy: ${session.energy_level || 'Not recorded'}
- Session Success: ${session.focus_rating || 'Not rated'}/10`).join('')}}

TIME-OF-DAY ENERGY PATTERNS:
- Morning Energy (6-12 PM): {{morningEnergyStats}}
- Afternoon Energy (12-6 PM): {{afternoonEnergyStats}}
- Evening Energy (6-10 PM): {{eveningEnergyStats}}

WEEKLY ENERGY RHYTHMS:
{{weeklyEnergyPattern}}

ENERGY-PERFORMANCE CORRELATION:
- High Energy → Flow Success Rate: {{highEnergySuccessRate}}%
- Medium Energy → Flow Success Rate: {{mediumEnergySuccessRate}}%
- Low Energy → Flow Success Rate: {{lowEnergySuccessRate}}%

OPTIMAL ENERGY WINDOWS:
- Peak Energy Hours: {{peakEnergyHours}}
- Energy Crash Times: {{energyCrashTimes}}
- Recovery Patterns: {{recoveryPatterns}}

ENERGY MANAGEMENT INSIGHTS:
- Energy Consistency: {{energyConsistency}}
- Energy Recovery Rate: {{energyRecoveryRate}}
- Sustainable Energy Practices: {{sustainablePractices}}

Please provide an energy optimization analysis focusing on:

1. OPTIMAL SCHEDULING
   - Best time windows for high-intensity work
   - Energy-aware session planning
   - Peak performance scheduling
   - Energy recovery scheduling

2. ENERGY MANAGEMENT STRATEGIES
   - Techniques to maintain consistent energy
   - Methods to avoid energy crashes
   - Energy restoration practices
   - Sustainable work rhythms

3. PERSONALIZED RECOMMENDATIONS
   - Time-of-day optimization based on patterns
   - Duration adjustments for energy levels
   - Intensity matching to energy capacity
   - Break timing for energy renewal

4. PROACTIVE ENERGY PLANNING
   - Weekly energy rhythm optimization
   - Workload distribution strategies
   - Energy forecasting and planning
   - Preventive energy management

Focus on creating a sustainable, personalized energy optimization strategy based on the observed patterns.
```

## Schema

```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  target_schedule: string;                   // Optional: 'morning_focused', 'afternoon_preferred', 'maximize_peak_hours'
  energy_goals: string;                      // Optional: Comma-separated energy goals
}
```

## Metadata

- **Title**: Energy Optimization Analysis
- **Description**: Analyze energy patterns and provide scheduling recommendations for optimal performance
- **Version**: 1.0.0
- **Last Updated**: 2025-08-07