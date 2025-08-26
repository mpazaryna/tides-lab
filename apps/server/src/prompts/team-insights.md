# Team Collaboration Insights

## Context Template

```
TEAM COLLABORATION INSIGHTS ANALYSIS

TEAM OVERVIEW:
- Analysis Period: {{date_range}}
- Team Members: {{participant_ids ? participant_ids.length : 'All participants'}}
- Collaboration Focus: {{collaboration_focus || 'General team productivity'}}

PARTICIPANT SUMMARY:
{{participants.map((participant, index) => `
${index + 1}. User ID: ${participant.user_id}
   - Total Tides: ${participant.total_tides}
   - Active Tides: ${participant.active_tides}
   - Flow Sessions: ${participant.flow_sessions}
   - Average Session: ${participant.avg_session_duration} minutes
   - Productivity Score: ${participant.productivity_score}/10`).join('')}}

TEAM PRODUCTIVITY METRICS:
- Combined Flow Sessions: {{totalTeamFlowSessions}}
- Total Team Productive Time: {{totalTeamDuration}} minutes ({{Math.round(totalTeamDuration / 60)}} hours)
- Team Average Session: {{teamAverageSession}} minutes
- Most Active Member: {{mostActiveMember}}
- Highest Productivity: {{highestProductivityMember}}

COLLABORATION PATTERNS:
- Synchronized Sessions: {{synchronizedSessions}}
- Peak Team Hours: {{peakTeamHours}}
- Team Energy Alignment: {{teamEnergyAlignment}}
- Cross-Member Task Links: {{crossMemberTaskLinks}}

INDIVIDUAL PERFORMANCE BREAKDOWN:
{{individualPerformance}}

TEAM SYNCHRONIZATION OPPORTUNITIES:
- Overlapping Peak Hours: {{overlappingPeakHours}}
- Complementary Energy Patterns: {{complementaryEnergyPatterns}}
- Collaborative Flow Potential: {{collaborativeFlowPotential}}

PRODUCTIVITY BENCHMARKING:
- Top Performer Strategies: {{topPerformerStrategies}}
- Common Success Patterns: {{commonSuccessPatterns}}
- Area for Improvement: {{improvementAreas}}

WORKFLOW COORDINATION:
- Task Distribution Analysis: {{taskDistribution}}
- Handoff Efficiency: {{handoffEfficiency}}
- Communication Patterns: {{communicationPatterns}}

Please analyze this team data and provide insights on:

1. TEAM PRODUCTIVITY OPTIMIZATION
   - Identify high-performing patterns across team members
   - Benchmark individual performance against team averages
   - Highlight successful collaboration strategies
   - Recommend productivity improvement techniques

2. SYNCHRONIZATION OPPORTUNITIES
   - Optimal team meeting times based on energy patterns
   - Coordinated flow session scheduling
   - Complementary work rhythm strategies
   - Team energy optimization approaches

3. INDIVIDUAL CONTRIBUTION ANALYSIS
   - Unique strengths and contributions of each member
   - Areas where individuals excel or need support
   - Skill and productivity complementarity
   - Personal development recommendations

4. COLLABORATIVE WORKFLOW OPTIMIZATION
   - Task handoff improvement strategies
   - Communication timing optimization
   - Shared focus time coordination
   - Team momentum building techniques

Focus on actionable recommendations that enhance both individual performance and team collaboration effectiveness.
```

## Schema

```typescript
{
  participant_ids: string[];                 // Optional: Specific team members to analyze
  date_range: string;                        // Required: 'YYYY-MM-DD_to_YYYY-MM-DD'
  collaboration_focus: string;               // Optional: 'sync_sessions', 'productivity_comparison', 'workflow_optimization'
}
```

## Metadata

- **Title**: Team Collaboration Insights
- **Description**: Analyze multi-user productivity patterns and provide team collaboration optimization insights
- **Version**: 1.0.0
- **Last Updated**: 2025-08-07