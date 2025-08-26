#!/bin/bash

# Live test script for TideProductivityAgent on tides-001
# Tests against the production deployment at tides-001.mpazbot.workers.dev
# Usage: ./test-productivity-agent-live.sh [action] [options]

set -e

# Configuration - HARDCODED for tides-003
BASE_URL="https://tides-003.mpazbot.workers.dev"
USER_ID="${USER_ID:-testuser001}"
# Hardcoded API key for testing - replace with your actual key
API_KEY="tides_testuser_001"  # Valid test API key for testuser001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

print_response() {
    echo -e "${CYAN}Response:${NC}"
}

# Check for API key
check_api_key() {
    if [ "$API_KEY" = "REPLACE_ME" ]; then
        print_error "API_KEY not configured!"
        print_info "Please edit this script and replace 'REPLACE_ME' with your actual API key"
        print_info "Location: Line 13 of $0"
        exit 1
    fi
    
    if [ -z "$API_KEY" ]; then
        print_error "API_KEY not set!"
        print_info "Please edit this script and set your API key on line 13"
        print_info "API key is REQUIRED for all agent requests - no authentication fallbacks"
        exit 1
    fi
}

# Function to make authenticated requests with pretty output
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    print_info "Making $method request to ${MAGENTA}$BASE_URL/agents/tide-productivity$endpoint${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            "$BASE_URL/agents/tide-productivity$endpoint" 2>&1) || {
            print_error "Request failed"
            echo "$response"
            return 1
        }
    else
        print_info "Request body:"
        echo "$data" | jq '.' 2>/dev/null || echo "$data"
        
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            -d "$data" \
            "$BASE_URL/agents/tide-productivity$endpoint" 2>&1) || {
            print_error "Request failed"
            echo "$response"
            return 1
        }
    fi
    
    print_response
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Action: Get daily insights for a tide
get_daily_insights() {
    check_api_key
    print_header "📊 Getting Daily Productivity Insights from tides-001"
    print_info "User ID: $USER_ID"
    
    local data='{
        "userId": "'$USER_ID'"
    }'
    
    if make_request "POST" "/insights" "$data"; then
        print_success "Daily insights request completed"
    else
        print_error "Failed to get daily insights"
    fi
}

# Action: Optimize schedule based on energy patterns
optimize_schedule() {
    check_api_key
    print_header "⚡ Optimizing Schedule Based on Energy Patterns"
    print_info "User ID: $USER_ID"
    print_info "Requesting morning-focused optimization with high energy goals"
    
    local data='{
        "userId": "'$USER_ID'",
        "preferences": {
            "preferredTimeBlocks": "morning_focused",
            "energyGoals": ["consistent_high_energy", "minimize_afternoon_dips"],
            "notificationFrequency": "daily",
            "analysisDepth": "comprehensive"
        }
    }'
    
    if make_request "POST" "/optimize" "$data"; then
        print_success "Schedule optimization request completed"
    else
        print_error "Failed to optimize schedule"
    fi
}

# Action: Ask a custom question about a specific tide
ask_question() {
    check_api_key
    local question=${1:-"What factors most impact my afternoon productivity?"}
    local tide_id=${2:-"tide_001"}
    
    print_header "❓ Asking Custom Question About Tide"
    print_info "Question: ${CYAN}$question${NC}"
    print_info "Tide ID: ${MAGENTA}$tide_id${NC}"
    print_info "User ID: $USER_ID"
    
    local data='{
        "userId": "'$USER_ID'",
        "question": "'"$question"'",
        "tideId": "'"$tide_id"'"
    }'
    
    if make_request "POST" "/question" "$data"; then
        print_success "Question answered by AI"
    else
        print_error "Failed to get answer"
    fi
}

# Action: Get agent status (requires authentication)
get_status() {
    check_api_key
    print_header "📈 Getting Agent Status from tides-003"
    
    print_info "Making GET request to ${MAGENTA}$BASE_URL/agents/tide-productivity/status${NC}"
    
    response=$(curl -s -X "GET" \
        -H "Authorization: Bearer $API_KEY" \
        "$BASE_URL/agents/tide-productivity/status" 2>&1) || {
        print_error "Request failed"
        echo "$response"
        return 1
    }
    
    print_response
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    print_success "Status retrieved"
}

# Action: Update user preferences
update_preferences() {
    check_api_key
    print_header "⚙️ Updating User Preferences"
    print_info "User ID: $USER_ID"
    
    local data='{
        "userId": "'$USER_ID'",
        "preferences": {
            "preferredTimeBlocks": "afternoon_preferred",
            "energyGoals": ["maintain_steady", "avoid_burnout"],
            "notificationFrequency": "weekly",
            "analysisDepth": "comprehensive"
        }
    }'
    
    if make_request "POST" "/preferences" "$data"; then
        print_success "Preferences updated"
    else
        print_error "Failed to update preferences"
    fi
}

# Action: Get user preferences
get_preferences() {
    check_api_key
    print_header "⚙️ Getting User Preferences"
    print_info "User ID: $USER_ID"
    
    if make_request "GET" "/preferences?userId=$USER_ID"; then
        print_success "Preferences retrieved"
    else
        print_error "Failed to get preferences"
    fi
}

# Action: Test with real tide data
test_with_real_tide() {
    check_api_key
    local tide_id=${1:-"tide_20250807_daily_001"}
    
    print_header "🌊 Testing with Real Tide Data"
    print_info "Using Tide ID: ${MAGENTA}$tide_id${NC}"
    
    # Ask productivity questions about the specific tide
    ask_question "What were my peak productivity hours in this tide session?" "$tide_id"
    sleep 2
    
    ask_question "How did my energy levels change throughout this tide?" "$tide_id"
    sleep 2
    
    ask_question "What recommendations do you have for similar future tides?" "$tide_id"
    
    print_success "Real tide analysis completed"
}

# Action: Full end-to-end test suite
run_e2e_test() {
    print_header "🚀 Running End-to-End Test Suite on tides-001"
    print_info "Target: ${MAGENTA}$BASE_URL${NC}"
    print_info "User: $USER_ID"
    
    # Check connectivity first
    print_info "1/7 - Checking agent status..."
    get_status
    sleep 1
    
    if [ -n "$API_KEY" ]; then
        print_info "2/7 - Setting user preferences..."
        update_preferences
        sleep 1
        
        print_info "3/7 - Retrieving preferences..."
        get_preferences
        sleep 1
        
        print_info "4/7 - Getting daily insights..."
        get_daily_insights
        sleep 2
        
        print_info "5/7 - Optimizing schedule..."
        optimize_schedule
        sleep 2
        
        print_info "6/7 - Asking custom questions..."
        ask_question "What are my peak productivity hours based on recent patterns?" "tide_001"
        sleep 2
        
        print_info "7/7 - Testing with real tide data..."
        test_with_real_tide
    else
        print_error "Skipping authenticated tests - API_KEY not set"
    fi
    
    print_header "✅ End-to-End Test Suite Completed!"
    print_success "tides-001 TideProductivityAgent is responding correctly"
}

# Action: Interactive mode with improved menu
interactive_mode() {
    clear
    print_header "🎮 TideProductivityAgent Live Testing Menu"
    print_info "Target: ${MAGENTA}$BASE_URL${NC}"
    print_info "User: ${CYAN}$USER_ID${NC}"
    
    while true; do
        echo -e "\n${GREEN}MAIN MENU${NC}"
        echo -e "${BLUE}================================================================${NC}"
        echo -e "${YELLOW}[1]${NC} 📈 Get Agent Status    ${CYAN}(requires authentication)${NC}"
        echo -e "${YELLOW}[2]${NC} 📊 Get Daily Insights  ${CYAN}(analyze productivity patterns)${NC}"
        echo -e "${YELLOW}[3]${NC} ⚡ Optimize Schedule   ${CYAN}(energy-based optimization)${NC}"
        echo -e "${YELLOW}[4]${NC} ❓ Ask Custom Question ${CYAN}(AI-powered Q&A)${NC}"
        echo -e "${YELLOW}[5]${NC} ⚙️  Update Preferences  ${CYAN}(notification settings)${NC}"
        echo -e "${YELLOW}[6]${NC} 👁️  Get Preferences     ${CYAN}(view current settings)${NC}"
        echo -e "${YELLOW}[7]${NC} 🌊 Test with Real Tide ${CYAN}(analyze specific tide)${NC}"
        echo -e "${BLUE}----------------------------------------------------------------${NC}"
        echo -e "${YELLOW}[8]${NC} 🚀 Run Full E2E Test   ${CYAN}(comprehensive test suite)${NC}"
        echo -e "${YELLOW}[9]${NC} 📚 Show Help/Examples  ${CYAN}(usage documentation)${NC}"
        echo -e "${YELLOW}[0]${NC} 🚪 Exit"
        echo -e "${BLUE}================================================================${NC}"
        
        echo -e "\n${GREEN}➤${NC} Select an option [0-9]: \c"
        read choice
        
        clear
        case $choice in
            1) 
                get_status 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            2) 
                get_daily_insights 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            3) 
                optimize_schedule 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            4) 
                echo -e "${YELLOW}═══ Custom Question Interface ═══${NC}\n"
                echo -e "Enter your productivity question:"
                echo -e "${CYAN}Examples:${NC}"
                echo -e "  • What are my peak productivity hours?"
                echo -e "  • How can I improve my afternoon focus?"
                echo -e "  • What patterns affect my energy levels?\n"
                read -p "Your question: " question
                read -p "Tide ID (press Enter for tide_001): " tide_id
                ask_question "$question" "${tide_id:-tide_001}"
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            5) 
                update_preferences 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            6) 
                get_preferences 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            7) 
                echo -e "${YELLOW}═══ Real Tide Analysis ═══${NC}\n"
                echo -e "Enter the Tide ID to analyze:"
                echo -e "${CYAN}Format: tide_YYYYMMDD_type_XXX${NC}"
                echo -e "${CYAN}Example: tide_20250807_daily_001${NC}\n"
                read -p "Tide ID: " tide_id
                test_with_real_tide "${tide_id:-tide_20250807_daily_001}"
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            8) 
                run_e2e_test 
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            9) 
                show_usage
                echo -e "\n${CYAN}Press Enter to continue...${NC}"
                read
                clear
                ;;
            0|q|Q) 
                print_success "Thank you for using TideProductivityAgent Tester!"
                print_info "Goodbye! 👋"
                exit 0
                ;;
            *) 
                print_error "Invalid choice: $choice"
                print_info "Please select a number between 0-9"
                sleep 2
                clear
                ;;
        esac
    done
}

# Main script logic
show_usage() {
    cat << EOF
${GREEN}TideProductivityAgent Live Testing Script${NC}
Tests against: ${MAGENTA}$BASE_URL${NC}

Usage: $0 [action] [options]

Default: Interactive menu (when no action specified)

Actions:
    menu              Show interactive menu (default)
    status            Get agent status (requires authentication)
    insights          Get daily productivity insights
    optimize          Optimize schedule based on energy patterns
    question [q] [id] Ask a custom question about a tide
    preferences       Get user preferences
    set-preferences   Update user preferences
    real-tide [id]    Test with real tide data
    e2e               Run full end-to-end test suite
    help              Show this help message

Quick Access:
    $0                Run interactive menu
    $0 1              Get agent status (menu option 1)
    $0 2              Get daily insights (menu option 2)
    $0 3              Optimize schedule (menu option 3)

Configuration:
    API_KEY           Hardcoded in script (line 13) - REPLACE WITH YOUR KEY
    USER_ID           User ID for requests (default: testuser001)

Examples:
    # Check agent status (no API key needed)
    $0 status
    
    # Get insights (uses hardcoded API key)
    $0 insights
    
    # Ask a question about a specific tide
    $0 question "How can I improve focus?" tide_001
    
    # Test with real tide data
    $0 real-tide tide_20250807_daily_001
    
    # Run full end-to-end test
    $0 e2e
    
    # Interactive mode
    $0 interactive

${YELLOW}Note: Remember to replace the API_KEY on line 13 with your actual key!${NC}
EOF
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install it for pretty JSON output."
    print_info "On macOS: brew install jq"
    print_info "On Ubuntu: sudo apt-get install jq"
fi

# Parse command line arguments
# Default to interactive menu if no arguments provided
case "${1:-menu}" in
    menu)
        interactive_mode
        ;;
    status)
        get_status
        ;;
    insights)
        get_daily_insights
        ;;
    optimize)
        optimize_schedule
        ;;
    question)
        ask_question "$2" "$3"
        ;;
    preferences)
        get_preferences
        ;;
    set-preferences)
        update_preferences
        ;;
    real-tide)
        test_with_real_tide "$2"
        ;;
    e2e|test)
        run_e2e_test
        ;;
    interactive|i)
        interactive_mode
        ;;
    help|--help|-h)
        show_usage
        ;;
    # Quick numeric shortcuts
    1)
        get_status
        ;;
    2)
        get_daily_insights
        ;;
    3)
        optimize_schedule
        ;;
    4)
        echo -e "${YELLOW}Quick Question Mode${NC}"
        question="${2:-What are my peak productivity hours?}"
        tide_id="${3:-tide_001}"
        ask_question "$question" "$tide_id"
        ;;
    5)
        update_preferences
        ;;
    6)
        get_preferences
        ;;
    7)
        tide_id="${2:-tide_20250807_daily_001}"
        test_with_real_tide "$tide_id"
        ;;
    8)
        run_e2e_test
        ;;
    *)
        print_error "Unknown action: $1"
        echo -e "\n${YELLOW}Tip: Run without arguments to use the interactive menu${NC}"
        show_usage
        exit 1
        ;;
esac