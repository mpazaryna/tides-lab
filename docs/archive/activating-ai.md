# Next Steps: Activating AI Features in Your App

## 1. Deploy the Server (5 mins)

```bash
cd apps/server
wrangler deploy --env 006  # or your preferred environment
```

The AI tools will automatically register when Workers AI binding is available.

## 2. Test AI Tools (10 mins)

Use your React Native app or any MCP client to test:

```javascript
// Test productivity analysis
await mcpClient.callTool('ai_analyze_productivity', {
  sessions: [
    { 
      duration: 25, 
      energy_level: 8, 
      completed_at: '2025-08-16T09:00:00Z',
      productivity_score: 9 
    },
    { 
      duration: 30, 
      energy_level: 6, 
      completed_at: '2025-08-16T14:00:00Z',
      productivity_score: 7 
    }
  ],
  analysis_depth: 'quick' // or 'detailed'
});

// Test flow suggestions  
await mcpClient.callTool('ai_suggest_flow_session', {
  user_context: {
    energy_level: 7,
    recent_sessions: [...],
    preferences: { work_style: 'focused' }
  }
});
```

## 3. Mobile App Integration (20 mins)

Add AI features to your React Native screens:

```javascript
// In your Home.tsx or dashboard
const analyzeProductivity = async () => {
  const result = await mcpService.callTool('ai_analyze_productivity', {
    sessions: userSessions,
    analysis_depth: 'quick'
  });
  setInsights(result.insights);
};

const getFlowSuggestions = async () => {
  const result = await mcpService.callTool('ai_suggest_flow_session', {
    user_context: {
      energy_level: currentEnergyLevel,
      recent_sessions: recentSessions,
      preferences: userPreferences
    }
  });
  setSuggestions(result.suggestions);
};
```

## 4. Optional Enhancements (Later)

- **Dashboard Widget**: Show AI insights on home screen
- **Smart Notifications**: Use energy predictions for timing
- **Auto-Scheduling**: Implement `ai_optimize_schedule` for calendar integration
- **Session Feedback**: Use `ai_session_insights` for post-session analysis

## 5. Monitor & Iterate

- Check Workers AI usage in Cloudflare dashboard
- Monitor response times (should be <500ms for quick analysis)
- Collect user feedback on AI suggestions quality
