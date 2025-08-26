#!/bin/bash

# End-to-End Test Script for HelloAgent on Cloudflare Workers
# Usage: ./agent-e2e.test.sh [production|staging|development]

ENV=${1:-development}
case $ENV in
  production)
    BASE_URL="https://tides-003.mpazbot.workers.dev"
    ;;
  staging)
    BASE_URL="https://tides-002.mpazbot.workers.dev"
    ;;
  development|*)
    BASE_URL="https://tides-001.mpazbot.workers.dev"
    ;;
esac

echo "🧪 Running E2E tests against: $BASE_URL"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local data="$4"
  local expected="$5"
  
  echo -n "Testing: $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s "$BASE_URL$path")
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "$BASE_URL$path" -H "Content-Type: application/json" -d "$data")
  fi
  
  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Expected to contain: $expected"
    echo "  Got: $response"
    ((TESTS_FAILED++))
    return 1
  fi
}

# Test status code
test_status() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"
  
  echo -n "Testing: $name... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path")
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Expected status: $expected_status"
    echo "  Got status: $status"
    ((TESTS_FAILED++))
    return 1
  fi
}

echo ""
echo "1. Basic Agent Connectivity"
echo "----------------------------"
test_endpoint "GET /agents/hello/hello" "GET" "/agents/hello/hello" "" "Hello from HelloAgent!"
test_endpoint "GET /agents/hello/hello (has agentId)" "GET" "/agents/hello/hello" "" "agentId"

echo ""
echo "2. POST Endpoints"
echo "-----------------"
test_endpoint "POST /agents/hello/hello with name" "POST" "/agents/hello/hello" '{"name":"E2E Test"}' "Hello, E2E Test!"

echo ""
echo "3. State Management"
echo "-------------------"
# Get initial visit count
VISIT1=$(curl -s "$BASE_URL/agents/hello/visits" | grep -o '"visits":[0-9]*' | cut -d: -f2)
echo "Initial visit count: $VISIT1"

# Increment visit
VISIT2=$(curl -s "$BASE_URL/agents/hello/visits" | grep -o '"visits":[0-9]*' | cut -d: -f2)
echo "After increment: $VISIT2"

if [ "$VISIT2" -gt "$VISIT1" ]; then
  echo -e "${GREEN}✓ Visit counter increments correctly${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Visit counter not incrementing${NC}"
  ((TESTS_FAILED++))
fi

echo ""
echo "4. Message Storage"
echo "------------------"
# Store a message
curl -s -X POST "$BASE_URL/agents/hello/message" \
  -H "Content-Type: application/json" \
  -d '{"message":"E2E test message"}' > /dev/null

test_endpoint "Message storage" "POST" "/agents/hello/message" '{"message":"Test message"}' "success"

# Retrieve messages
test_endpoint "Message retrieval" "GET" "/agents/hello/messages" "" "messages"

echo ""
echo "5. Error Handling"
echo "-----------------"
test_status "Invalid agent path" "GET" "/agents/" "400"
test_status "Unknown agent" "GET" "/agents/unknown/test" "404"
test_status "404 on unknown route" "GET" "/agents/hello/nonexistent" "404"

echo ""
echo "6. Stats Endpoint"
echo "-----------------"
test_endpoint "GET /agents/hello/stats" "GET" "/agents/hello/stats" "" "visits"
test_endpoint "Stats has messageCount" "GET" "/agents/hello/stats" "" "messageCount"
test_endpoint "Stats has agentId" "GET" "/agents/hello/stats" "" "agentId"

echo ""
echo "7. Reset Functionality"
echo "----------------------"
# Reset the agent
curl -s -X POST "$BASE_URL/agents/hello/reset" > /dev/null
test_endpoint "Reset confirmation" "POST" "/agents/hello/reset" "" "Agent state reset"

# Verify reset worked
VISIT_AFTER_RESET=$(curl -s "$BASE_URL/agents/hello/visits" | grep -o '"visits":[0-9]*' | cut -d: -f2)
if [ "$VISIT_AFTER_RESET" = "1" ]; then
  echo -e "${GREEN}✓ Reset cleared visit counter${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Reset did not clear visit counter (got $VISIT_AFTER_RESET)${NC}"
  ((TESTS_FAILED++))
fi

echo ""
echo "================================================"
echo "Test Results Summary"
echo "================================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi