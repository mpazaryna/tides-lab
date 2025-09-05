#!/bin/bash

# E2E Test: Preferences Service with Real KV Storage
# Tests user preference persistence and retrieval

echo "⚙️  Testing Preferences Service - KV Storage Persistence"
echo "======================================================="

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo "📖 Getting current preferences..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "preferences"
  }' | jq .

echo ""
echo "💾 Updating preferences with custom values..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "preferences",
    "preferences": {
      "work_hours": {
        "start": "08:30",
        "end": "16:30"
      },
      "break_duration": 20,
      "focus_time_blocks": 120,
      "notification_preferences": {
        "insights": true,
        "optimization": false,
        "reminders": true
      }
    }
  }' | jq .

echo ""
echo "📖 Verifying persistence by retrieving updated preferences..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "preferences"
  }' | jq .

echo ""
echo "🏁 Preferences test complete!"