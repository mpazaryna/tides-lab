#!/bin/bash

# Unit Test Runner for Tides Agent
# Runs all unit tests with coverage reporting

set -e

echo "🧪 Running Unit Tests for Tides Agent..."
echo "========================================"

# Set test environment
export NODE_ENV=test

# Run unit tests with Jest
npx jest \
  --testPathPattern="test/unit" \
  --coverage \
  --coverageDirectory="coverage/unit" \
  --coverageReporters="text" \
  --coverageReporters="html" \
  --coverageReporters="lcov" \
  --verbose \
  --detectOpenHandles \
  --forceExit

echo ""
echo "✅ Unit tests completed!"
echo "📊 Coverage report generated in coverage/unit/"
echo ""

# Check coverage thresholds
echo "🎯 Checking coverage thresholds..."
npx jest \
  --testPathPattern="test/unit" \
  --coverage \
  --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}' \
  --passWithNoTests \
  --silent

if [ $? -eq 0 ]; then
  echo "✅ Coverage thresholds met (90%+)"
else
  echo "❌ Coverage thresholds not met (required: 90%+)"
  exit 1
fi

echo ""
echo "🎉 Unit test suite passed with excellent coverage!"