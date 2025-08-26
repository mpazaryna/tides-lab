#!/bin/bash

# Test script for TideProductivityAgent
# Usage: ./test-productivity-agent.sh [action] [options]

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8787}"
USER_ID="${USER_ID:-testuser001}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_error() {
    echo -e "${RED}✗ Error: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to make requests with pretty output
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    print_info "Making $method request to $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "x-user-id: $USER_ID" \
            "$BASE_URL/agents/tide-productivity$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "x-user-id: $USER_ID" \
            -d "$data" \
            "$BASE_URL/agents/tide-productivity$endpoint")
    fi
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Action: Get daily insights for a tide
get_daily_insights() {
    print_header "📊 Getting Daily Productivity Insights"
    
    local data='{
        "userId": "'$USER_ID'"
    }'
    
    make_request "POST" "/insights" "$data"
    print_success "Daily insights request completed"
}

# Action: Optimize schedule based on energy patterns
optimize_schedule() {
    print_header "⚡ Optimizing Schedule Based on Energy Patterns"
    
    local data='{
        "userId": "'$USER_ID'",
        "preferences": {
            "preferredTimeBlocks": "morning_focused",
            "energyGoals": ["consistent_high_energy", "minimize_afternoon_dips"],
            "notificationFrequency": "daily"
        }
    }'
    
    make_request "POST" "/optimize" "$data"
    print_success "Schedule optimization request completed"
}

# Action: Ask a custom question
ask_question() {
    local question=${1:-"What factors most impact my afternoon productivity?"}
    local tide_id=${2:-"tide_001"}
    
    print_header "❓ Asking Custom Question"
    print_info "Question: $question"
    print_info "Tide ID: $tide_id"
    
    local data='{
        "userId": "'$USER_ID'",
        "question": "'"$question"'",
        "tideId": "'"$tide_id"'"
    }'
    
    make_request "POST" "/question" "$data"
    print_success "Question answered"
}

# Action: Get agent status
get_status() {
    print_header "📈 Getting Agent Status"
    
    make_request "GET" "/status"
    print_success "Status retrieved"
}

# Action: Update user preferences
update_preferences() {
    print_header "⚙️ Updating User Preferences"
    
    local data='{
        "userId": "'$USER_ID'",
        "preferences": {
            "preferredTimeBlocks": "afternoon_preferred",
            "energyGoals": ["maintain_steady", "avoid_burnout"],
            "notificationFrequency": "weekly",
            "analysisDepth": "comprehensive"
        }
    }'
    
    make_request "POST" "/preferences" "$data"
    print_success "Preferences updated"
}

# Action: Get user preferences
get_preferences() {
    print_header "⚙️ Getting User Preferences"
    
    make_request "GET" "/preferences?userId=$USER_ID"
    print_success "Preferences retrieved"
}

# Action: Test WebSocket connection
test_websocket() {
    print_header "🔌 Testing WebSocket Connection"
    
    if ! command -v wscat &> /dev/null; then
        print_error "wscat not found. Install with: npm install -g wscat"
        exit 1
    fi
    
    print_info "Connecting to WebSocket..."
    
    # Create a temporary file for WebSocket commands
    cat > /tmp/ws_commands.txt << EOF
{"type": "authenticate", "userId": "$USER_ID"}
{"type": "ping"}
{"type": "request_insights", "userId": "$USER_ID"}
{"type": "ask_question", "userId": "$USER_ID", "question": "How can I improve focus?", "tideId": "tide_001"}
EOF
    
    print_info "Sending test commands to WebSocket..."
    
    # Connect to WebSocket and send commands
    timeout 5 wscat -c "ws://localhost:8787/agents/tide-productivity/ws" < /tmp/ws_commands.txt || true
    
    rm /tmp/ws_commands.txt
    print_success "WebSocket test completed"
}

# Action: Full test suite
run_full_test() {
    print_header "🚀 Running Full TideProductivityAgent Test Suite"
    
    get_status
    sleep 1
    
    update_preferences
    sleep 1
    
    get_preferences
    sleep 1
    
    get_daily_insights
    sleep 1
    
    optimize_schedule
    sleep 1
    
    ask_question "What are my peak productivity hours?" "tide_001"
    sleep 1
    
    print_header "✅ Full Test Suite Completed Successfully!"
}

# Action: Interactive mode
interactive_mode() {
    print_header "🎮 Interactive Mode - TideProductivityAgent Tester"
    
    while true; do
        echo -e "\n${BLUE}Available Actions:${NC}"
        echo "1) Get Daily Insights"
        echo "2) Optimize Schedule"
        echo "3) Ask Custom Question"
        echo "4) Get Agent Status"
        echo "5) Update Preferences"
        echo "6) Get Preferences"
        echo "7) Test WebSocket"
        echo "8) Run Full Test Suite"
        echo "9) Exit"
        
        read -p "Select action (1-9): " choice
        
        case $choice in
            1) get_daily_insights ;;
            2) optimize_schedule ;;
            3) 
                read -p "Enter your question: " question
                read -p "Enter tide ID (default: tide_001): " tide_id
                ask_question "$question" "${tide_id:-tide_001}"
                ;;
            4) get_status ;;
            5) update_preferences ;;
            6) get_preferences ;;
            7) test_websocket ;;
            8) run_full_test ;;
            9) 
                print_success "Goodbye!"
                exit 0
                ;;
            *) print_error "Invalid choice" ;;
        esac
    done
}

# Main script logic
show_usage() {
    cat << EOF
Usage: $0 [action] [options]

Actions:
    insights           Get daily productivity insights
    optimize          Optimize schedule based on energy patterns
    question [q] [id] Ask a custom question about a tide
    status            Get agent status
    preferences       Get user preferences
    set-preferences   Update user preferences
    websocket         Test WebSocket connection
    test              Run full test suite
    interactive       Interactive mode
    help              Show this help message

Environment Variables:
    BASE_URL          API base URL (default: http://localhost:8787)
    USER_ID           User ID for requests (default: testuser001)

Examples:
    $0 insights
    $0 question "How can I improve focus?" tide_001
    $0 optimize
    USER_ID=john $0 insights
    BASE_URL=https://tides.example.com $0 test

EOF
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install it for pretty JSON output."
    print_info "On macOS: brew install jq"
    print_info "On Ubuntu: sudo apt-get install jq"
fi

# Parse command line arguments
case "${1:-help}" in
    insights)
        get_daily_insights
        ;;
    optimize)
        optimize_schedule
        ;;
    question)
        ask_question "$2" "$3"
        ;;
    status)
        get_status
        ;;
    preferences)
        get_preferences
        ;;
    set-preferences)
        update_preferences
        ;;
    websocket|ws)
        test_websocket
        ;;
    test)
        run_full_test
        ;;
    interactive|i)
        interactive_mode
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown action: $1"
        show_usage
        exit 1
        ;;
esac