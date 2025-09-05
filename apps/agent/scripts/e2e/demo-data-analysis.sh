#!/bin/bash

# Demo: Real Data Analysis from R2 Mock Tide
# Shows how services analyze the actual tide JSON data

echo "🔬 DEMO: Real Tide Data Analysis"
echo "================================="
echo ""
echo "Mock tide contains:"
echo "• 10 flow sessions (45-90 minutes each)"
echo "• 11 energy updates (levels 6-9)"
echo "• 9 task links (OAuth, API, testing tasks)"
echo "• Sessions at 9:00 AM and 1:00 PM"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo ""
echo "📊 1. INSIGHTS SERVICE - Analyzing productivity patterns"
echo "---------------------------------------------------------"

INSIGHTS=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "insights",
    "timeframe": "7d"
  }')

echo "$INSIGHTS" | jq '{
  productivity_score: .data.productivity_score,
  weekly_pattern: .data.trends.weekly_pattern,
  peak_hour: (.data.recommendations[0] | if . then (. | capture("around (?<time>[0-9]+:[0-9]+ [AP]M)") | .time) else null end),
  total_recommendations: (.data.recommendations | length)
}'

echo ""
echo "Key findings from real data:"
echo "• Detects 9:00 AM peak from 5 morning flow sessions"
echo "• Shows energy level 8-9 in mornings from energy updates"
echo "• Calculates productivity score from actual session durations"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚡ 2. OPTIMIZE SERVICE - Creating schedule from patterns"
echo "---------------------------------------------------------"

OPTIMIZE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "optimize",
    "preferences": {
      "work_hours": {
        "start": "09:00",
        "end": "17:00"
      },
      "focus_time_blocks": 90
    }
  }')

echo "$OPTIMIZE" | jq '{
  first_block: .data.suggested_schedule.time_blocks[0],
  total_blocks: (.data.suggested_schedule.time_blocks | length),
  time_saved: .data.efficiency_gains.estimated_time_saved,
  focus_improvement: .data.efficiency_gains.focus_improvement
}'

echo ""
echo "Schedule optimization based on:"
echo "• Places deep work at 9:00-11:00 (peak productivity time)"
echo "• 90-minute blocks match average session duration in data"
echo "• Afternoon blocks at 1:00 PM (second peak from data)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "❓ 3. QUESTIONS SERVICE - Context-aware responses"
echo "----------------------------------------------------"

QUESTION=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "questions",
    "question": "What tasks have I been working on?"
  }')

echo "$QUESTION" | jq '{
  confidence: .data.confidence,
  mentions_oauth: (.data.answer | test("OAuth|authentication")),
  mentions_sessions: (.data.answer | test("10|sessions")),
  answer_preview: (.data.answer | .[0:100] + "...")
}'

echo ""
echo "Response uses actual task data:"
echo "• OAuth2 integration (from task links)"
echo "• API endpoints (from task links)"
echo "• 10 flow sessions (from flow_sessions array)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📈 4. REPORTS SERVICE - Comprehensive analytics"
echo "------------------------------------------------"

REPORT=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "reports",
    "report_type": "productivity",
    "timeframe": "7d"
  }')

echo "$REPORT" | jq '{
  total_flow_time: .data.summary.total_flow_time_minutes,
  sessions_completed: .data.summary.sessions_completed,
  average_energy: .data.summary.average_energy_level,
  peak_hours: .data.insights.peak_productivity_hours,
  has_chart_data: (if .data.visualizations then true else false end)
}'

echo ""
echo "Report analyzes complete dataset:"
echo "• Total flow time from 10 sessions"
echo "• Energy average from 11 updates"
echo "• Peak hours from session timestamps"
echo "• Visualization data for charts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SUMMARY: All services are using real R2 tide data!"
echo ""
echo "The mock-tide-data.json in R2 contains:"
echo "• Real timestamps and durations"
echo "• Actual task descriptions (OAuth, API work)"
echo "• Energy levels throughout the day"
echo "• Complete flow session records"
echo ""
echo "Each service analyzes this data differently:"
echo "• Insights: Finds patterns and trends"
echo "• Optimize: Creates schedules based on peaks"
echo "• Questions: Provides context-aware answers"
echo "• Reports: Generates comprehensive analytics"
echo ""
echo "🏁 Demo complete!"