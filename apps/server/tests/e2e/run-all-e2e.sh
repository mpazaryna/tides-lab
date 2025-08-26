#!/bin/bash

# Run all E2E tests for Tides Agents
# Usage: ./run-all-e2e.sh [environment]

ENV=${1:-development}

echo "🧪 Running All E2E Tests for Tides Agents"
echo "Environment: $ENV"
echo "=========================================="

# Run REST API tests
echo ""
echo "📡 Running REST API Tests..."
./tests/e2e/agent-e2e.test.sh $ENV
REST_EXIT=$?

echo ""
echo "🔌 Running WebSocket Tests..."
node tests/e2e/websocket-test.js $ENV
WS_EXIT=$?

echo ""
echo "=========================================="
echo "🏁 E2E Test Summary"
echo "=========================================="

if [ $REST_EXIT -eq 0 ]; then
  echo -e "REST API Tests:  \033[0;32m✅ PASSED\033[0m"
else
  echo -e "REST API Tests:  \033[0;31m❌ FAILED\033[0m"
fi

if [ $WS_EXIT -eq 0 ]; then
  echo -e "WebSocket Tests: \033[0;32m✅ PASSED\033[0m"
else
  echo -e "WebSocket Tests: \033[0;31m❌ FAILED\033[0m"
fi

if [ $REST_EXIT -eq 0 ] && [ $WS_EXIT -eq 0 ]; then
  echo ""
  echo -e "\033[0;32m🎉 All E2E tests passed! Agent is fully functional on Cloudflare.\033[0m"
  exit 0
else
  echo ""
  echo -e "\033[0;31m💥 Some E2E tests failed.\033[0m"
  exit 1
fi