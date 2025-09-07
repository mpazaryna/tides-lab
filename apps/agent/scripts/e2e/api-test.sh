#!/bin/bash

# Unified API Test Script for Tides Agent
# Usage: ./api-test.sh ENV SERVICE [OPTIONS]
# Examples:
#   ./api-test.sh 102 insights
#   ./api-test.sh 103 optimize --timeframe=30d
#   ./api-test.sh 102 r2-test --path="users/19874fa5-4a50-4dc4-9fea-ab4abf272ce1/tides/tide_1756412347954_wgq624k2ocf.json"

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config/environments.json"

# Usage function
show_usage() {
    echo "🧪 Unified Tides Agent API Test Script"
    echo "====================================="
    echo ""
    echo "Usage: $0 ENV SERVICE [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  101  Production (tides-001-storage)"
    echo "  102  Staging (tides-006-storage)"
    echo "  103  Development (tides-103-storage)"
    echo ""
    echo "Services:"
    echo "  insights      Generate productivity insights"
    echo "  optimize      Get schedule optimization"
    echo "  questions     Ask productivity questions"
    echo "  preferences   Manage user preferences"
    echo "  reports       Generate reports"
    echo "  chat          AI-powered conversation"
    echo "  r2-test       Direct R2 file path testing"
    echo ""
    echo "Common Options:"
    echo "  --timeframe=7d     Set timeframe (insights)"
    echo "  --question=\"...\"   Ask specific question (questions)"
    echo "  --path=\"...\"       R2 file path (r2-test)"
    echo "  --verbose          Show detailed output"
    echo ""
    echo "Examples:"
    echo "  $0 102 insights"
    echo "  $0 103 optimize --timeframe=30d"
    echo "  $0 102 questions --question=\"How productive was I today?\""
    echo "  $0 102 r2-test --path=\"users/.../tide_123.json\""
    exit 1
}

# Check for required arguments
if [ $# -lt 2 ]; then
    show_usage
fi

ENV="$1"
SERVICE="$2"
shift 2

# Parse additional options
VERBOSE=false
TIMEFRAME=""
QUESTION=""
R2_PATH=""

for arg in "$@"; do
    case $arg in
        --verbose)
            VERBOSE=true
            ;;
        --timeframe=*)
            TIMEFRAME="${arg#*=}"
            ;;
        --question=*)
            QUESTION="${arg#*=}"
            ;;
        --path=*)
            R2_PATH="${arg#*=}"
            ;;
        *)
            echo "Unknown option: $arg"
            show_usage
            ;;
    esac
done

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed${NC}"
    exit 1
fi

# Load environment configuration
ENV_CONFIG=$(jq -r ".[\"$ENV\"]" "$CONFIG_FILE")
if [ "$ENV_CONFIG" = "null" ]; then
    echo -e "${RED}❌ Environment $ENV not found in configuration${NC}"
    echo "Available environments: $(jq -r 'keys | join(", ")' "$CONFIG_FILE")"
    exit 1
fi

# Extract environment details
ENDPOINT=$(echo "$ENV_CONFIG" | jq -r '.endpoint')
API_KEY=$(echo "$ENV_CONFIG" | jq -r '.api_key')
TIDES_ID=$(echo "$ENV_CONFIG" | jq -r '.tides_id')
ENV_NAME=$(echo "$ENV_CONFIG" | jq -r '.name')
ENV_DESC=$(echo "$ENV_CONFIG" | jq -r '.description')

# Show test info
echo -e "${BLUE}🧪 Testing Tides Agent API${NC}"
echo "================================"
echo -e "${YELLOW}Environment:${NC} $ENV ($ENV_NAME)"
echo -e "${YELLOW}Description:${NC} $ENV_DESC"
echo -e "${YELLOW}Endpoint:${NC} $ENDPOINT"
echo -e "${YELLOW}Service:${NC} $SERVICE"
echo ""

# Build request payload based on service
build_payload() {
    local base_payload="{\"api_key\": \"$API_KEY\", \"tides_id\": \"$TIDES_ID\""
    
    case "$SERVICE" in
        r2-test)
            if [ -z "$R2_PATH" ]; then
                echo -e "${RED}❌ --path is required for r2-test service${NC}"
                exit 1
            fi
            echo "{\"r2_test_path\": \"$R2_PATH\"}"
            return
            ;;
        insights)
            local payload="$base_payload, \"service\": \"insights\""
            if [ -n "$TIMEFRAME" ]; then
                payload="$payload, \"timeframe\": \"$TIMEFRAME\""
            fi
            echo "$payload}"
            ;;
        optimize)
            local payload="$base_payload, \"service\": \"optimize\""
            if [ -n "$TIMEFRAME" ]; then
                payload="$payload, \"preferences\": {\"focus_time_blocks\": 90}"
            fi
            echo "$payload}"
            ;;
        questions)
            local payload="$base_payload, \"service\": \"questions\""
            if [ -n "$QUESTION" ]; then
                payload="$payload, \"question\": \"$QUESTION\""
            else
                payload="$payload, \"question\": \"How can I improve my productivity?\""
            fi
            echo "$payload}"
            ;;
        preferences)
            echo "$base_payload, \"service\": \"preferences\"}"
            ;;
        reports)
            local payload="$base_payload, \"service\": \"reports\", \"report_type\": \"summary\""
            if [ -n "$TIMEFRAME" ]; then
                payload="$payload, \"period\": \"$TIMEFRAME\""
            fi
            echo "$payload}"
            ;;
        chat)
            local message="How productive was I today?"
            if [ -n "$QUESTION" ]; then
                message="$QUESTION"
            fi
            echo "$base_payload, \"service\": \"chat\", \"message\": \"$message\"}"
            ;;
        *)
            echo -e "${RED}❌ Unknown service: $SERVICE${NC}"
            echo "Available services: insights, optimize, questions, preferences, reports, chat, r2-test"
            exit 1
            ;;
    esac
}

# Build the request payload
PAYLOAD=$(build_payload)

if [ "$VERBOSE" = true ]; then
    echo -e "${YELLOW}Request payload:${NC}"
    echo "$PAYLOAD" | jq .
    echo ""
fi

# Make the API request
echo -e "${GREEN}🚀 Making API request...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$ENDPOINT/coordinator" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON response:${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Pretty print the response
echo "$RESPONSE" | jq .

# Extract and show key metrics
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
PROCESSING_TIME=$(echo "$RESPONSE" | jq -r '.metadata.processing_time_ms // .metadata.service.processing_time_ms // "unknown"')
SERVICE_USED=$(echo "$RESPONSE" | jq -r '.metadata.service // .metadata.service.service // "unknown"')

echo ""
echo -e "${BLUE}📊 Test Results:${NC}"
echo "==============="
echo -e "${YELLOW}Status:${NC} $([ "$SUCCESS" = "true" ] && echo -e "${GREEN}✅ Success${NC}" || echo -e "${RED}❌ Failed${NC}")"
echo -e "${YELLOW}Service:${NC} $SERVICE_USED"
echo -e "${YELLOW}Processing Time:${NC} ${PROCESSING_TIME}ms"
echo ""
echo -e "${GREEN}🏁 Test complete!${NC}"