#!/bin/bash

# Integration Test Runner for Tides Agent
# Runs integration tests that test service interactions

set -e

echo "🔧 Running Integration Tests for Tides Agent..."
echo "=============================================="

# Set test environment
export NODE_ENV=test

# Run integration tests
npx jest \
  --testPathPattern="test/integration" \
  --verbose \
  --detectOpenHandles \
  --forceExit \
  --testTimeout=10000

echo ""
echo "✅ Integration tests completed!"
echo ""

# Optional: Run integration tests with coverage
if [ "$1" = "--coverage" ]; then
  echo "📊 Running integration tests with coverage..."
  npx jest \
    --testPathPattern="test/integration" \
    --coverage \
    --coverageDirectory="coverage/integration" \
    --coverageReporters="text" \
    --coverageReporters="html" \
    --verbose \
    --detectOpenHandles \
    --forceExit \
    --testTimeout=10000
    
  echo "📊 Integration coverage report generated in coverage/integration/"
fi

echo "🎉 Integration test suite passed!"