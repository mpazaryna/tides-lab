#!/bin/bash

# Interactive Chat CLI - Mimics iOS App Experience
# A "poor man's version" of the mobile app for testing the conversation flow

# Colors for better UX
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color
BOLD='\033[1m'

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"
API_KEY="tides_testuser_12345"
TIDE_ID="daily-tide-default"
CONVERSATION_ID=""

# Clear screen and show header
clear
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}                    📱 Tides Chat Interface                      ${NC}"
echo -e "${BOLD}${CYAN}                  (iOS App Experience Demo)                      ${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GRAY}Type 'quit' to exit, 'clear' to clear screen, 'reset' to start over${NC}"
echo -e "${GRAY}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Function to make API call
make_request() {
    local message="$1"
    local conv_id="$2"
    
    if [ -z "$conv_id" ]; then
        RESPONSE=$(curl -s -X POST "$ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{
                \"api_key\": \"$API_KEY\",
                \"tides_id\": \"$TIDE_ID\",
                \"message\": \"$message\"
            }")
    else
        RESPONSE=$(curl -s -X POST "$ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{
                \"api_key\": \"$API_KEY\",
                \"tides_id\": \"$TIDE_ID\",
                \"message\": \"$message\",
                \"conversation_id\": \"$conv_id\"
            }")
    fi
    
    echo "$RESPONSE"
}

# Function to display AI response
display_response() {
    local response="$1"
    
    # Extract fields
    local needs_clarification=$(echo "$response" | jq -r '.data.needs_clarification // false')
    local message=$(echo "$response" | jq -r '.data.message // .data.answer // "No response"')
    local suggestions=$(echo "$response" | jq -r '.data.suggestions[]? // empty' 2>/dev/null)
    local service=$(echo "$response" | jq -r '.metadata.service // "unknown"')
    local confidence=$(echo "$response" | jq -r '.metadata.inference.confidence // 0')
    CONVERSATION_ID=$(echo "$response" | jq -r '.data.conversation_id // empty')
    
    # Display service info in status bar style
    echo -e "${GRAY}[Service: $service | Confidence: $confidence%]${NC}"
    echo ""
    
    # Display main message
    echo -e "${GREEN}🤖 Assistant:${NC}"
    echo -e "$message" | fold -s -w 60
    echo ""
    
    # Display suggestions if available
    if [ -n "$suggestions" ]; then
        echo -e "${YELLOW}Suggested actions:${NC}"
        local i=1
        echo "$suggestions" | while IFS= read -r suggestion; do
            echo -e "  ${CYAN}[$i]${NC} $suggestion"
            ((i++))
        done
        echo ""
        echo -e "${GRAY}Type a number to select a suggestion, or type your own message${NC}"
    fi
    
    # Show data if we got actual service results (not clarification)
    if [ "$needs_clarification" = "false" ]; then
        # Check for insights data
        local productivity_score=$(echo "$response" | jq -r '.data.productivity_score // empty')
        if [ -n "$productivity_score" ]; then
            echo -e "${BOLD}${GREEN}📊 Productivity Insights:${NC}"
            echo -e "  Score: ${BOLD}$productivity_score/100${NC}"
            
            local recommendations=$(echo "$response" | jq -r '.data.recommendations[]? // empty' 2>/dev/null)
            if [ -n "$recommendations" ]; then
                echo -e "  ${YELLOW}Recommendations:${NC}"
                echo "$recommendations" | while IFS= read -r rec; do
                    echo "    • $rec" | fold -s -w 56 | sed '2,$s/^/      /'
                done
            fi
        fi
        
        # Check for optimization data
        local time_blocks=$(echo "$response" | jq -r '.data.suggested_schedule.time_blocks[]? // empty' 2>/dev/null)
        if [ -n "$time_blocks" ]; then
            echo -e "${BOLD}${GREEN}📅 Optimized Schedule:${NC}"
            echo "$response" | jq -r '.data.suggested_schedule.time_blocks[] | "  \(.start)-\(.end): \(.activity)"' 2>/dev/null
        fi
        
        # Check for preferences data
        local work_hours=$(echo "$response" | jq -r '.data.work_hours // empty' 2>/dev/null)
        if [ -n "$work_hours" ] && [ "$work_hours" != "null" ]; then
            echo -e "${BOLD}${GREEN}⚙️ Current Preferences:${NC}"
            echo "$response" | jq -r '"  Work Hours: \(.data.work_hours.start) - \(.data.work_hours.end)"' 2>/dev/null
            echo "$response" | jq -r '"  Break Duration: \(.data.break_duration) minutes"' 2>/dev/null
            echo "$response" | jq -r '"  Focus Blocks: \(.data.focus_time_blocks) minutes"' 2>/dev/null
        fi
    fi
    
    echo -e "${GRAY}────────────────────────────────────────────────────────────────${NC}"
}

# Function to handle suggestion selection
handle_suggestion() {
    local num="$1"
    case $num in
        1) echo "View productivity insights";;
        2) echo "Optimize your schedule";;
        3) echo "Get productivity tips";;
        *) echo "";;
    esac
}

# Main chat loop
while true; do
    echo -e "${BLUE}You:${NC} \c"
    read -r user_input
    
    # Handle special commands
    case "$user_input" in
        quit|exit|q)
            echo -e "${CYAN}Goodbye! 👋${NC}"
            exit 0
            ;;
        clear|cls)
            clear
            echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${BOLD}${CYAN}                    📱 Tides Chat Interface                      ${NC}"
            echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
            continue
            ;;
        reset)
            CONVERSATION_ID=""
            echo -e "${YELLOW}Conversation reset. Starting fresh...${NC}"
            echo ""
            continue
            ;;
        [1-3])
            # Handle suggestion selection
            user_input=$(handle_suggestion "$user_input")
            if [ -z "$user_input" ]; then
                continue
            fi
            echo -e "${GRAY}(Selected suggestion: $user_input)${NC}"
            ;;
    esac
    
    # Make API request
    echo -e "${GRAY}Thinking...${NC}"
    response=$(make_request "$user_input" "$CONVERSATION_ID")
    
    # Clear the "Thinking..." line
    echo -e "\033[1A\033[K"
    
    # Display response
    display_response "$response"
done