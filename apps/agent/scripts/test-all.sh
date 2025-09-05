#!/bin/bash

# Complete Test Suite Runner for Tides Agent
# Runs unit, integration, and E2E tests in sequence

set -e

echo "🧪 Running Complete Test Suite for Tides Agent"
echo "=============================================="
echo ""

# Track start time
start_time=$(date +%s)

# Run unit tests
echo "📝 Step 1: Unit Tests"
echo "--------------------"
./scripts/test-unit.sh
echo ""

# Run integration tests
echo "🔧 Step 2: Integration Tests"
echo "---------------------------"
./scripts/test-integration.sh
echo ""

# Check if E2E variables are available
if [ -n "$TIDES_API_KEY" ] && [ -n "$TIDES_ID" ]; then
  echo "🌐 Step 3: End-to-End Tests"
  echo "-------------------------"
  ./scripts/test-e2e.sh
else
  echo "⚠️  Step 3: End-to-End Tests (SKIPPED)"
  echo "------------------------------------"
  echo "E2E tests skipped - requires TIDES_API_KEY and TIDES_ID environment variables"
  echo "To run E2E tests, set these variables and run: ./scripts/test-e2e.sh"
fi

echo ""

# Calculate total time
end_time=$(date +%s)
total_time=$((end_time - start_time))
minutes=$((total_time / 60))
seconds=$((total_time % 60))

echo "🎉 Complete Test Suite Results"
echo "============================="
echo "✅ Unit Tests: PASSED"
echo "✅ Integration Tests: PASSED"
if [ -n "$TIDES_API_KEY" ] && [ -n "$TIDES_ID" ]; then
  echo "✅ E2E Tests: PASSED"
else
  echo "⚠️  E2E Tests: SKIPPED (no credentials)"
fi
echo ""
echo "⏱️  Total runtime: ${minutes}m ${seconds}s"
echo ""
echo "🚀 Ready for deployment!"