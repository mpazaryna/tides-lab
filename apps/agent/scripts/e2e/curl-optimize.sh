#!/bin/bash

# E2E Test: Optimize Service with Real R2 Data
# Tests data-driven schedule optimization

echo "⚡ Testing Optimize Service - Real Data Scheduling"
echo "================================================"

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo "📅 Making request to optimize service..."

curl -s -X POST "$ENDPOINT" \
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
  }' | jq .

echo ""
echo "🏁 Optimize test complete!"