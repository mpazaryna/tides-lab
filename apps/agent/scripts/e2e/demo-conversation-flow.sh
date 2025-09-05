#!/bin/bash

# Demo: Conversational Workflow with Chat Agent
# Shows how the chat agent clarifies intent and routes to appropriate services

echo "🎭 DEMO: Conversational Workflow with Chat Agent"
echo "================================================="
echo ""
echo "Scenario: User wants productivity insights but asks ambiguously"
echo "-----------------------------------------------------------------"

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"

echo ""
echo "📱 Step 1: Initial ambiguous request from mobile app"
echo "User says: 'How am I doing?'"
echo ""

echo "REQUEST:"
echo "--------"
cat <<EOF
{
  "api_key": "tides_testuser_12345",
  "tides_id": "daily-tide-default",
  "message": "How am I doing?"
}
EOF

echo ""
echo ""
echo "RESPONSE:"
echo "---------"

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_testuser_12345",
    "tides_id": "daily-tide-default",
    "message": "How am I doing?"
  }')

echo "$RESPONSE" | jq .

# Extract conversation_id for follow-up
CONV_ID=$(echo "$RESPONSE" | jq -r '.data.conversation_id')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Step 2: User clarifies by selecting suggestion or typing response"
echo "User selects: 'View productivity insights'"
echo ""

echo "REQUEST:"
echo "--------"
cat <<EOF
{
  "api_key": "tides_testuser_12345",
  "tides_id": "daily-tide-default",
  "message": "Show me my productivity insights for this week",
  "conversation_id": "$CONV_ID"
}
EOF

echo ""
echo ""
echo "RESPONSE:"
echo "---------"

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"tides_testuser_12345\",
    \"tides_id\": \"daily-tide-default\",
    \"message\": \"Show me my productivity insights for this week\",
    \"conversation_id\": \"$CONV_ID\"
  }" | jq .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 WORKFLOW SUMMARY:"
echo "--------------------"
echo "1. User asks ambiguous question → Chat agent responds with clarification"
echo "2. User provides more context → System routes to insights service"
echo "3. User gets actual productivity data from their tide"
echo ""
echo "Key benefits:"
echo "• No need to specify 'service' parameter"
echo "• Natural conversation flow"
echo "• Progressive disclosure of intent"
echo "• Better user experience"
echo ""
echo "🏁 Demo complete!"