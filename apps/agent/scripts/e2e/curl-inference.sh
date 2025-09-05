#!/bin/bash

# E2E Test: Service Inference - Chat Agent for Intent Clarification
# Tests automatic service routing without explicit service parameter

echo "🤖 Testing Service Inference - Chat Agent Integration"
echo "=================================================="

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo "📊 Testing insights inference with productivity question..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "How productive have I been this week?"
  }' | jq .

echo ""
echo "⚡ Testing optimize inference with scheduling question..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "Can you optimize my schedule for tomorrow?",
    "preferences": {
      "work_hours": {
        "start": "09:00",
        "end": "17:00"
      },
      "focus_time_blocks": 90
    }
  }' | jq .

echo ""
echo "❓ Testing questions inference with specific question..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "I feel tired in the afternoons, any suggestions?"
  }' | jq .

echo ""
echo "⚙️ Testing preferences inference with settings request..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "Show me my current preferences",
    "preferences": {
      "work_hours": {
        "start": "08:30",
        "end": "16:30"
      },
      "break_duration": 20,
      "focus_time_blocks": 120
    }
  }' | jq .

echo ""
echo "🗨️ Testing chat service with ambiguous request..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "I need help with my work"
  }' | jq .

echo ""
echo "🏁 Service inference test complete!"