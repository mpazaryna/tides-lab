#!/bin/bash

# E2E Test: Insights Service with Real R2 Data
# Tests data-driven productivity insights generation

echo "🔍 Testing Insights Service - Real Data Analysis"
echo "=============================================="

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo "📊 Making request to insights service..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "insights",
    "timeframe": "7d"
  }' | jq .

echo ""
echo "🏁 Insights test complete!"