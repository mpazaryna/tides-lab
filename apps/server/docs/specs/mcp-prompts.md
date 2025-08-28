# MCP Prompts Specification

## Executive Summary

This document defines the Model Context Protocol (MCP) prompts implementation for Tides, enabling AI-powered analysis of tidal workflows through standardized prompt interfaces. These prompts integrate with Cloudflare Agents and React Native applications to provide intelligent insights about productivity patterns, energy optimization, and collaborative workflows.

## Background

Model Context Protocol (MCP) prompts are a standardized way to provide AI models with structured context and instructions for specific analysis tasks. Unlike tools which perform actions, prompts provide rich context and ask AI models to analyze, interpret, and provide insights about data.

### Why MCP Prompts for Tides?

1. **AI-Powered Analytics**: Enable sophisticated analysis beyond simple data aggregation
2. **Contextual Intelligence**: Provide rich context about workflow patterns and productivity
3. **Customizable Insights**: Allow users to ask specific questions about their data
4. **Agent Integration**: Support autonomous agents that can analyze and optimize workflows
5. **React Native Integration**: Enable AI-powered features in mobile applications

## Architecture Overview

```
┌─────────────────┐    MCP Prompts     ┌──────────────────┐
│ React Native    │◄──────────────────►│   MCP Server     │
│      App        │                    │  (5 Prompts)     │
└─────────────────┘                    └──────────────────┘
         │                                      │
         │                                      ▼
         ▼                              ┌──────────────────┐
┌─────────────────┐                    │  Tide Tools      │
│  Analysis       │                    │ (tide_get_raw_   │
│   Results       │                    │  tide_get_report)│
└─────────────────┘                    └──────────────────┘
                                               │
                                               ▼
                                       ┌──────────────────┐
                                       │ R2/D1 Storage    │
                                       │  (Tide Data)     │
                                       └──────────────────┘
```

## Prompt Specifications

### 1. Comprehensive Tide Analysis (`analyze_tide`)

**Purpose**: Provide deep, comprehensive analysis of a single tide's complete lifecycle and performance.

**Input Schema**:
```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  analysis_depth: 'basic'|'detailed'|'comprehensive'; // Optional: Analysis depth
  focus_areas?: string[];                    // Optional: Specific areas to emphasize
}
```

**Context Provided**:
- Complete tide data from `tide_get_raw_json`
- Flow session details with timing patterns
- Energy progression throughout sessions
- Task links and external integrations
- Calculated analytics and performance metrics

**Example Usage**:
```typescript
// React Native - Get comprehensive project analysis
const analysisPrompt = await mcpClient.getPrompt('analyze_tide', {
  tide_id: 'tide_project_q1_2025',
  analysis_depth: 'comprehensive',
  focus_areas: ['productivity_patterns', 'energy_optimization', 'task_correlation']
});
```

**AI Output Focus**:
- Productivity patterns and trends
- Energy utilization and optimization opportunities
- Task correlation with flow session success
- Time-of-day performance insights
- Recommendations for workflow improvements

### 2. Productivity Pattern Insights (`productivity_insights`)

**Purpose**: Identify patterns, trends, and optimization opportunities across flow sessions and workflows.

**Input Schema**:
```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  time_period?: string;                      // Optional: '7_days', '30_days', etc.
  comparison_baseline?: string;              // Optional: 'previous_period', 'personal_average'
}
```

**Context Provided**:
- Historical flow session data
- Energy patterns over time
- Completion rates and focus ratings
- Interruption patterns and frequency
- Peak performance timing analysis

**Example Usage**:
```typescript
// React Native - Get productivity optimization insights
const insights = await mcpClient.getPrompt('productivity_insights', {
  tide_id: 'tide_daily_focus',
  time_period: '30_days',
  comparison_baseline: 'previous_month'
});
```

**AI Output Focus**:
- Optimal session timing recommendations
- Duration sweet spot analysis
- Energy pattern recognition
- Interruption mitigation strategies
- Productivity score improvement suggestions

### 3. Energy Optimization (`optimize_energy`)

**Purpose**: Analyze energy patterns and provide scheduling recommendations for optimal performance.

**Input Schema**:
```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  target_schedule?: string;                  // Optional: 'morning_focused', 'afternoon_preferred'
  energy_goals?: string[];                   // Optional: ['maintain_high', 'avoid_crashes']
}
```

**Context Provided**:
- Energy progression data with timestamps
- Correlation between energy levels and flow success
- Time-of-day energy patterns
- Weekly and daily rhythm analysis
- Session intensity effectiveness

**Example Usage**:
```typescript
// React Native - Get personalized energy optimization
const energyOptimization = await mcpClient.getPrompt('optimize_energy', {
  tide_id: 'tide_creative_work',
  target_schedule: 'maximize_peak_hours',
  energy_goals: ['consistent_high_energy', 'minimize_afternoon_dips']
});
```

**AI Output Focus**:
- Optimal flow session scheduling
- Energy management strategies
- Peak performance window identification
- Recovery and renewal recommendations
- Personalized rhythm optimization

### 4. Team Collaboration Insights (`team_insights`)

**Purpose**: Analyze multi-user productivity patterns and provide team collaboration optimization insights.

**Input Schema**:
```typescript
{
  participant_ids?: string[];                // Optional: Specific team members
  date_range: string;                        // Required: 'YYYY-MM-DD_to_YYYY-MM-DD'
  collaboration_focus?: string;              // Optional: 'sync_sessions', 'productivity_comparison'
}
```

**Context Provided**:
- Participant data from multiple users
- Cross-user productivity patterns
- Team flow session coordination
- Collaborative workflow effectiveness
- Individual vs. team performance metrics

**Example Usage**:
```typescript
// React Native - Team manager dashboard insights
const teamAnalysis = await mcpClient.getPrompt('team_insights', {
  participant_ids: ['user_123', 'user_456', 'user_789'],
  date_range: '2025-01-01_to_2025-01-31',
  collaboration_focus: 'productivity_optimization'
});
```

**AI Output Focus**:
- Team productivity benchmarking
- Collaboration pattern optimization
- Individual contribution analysis
- Synchronization opportunities
- Team workflow recommendations

### 5. Custom Tide Analysis (`custom_tide_analysis`)

**Purpose**: Flexible analysis prompt that can handle user-defined questions and custom analysis requirements.

**Input Schema**:
```typescript
{
  tide_id: string;                           // Required: Tide to analyze
  analysis_question: string;                 // Required: User's specific question
  context?: string;                          // Optional: Additional context for analysis
  output_format?: 'narrative'|'structured'|'actionable'; // Optional: Response format preference
}
```

**Context Provided**:
- Complete tide data based on question relevance
- Flexible data selection based on analysis_question
- User-provided context integration
- Customizable analytical framework

**Example Usage**:
```typescript
// React Native - User asks specific question
const customAnalysis = await mcpClient.getPrompt('custom_tide_analysis', {
  tide_id: 'tide_writing_project',
  analysis_question: 'What factors most significantly impact my creative writing productivity?',
  context: 'I want to optimize my writing schedule for maximum creative output',
  output_format: 'actionable'
});
```

**AI Output Focus**:
- Direct response to user's question
- Relevant data analysis and insights
- Contextual recommendations
- Format-appropriate presentation
- Actionable next steps

## Data Integration Patterns

### Raw Data Access
All prompts leverage existing MCP tools for data access:

```typescript
// Each prompt internally uses these patterns:
const tideData = await tide_get_raw_json({ tide_id });        // Complete raw data
const reportData = await tide_get_report({ tide_id });       // Processed analytics
const participants = await tides_get_participants({ ... });  // Team data
```

### Context Enrichment
Prompts provide rich context to AI models:

```typescript
const contextTemplate = `
TIDE ANALYSIS REQUEST

Tide Information:
- Name: ${tide.name}
- Type: ${tide.flow_type}  
- Created: ${tide.created_at}
- Status: ${tide.status}

Performance Metrics:
- Total Sessions: ${analytics.total_sessions}
- Total Duration: ${analytics.total_duration} minutes
- Average Focus: ${analytics.average_focus_rating}/10
- Completion Rate: ${analytics.completion_rate * 100}%

Flow Sessions: [${flowSessions.length} sessions]
${flowSessions.map(session => `
- ${session.started_at}: ${session.duration}min (${session.intensity})
  Focus: ${session.focus_rating}/10, Energy: ${session.initial_energy} → ${session.final_energy}
`).join('')}

Energy Progression: [${energyUpdates.length} data points]
${energyUpdates.map(update => `
- ${update.timestamp}: ${update.energy_level} (${update.context})
`).join('')}

Please analyze this data and provide insights about: ${analysis_question}
`;
```

## React Native Integration

### MCP Client Usage Pattern

```typescript
// React Native App - Analytics Screen
const TideAnalyticsScreen = ({ tideId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAnalysis = async (analysisType, params) => {
    setLoading(true);
    try {
      const prompt = await mcpClient.getPrompt(analysisType, {
        tide_id: tideId,
        ...params
      });
      
      // Send to AI service (ChatGPT, Claude, etc.)
      const aiResponse = await aiService.analyze(prompt.messages[0].content.text);
      setAnalysis(aiResponse);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button 
        title="Comprehensive Analysis"
        onPress={() => getAnalysis('analyze_tide', { analysis_depth: 'comprehensive' })}
      />
      <Button 
        title="Energy Optimization"
        onPress={() => getAnalysis('optimize_energy', { target_schedule: 'morning_focused' })}
      />
      <Button 
        title="Productivity Insights"
        onPress={() => getAnalysis('productivity_insights', { time_period: '30_days' })}
      />
      
      {loading && <ActivityIndicator />}
      {analysis && <AnalysisResults data={analysis} />}
    </View>
  );
};
```

### Dashboard Integration

```typescript
// React Native Dashboard with AI Insights
const ProductivityDashboard = ({ userId }) => {
  const [insights, setInsights] = useState({});
  
  useEffect(() => {
    // Get AI insights for each active tide
    const loadInsights = async () => {
      const tides = await mcpClient.callTool('tide_list', { active_only: true });
      
      const analysisPromises = tides.data.map(async (tide) => {
        const prompt = await mcpClient.getPrompt('productivity_insights', {
          tide_id: tide.tide_id,
          time_period: '7_days'
        });
        
        const aiInsight = await aiService.analyze(prompt.messages[0].content.text);
        return { tide_id: tide.tide_id, insight: aiInsight };
      });
      
      const results = await Promise.all(analysisPromises);
      setInsights(results.reduce((acc, { tide_id, insight }) => {
        acc[tide_id] = insight;
        return acc;
      }, {}));
    };
    
    loadInsights();
  }, [userId]);

  return (
    <ScrollView>
      {Object.entries(insights).map(([tideId, insight]) => (
        <InsightCard key={tideId} tideId={tideId} insight={insight} />
      ))}
    </ScrollView>
  );
};
```

## Cloudflare Agents Integration

### Autonomous Analysis Agent

```typescript
// Cloudflare Agent - Autonomous Tide Analysis
export class TideAnalysisAgent extends DurableObject {
  async analyzeUserTides(userId: string) {
    // Get user's active tides
    const tides = await this.getTidesForUser(userId);
    
    for (const tide of tides) {
      // Use MCP prompts for analysis
      const productivityPrompt = await this.server.getPrompt('productivity_insights', {
        tide_id: tide.id,
        time_period: '7_days'
      });
      
      const energyPrompt = await this.server.getPrompt('optimize_energy', {
        tide_id: tide.id,
        energy_goals: ['consistent_performance']
      });
      
      // Send to AI for analysis
      const [productivityInsights, energyOptimization] = await Promise.all([
        this.aiService.analyze(productivityPrompt.messages[0].content.text),
        this.aiService.analyze(energyPrompt.messages[0].content.text)
      ]);
      
      // Store insights for user
      await this.storeInsights(tide.id, {
        productivity: productivityInsights,
        energy: energyOptimization,
        analyzed_at: new Date().toISOString()
      });
      
      // Send proactive recommendations if significant insights found
      if (this.hasActionableInsights(productivityInsights)) {
        await this.notifyUser(userId, {
          type: 'productivity_insight',
          tide_id: tide.id,
          message: this.extractKeyRecommendation(productivityInsights)
        });
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Prompt registration validation
- Schema validation for all input parameters
- Message structure and content verification
- Data integration with existing tools
- Error handling for missing data

### Integration Tests
- Full prompt execution with mock tide data
- AI context structure validation
- Tool integration verification
- Storage interaction testing

### E2E Tests
- Real environment prompt execution
- Cross-environment consistency
- Performance benchmarking
- React Native integration testing

### Test Data
Uses `tests/fixtures/mock-tide-data.json` containing:
- 12 flow sessions with varied patterns
- 15 energy updates with realistic progression
- 6 task links from different sources
- Rich analytics and pattern data

## Performance Considerations

### Context Size Optimization
- Selective data loading based on prompt type
- Summarized data for large datasets
- Efficient JSON serialization
- Caching of frequently requested analyses

### AI Service Integration
- Asynchronous prompt processing
- Result caching for repeated queries
- Rate limiting and queue management
- Fallback strategies for service unavailability

### Mobile App Optimization
- Progressive loading of analysis results
- Background processing for complex analyses
- Offline caching of previous insights
- Network-aware request batching

## Security and Privacy

### Data Access Control
- User-scoped tide data access only
- Authentication context validation
- API key-based authorization
- Rate limiting per user/key

### Privacy Protection
- No storage of AI analysis requests
- User data anonymization in prompts
- Configurable data inclusion levels
- GDPR compliance for EU users

## Future Extensions

### Additional Prompts
- `compare_tides`: Cross-tide performance comparison
- `predict_productivity`: Predictive scheduling analysis
- `workflow_optimization`: End-to-end workflow optimization
- `team_synchronization`: Multi-user coordination insights

### Enhanced Features
- Multi-language prompt support
- Custom prompt templates
- Industry-specific analysis modes
- Integration with external AI services

### Advanced Analytics
- Machine learning pattern recognition
- Predictive modeling integration
- Real-time analysis streaming
- Collaborative filtering recommendations

## Implementation Status

**✅ v1.6.0 - COMPLETED**

- [x] Create mock tide data fixture for testing
- [x] Define comprehensive unit tests  
- [x] **Implement all 5 MCP prompts in server.ts** - PRODUCTION READY
- [x] **Validate prompt registration and schemas** - FULLY VALIDATED
- [x] **Test data integration with existing tools** - COMPLETE
- [x] **Create E2E test suite** - COMPREHENSIVE COVERAGE
- [x] **Deploy across all Cloudflare environments** - LIVE ON TIDES-001+
- [x] **Update Cloudflare Agents specification** - TideProductivityAgent ADDED
- [x] **Document React Native integration patterns** - COMPLETE
- [x] **Fix critical auth context propagation bug** - RESOLVED v1.6.0
- [x] **Template interpolation system** - WORKING WITH REAL DATA
- [x] **Multi-tenant security for enterprise AI** - PRODUCTION READY

**Current Status**: All MCP prompts are **PRODUCTION READY** and deployed across all environments. The system successfully provides rich, contextual AI analysis for any MCP-compatible client or AI agent.

### v1.6.0 Critical Fixes Applied

**Authentication Context Propagation** - Resolved critical bug where MCP prompts were unable to access user-scoped data:

- **Root Cause**: Prompt registrations occurred outside `createServer` function scope, preventing access to `authContext`
- **Solution**: Moved all prompt registrations inside `createServer` with explicit auth context propagation
- **Impact**: Prompts now return properly interpolated templates with real user data instead of raw `{{variable}}` strings
- **Security**: Multi-tenant data isolation now works correctly for enterprise AI deployments

**Template Processing System** - Enhanced template interpolation for rich AI context:

- **Before**: MCP prompts returned raw templates like `{{tide.name}}` and `{{flowSessions.length}}`  
- **After**: Full data interpolation with real values like `"Deep Work Session"` and `"5 sessions"`
- **Benefit**: AI models now receive rich, contextual data for meaningful analysis instead of broken templates

## Conclusion

This MCP prompts implementation provides a standardized, powerful foundation for AI-powered analysis of tidal workflows. By following MCP conventions and integrating deeply with existing tools and data, these prompts enable sophisticated productivity insights for both individual users and teams.

The prompts support multiple use cases from simple analysis requests to complex multi-user collaboration optimization, making them suitable for React Native apps, Cloudflare Agents, and external AI integrations.