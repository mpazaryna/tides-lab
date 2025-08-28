# ARCHIVED - AI Features Removed

⚠️ **This document is archived.** The AI tools referenced here have been removed from the Tides codebase.

The following tools are **no longer available**:
- `ai_analyze_productivity`
- `ai_suggest_flow_session`
- `ai_optimize_schedule`
- `ai_session_insights`
- `ai_predict_energy`

## Current Available Tools

Use the following MCP tools instead:

```javascript
// Get tide reports for analysis
await mcpClient.callTool('tide_get_report', {
  tideId: currentTide.id,
  format: 'summary'
});

// Start flow sessions
await mcpClient.callTool('tide_smart_flow', {
  work_context: 'focused development work',
  initial_energy: 'high',
  duration: 25
});

// Add energy tracking
await mcpClient.callTool('tide_add_energy', {
  energy_level: 8,
  context: 'post-coffee energy boost'
});
```

See the current API documentation for all available tools.
