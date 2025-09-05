#!/bin/bash

# Live Coordinator E2E Test Runner
# Validates deployed coordinator against expected API contracts

set -e

echo "🌐 Live Coordinator E2E Tests"
echo "============================="
echo ""

# Check if we have credentials
if [ -z "$TIDES_API_KEY" ] || [ -z "$TIDES_ID" ]; then
  echo "❌ Missing required credentials!"
  echo ""
  echo "Please set the following environment variables:"
  echo "  export TIDES_API_KEY='tides_userid_randomid'"
  echo "  export TIDES_ID='your-tide-id'"
  echo "  export COORDINATOR_URL='https://tides-101.mpazbot.workers.dev'  # optional"
  echo ""
  echo "Example:"
  echo "  export TIDES_API_KEY='tides_testuser_123456789'"
  echo "  export TIDES_ID='test-tide-123'"
  echo ""
  exit 1
fi

# Set defaults
export COORDINATOR_URL=${COORDINATOR_URL:-"https://tides-101.mpazbot.workers.dev"}
export NODE_ENV=test

echo "🔗 Testing coordinator: $COORDINATOR_URL"
echo "🔑 API Key: ${TIDES_API_KEY:0:15}..."
echo "🌊 Tides ID: $TIDES_ID"
echo ""

# Quick connectivity test
echo "🔍 Testing coordinator connectivity..."
response=$(curl -s -w "%{http_code}" -o /dev/null "$COORDINATOR_URL")
if [ "$response" != "200" ] && [ "$response" != "400" ]; then
  echo "❌ Coordinator not accessible (HTTP $response)"
  echo "   Check if $COORDINATOR_URL is correct and deployed"
  exit 1
fi
echo "✅ Coordinator is responding"
echo ""

# Test with valid credentials
echo "🧪 Testing authentication..."
auth_response=$(curl -s -X POST "$COORDINATOR_URL" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$TIDES_API_KEY\",\"tides_id\":\"$TIDES_ID\",\"service\":\"insights\"}")

if echo "$auth_response" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Authentication successful"
elif echo "$auth_response" | jq -e '.error' > /dev/null 2>&1; then
  error_msg=$(echo "$auth_response" | jq -r '.error')
  echo "❌ Authentication failed: $error_msg"
  exit 1
else
  echo "❌ Unexpected response format"
  echo "$auth_response"
  exit 1
fi
echo ""

# Run the E2E tests
echo "🚀 Running live E2E tests..."
npx jest \
  --testPathPattern="test/e2e/live-coordinator" \
  --verbose \
  --detectOpenHandles \
  --forceExit \
  --testTimeout=30000 \
  --runInBand

echo ""
echo "✅ Live E2E tests completed!"
echo ""

# Summary of what was validated
echo "📋 Validation Summary"
echo "===================="
echo "✅ Coordinator connectivity and deployment"
echo "✅ Authentication with provided API key"
echo "✅ All 5 service response structures"
echo "✅ Service inference routing logic"  
echo "✅ Error handling for invalid inputs"
echo "✅ Performance and reliability metrics"
echo ""
echo "🎉 Your coordinator is ready for iOS integration!"
echo ""

# Optional: Show sample requests for iOS team
if [ "$1" = "--show-examples" ]; then
  echo "📖 Sample Requests for iOS Team"
  echo "==============================="
  echo ""
  echo "1. Insights Request:"
  echo "POST $COORDINATOR_URL"
  echo '{"api_key":"'$TIDES_API_KEY'","tides_id":"'$TIDES_ID'","service":"insights","timeframe":"30d"}'
  echo ""
  echo "2. Questions Request (with inference):"
  echo "POST $COORDINATOR_URL"  
  echo '{"api_key":"'$TIDES_API_KEY'","tides_id":"'$TIDES_ID'","question":"How productive was I today?"}'
  echo ""
  echo "3. Optimize Request:"
  echo "POST $COORDINATOR_URL"
  echo '{"api_key":"'$TIDES_API_KEY'","tides_id":"'$TIDES_ID'","service":"optimize","preferences":{"work_hours":{"start":"09:00","end":"17:00"}}}'
  echo ""
fi