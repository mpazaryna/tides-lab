#!/bin/bash

# End-to-End Test Runner for Tides Agent
# Runs E2E tests against real deployed coordinator

set -e

echo "🌐 Running End-to-End Tests for Tides Agent..."
echo "============================================="

# Check required environment variables
if [ -z "$TIDES_API_KEY" ] || [ -z "$TIDES_ID" ]; then
  echo "❌ Required environment variables not set!"
  echo ""
  echo "Please set the following environment variables:"
  echo "  TIDES_API_KEY - Valid API key for testing"
  echo "  TIDES_ID - Valid Tides ID for testing"
  echo "  COORDINATOR_URL (optional) - Coordinator endpoint URL"
  echo ""
  echo "Example:"
  echo "  export TIDES_API_KEY='tides_testuser_123456789'"
  echo "  export TIDES_ID='test-tide-123'"
  echo "  export COORDINATOR_URL='https://tides-101.mpazbot.workers.dev'"
  echo ""
  exit 1
fi

# Set defaults
export COORDINATOR_URL=${COORDINATOR_URL:-"https://tides-101.mpazbot.workers.dev"}
export NODE_ENV=test

echo "🔗 Testing against: $COORDINATOR_URL"
echo "🔑 Using API key: ${TIDES_API_KEY:0:15}..."
echo "🌊 Using Tides ID: $TIDES_ID"
echo ""

# Verify coordinator is accessible
echo "🏥 Checking coordinator health..."
if curl -f -s "$COORDINATOR_URL/health" > /dev/null; then
  echo "✅ Coordinator is healthy"
else
  echo "❌ Coordinator is not accessible at $COORDINATOR_URL"
  echo "Please check the URL and try again."
  exit 1
fi

echo ""

# Run E2E tests
echo "🚀 Running E2E tests..."
npx jest \
  --testPathPattern="test/e2e" \
  --verbose \
  --detectOpenHandles \
  --forceExit \
  --testTimeout=30000 \
  --runInBand

echo ""
echo "✅ End-to-end tests completed!"
echo "🎉 All tests passed against live coordinator!"