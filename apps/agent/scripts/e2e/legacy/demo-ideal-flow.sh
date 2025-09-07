#!/bin/bash

# Demo: IDEAL Conversational Workflow
# Shows how the system SHOULD work with proper intent recognition

echo "🎯 IDEAL WORKFLOW DEMO: Smart Intent Recognition"
echo "================================================="
echo ""
echo "This demo shows how the system SHOULD behave:"
echo "1. Ambiguous requests → Chat for clarification"
echo "2. Clear requests → Direct service routing"
echo "3. Follow-ups with context → Smart routing based on clarified intent"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo ""
echo "📊 SCENARIO 1: Clear request (NO service parameter)"
echo "User: 'Show me my productivity insights'"
echo ""

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "Show me my productivity insights"
  }' | jq '{
    success,
    service: .metadata.service,
    needs_clarification: .data.needs_clarification,
    inference_confidence: .metadata.inference.confidence,
    result: (if .data.needs_clarification then "Chat asking for clarification" elif .data.productivity_score then "Got insights data!" else "Unknown response" end)
  }'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🤔 SCENARIO 2: Ambiguous request needs clarification"
echo "User: 'Help me'"
echo ""

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "Help me"
  }')

echo "$RESPONSE" | jq '{
    success,
    service: .metadata.service,
    needs_clarification: .data.needs_clarification,
    has_suggestions: (if .data.suggestions then true else false end),
    conversation_id: .data.conversation_id
  }'

CONV_ID=$(echo "$RESPONSE" | jq -r '.data.conversation_id')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SCENARIO 3: Follow-up with context (NO service parameter)"
echo "User clarifies: 'I want to see my weekly productivity report'"
echo ""

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"tides_testuser_12345\",
    \"tides_id\": \"daily-tide-default\",
    \"message\": \"I want to see my weekly productivity report\",
    \"conversation_id\": \"$CONV_ID\"
  }" | jq '{
    success,
    service: .metadata.service,
    needs_clarification: .data.needs_clarification,
    inference_confidence: .metadata.inference.confidence,
    result: (if .data.needs_clarification then "Still asking for clarification" elif .data.productivity_score then "Got insights data!" else "Unknown response" end)
  }'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 MOBILE APP IMPLEMENTATION:"
echo "------------------------------"
echo "1. User types/speaks request"
echo "2. If response has 'needs_clarification: true':"
echo "   - Show clarification message"
echo "   - Display suggestion buttons"
echo "   - Keep conversation_id for follow-up"
echo "3. On follow-up, include conversation_id"
echo "4. Get actual service data (insights, optimization, etc.)"
echo ""
echo "🔑 KEY FIELDS TO CHECK:"
echo "• needs_clarification: true/false"
echo "• conversation_id: for threading"
echo "• suggestions: quick action buttons"
echo "• service: which service handled it"
echo ""
echo "🏁 Demo complete!"