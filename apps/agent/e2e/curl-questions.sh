#!/bin/bash

# E2E Test: Questions Service with Real R2 Data
# Tests contextual Q&A with real user data

echo "❓ Testing Questions Service - Contextual Intelligence"
echo "==================================================="

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo "🤖 Testing morning productivity question..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "questions",
    "question": "How can I improve my morning productivity?"
  }' | jq .

echo ""
echo "🤖 Testing energy management question..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "service": "questions",
    "question": "I feel tired in the afternoons, any suggestions?"
  }' | jq .

echo ""
echo "🏁 Questions test complete!"