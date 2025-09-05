#!/bin/bash

# Interactive Chat Demo - iOS App Experience with Real Tide Data
# Shows how the chat agent uses the actual tide JSON data for personalized responses

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

ENDPOINT="https://tides-agent-103.mpazbot.workers.dev/coordinator"
CONVERSATION_ID=""

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}${CYAN}         📱 Tides Chat - iOS Experience Demo${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${MAGENTA}🔗 Connected to Tide: \"Daily Deep Work Sessions\"${NC}"
echo -e "${GRAY}   • 10 flow sessions (OAuth, API development)${NC}"
echo -e "${GRAY}   • Peak productivity: 9:00 AM & 1:00 PM${NC}"
echo -e "${GRAY}   • Average energy: 7.4/10${NC}"
echo "────────────────────────────────────────────────────────"
echo ""
echo -e "${GRAY}Commands: 'quit' to exit, 'new' for new conversation${NC}"
echo -e "${GRAY}Try: 'How productive was I?', 'When should I work?', 'What did I work on?'${NC}"
echo "────────────────────────────────────────────────────────"
echo ""

send_message() {
    local msg="$1"
    local data="{\"api_key\": \"tides_testuser_12345\", \"tides_id\": \"daily-tide-default\", \"message\": \"$msg\""
    
    if [ -n "$CONVERSATION_ID" ]; then
        data="$data, \"conversation_id\": \"$CONVERSATION_ID\""
    fi
    data="$data}"
    
    curl -s -X POST "$ENDPOINT" -H "Content-Type: application/json" -d "$data"
}

show_response() {
    local resp="$1"
    
    # Parse response
    local msg=$(echo "$resp" | jq -r '.data.message // .data.answer // "No message"')
    local needs_clarification=$(echo "$resp" | jq -r '.data.needs_clarification // false')
    local suggestions=$(echo "$resp" | jq -r '.data.suggestions[]? // empty' 2>/dev/null)
    local service=$(echo "$resp" | jq -r '.metadata.service // "unknown"')
    local confidence=$(echo "$resp" | jq -r '.metadata.inference.confidence // 0')
    
    # Update conversation ID
    local new_conv_id=$(echo "$resp" | jq -r '.data.conversation_id // empty')
    if [ "$new_conv_id" != "empty" ] && [ "$new_conv_id" != "null" ]; then
        CONVERSATION_ID="$new_conv_id"
    fi
    
    # Show service routing info
    echo -e "${GRAY}[Routed to: $service | Confidence: $confidence%]${NC}"
    
    # Show response (only if we have a meaningful message)
    echo -e "${GREEN}🤖 Tides Assistant:${NC}"
    if [ "$msg" != "No message" ] && [ "$msg" != "null" ] && [ -n "$msg" ]; then
        echo "$msg" | fold -s -w 55
    fi
    
    # Show suggestions if present
    if [ -n "$suggestions" ]; then
        echo ""
        echo -e "${YELLOW}Quick actions:${NC}"
        local i=1
        echo "$suggestions" | while read -r s; do
            echo -e "  ${CYAN}$i)${NC} $s"
            ((i++))
        done
        echo -e "${GRAY}(Type a number to select)${NC}"
    fi
    
    # Show actual tide data if we got service results (not clarification)
    if [ "$needs_clarification" = "false" ]; then
        # Check for insights data
        local score=$(echo "$resp" | jq -r '.data.productivity_score // empty')
        if [ -n "$score" ] && [ "$score" != "empty" ]; then
            echo ""
            echo -e "${BOLD}${MAGENTA}📊 From Your Tide Data:${NC}"
            echo -e "  Productivity Score: ${BOLD}$score/100${NC}"
            
            # Show recommendations that reference specific times
            local recs=$(echo "$resp" | jq -r '.data.recommendations[]? // empty' 2>/dev/null | head -2)
            if [ -n "$recs" ]; then
                echo -e "  ${YELLOW}Insights:${NC}"
                echo "$recs" | while IFS= read -r rec; do
                    # Highlight time references
                    rec_formatted=$(echo "$rec" | sed "s/\([0-9]\+:[0-9]\+ [AP]M\)/${BOLD}${CYAN}\1${NC}/g")
                    echo -e "    • $rec_formatted" | fold -s -w 50 | sed '2,$s/^/      /'
                done
            fi
            
            # Show weekly pattern
            local pattern=$(echo "$resp" | jq -c '.data.trends.weekly_pattern // empty' 2>/dev/null)
            if [ "$pattern" != "empty" ] && [ "$pattern" != "null" ]; then
                echo -e "  ${GRAY}Weekly pattern: $pattern${NC}"
            fi
        fi
        
        # Check for optimization data
        local first_block=$(echo "$resp" | jq -r '.data.suggested_schedule.time_blocks[0] // empty' 2>/dev/null)
        if [ "$first_block" != "empty" ] && [ "$first_block" != "null" ]; then
            echo ""
            echo -e "${BOLD}${MAGENTA}📅 Optimized for Your Patterns:${NC}"
            echo "$resp" | jq -r '.data.suggested_schedule.time_blocks[:3][] | "  \(.start)-\(.end): \(.activity)"' 2>/dev/null
            local saved=$(echo "$resp" | jq -r '.data.efficiency_gains.estimated_time_saved // 0')
            echo -e "  ${GREEN}Time saved: ${saved} minutes${NC}"
        fi
        
        # Check for preferences data (only show if we have actual preference data)
        local work_start=$(echo "$resp" | jq -r '.data.work_hours.start // empty' 2>/dev/null)
        local focus_blocks=$(echo "$resp" | jq -r '.data.focus_time_blocks // empty' 2>/dev/null)
        if [ "$work_start" != "empty" ] && [ "$work_start" != "null" ] && [ "$focus_blocks" != "empty" ] && [ "$focus_blocks" != "null" ]; then
            echo ""
            echo -e "${BOLD}${MAGENTA}⚙️ Your Preferences:${NC}"
            echo -e "  Work: ${BOLD}$work_start - $(echo "$resp" | jq -r '.data.work_hours.end')${NC}"
            echo -e "  Focus blocks: ${BOLD}$focus_blocks minutes${NC}"
            local break_dur=$(echo "$resp" | jq -r '.data.break_duration // empty' 2>/dev/null)
            if [ "$break_dur" != "empty" ] && [ "$break_dur" != "null" ]; then
                echo -e "  Breaks: ${BOLD}$break_dur minutes${NC}"
            fi
        fi
        
        # Check for questions service answer
        local answer=$(echo "$resp" | jq -r '.data.answer // empty')
        if [ "$answer" != "empty" ] && [ "$answer" != "null" ] && [ "$answer" != "No message" ]; then
            local conf=$(echo "$resp" | jq -r '.data.confidence // 0')
            echo ""
            echo -e "${BOLD}${MAGENTA}💡 Based on Your Data:${NC}"
            echo -e "  ${GRAY}(Confidence: $conf%)${NC}"
            
            # Highlight specific data references in the answer
            answer_formatted=$(echo "$answer" | \
                sed "s/\([0-9]\+ sessions\?\)/${BOLD}${CYAN}\1${NC}/g" | \
                sed "s/\([0-9]\+\.[0-9]\+\/[0-9]\+\)/${BOLD}${YELLOW}\1${NC}/g" | \
                sed "s/\([0-9]\+:[0-9]\+ [AP]M\)/${BOLD}${CYAN}\1${NC}/g")
            echo -e "  $answer_formatted" | fold -s -w 50 | sed '2,$s/^/  /'
            
            # Show related insights if available
            local insights=$(echo "$resp" | jq -r '.data.related_insights[]? // empty' 2>/dev/null | head -2)
            if [ -n "$insights" ]; then
                echo -e "  ${YELLOW}Key insights:${NC}"
                echo "$insights" | while IFS= read -r insight; do
                    echo -e "    • $insight" | fold -s -w 46 | sed '2,$s/^/      /'
                done
            fi
        fi
    fi
    
    echo "────────────────────────────────────────────────────────"
}

# Pre-programmed demo scenarios
show_demo_options() {
    echo -e "${BOLD}${YELLOW}Demo Scenarios:${NC}"
    echo "  d1) 'How productive was I this week?'"
    echo "  d2) 'When should I schedule important work?'"
    echo "  d3) 'What have I been working on?'"
    echo "  d4) 'Show me my energy patterns'"
    echo ""
}

# Main chat loop
show_demo_options

while true; do
    echo -ne "${BLUE}You:${NC} "
    read -r input
    
    # Handle demo shortcuts
    case "$input" in
        d1) input="How productive was I this week?";;
        d2) input="When should I schedule important work?";;
        d3) input="What have I been working on?";;
        d4) input="Show me my energy patterns";;
    esac
    
    case "$input" in
        quit|exit) 
            echo -e "${CYAN}Goodbye! 👋${NC}"
            exit 0
            ;;
        new)
            CONVERSATION_ID=""
            echo -e "${YELLOW}Starting new conversation...${NC}"
            echo ""
            show_demo_options
            continue
            ;;
        help)
            show_demo_options
            continue
            ;;
        [1-3])
            # Convert number to suggestion text
            case "$input" in
                1) input="View productivity insights";;
                2) input="Optimize your schedule";;
                3) input="Get productivity tips";;
            esac
            echo -e "${GRAY}(Selected: $input)${NC}"
            ;;
    esac
    
    echo -e "${GRAY}Analyzing your tide data...${NC}"
    response=$(send_message "$input")
    echo -e "\033[1A\033[K" # Clear processing line
    
    show_response "$response"
done