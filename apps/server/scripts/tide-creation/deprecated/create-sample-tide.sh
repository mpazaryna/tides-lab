#!/bin/bash

# Script to create a realistic sample tide with synthetic productivity data
# This creates a full end-to-end scenario for testing the TideProductivityAgent

set -e

# Configuration
BASE_URL="https://tides-001.mpazbot.workers.dev"
API_KEY="tides_testuser_001"
USER_ID="testuser001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ Error: $1${NC}"
}

# Function to make MCP requests
make_mcp_request() {
    local method=$1
    local params=$2
    local description=$3
    
    print_info "Making MCP request: $description"
    
    local request="{
        \"jsonrpc\": \"2.0\",
        \"id\": \"$(date +%s)\",
        \"method\": \"$method\",
        \"params\": $params
    }"
    
    echo "Request: $request" | jq '.' 2>/dev/null || echo "Request: $request"
    
    local response=$(curl -s -X POST "$BASE_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$request")
    
    echo "Response: $response" | jq '.' 2>/dev/null || echo "Response: $response"
    echo "$response"
}

# Create the main tide
create_sample_tide() {
    print_header "🌊 Creating Sample Productivity Tide"
    
    local today=$(date +"%Y-%m-%d")
    local params="{
        \"name\": \"create_tide\",
        \"arguments\": {
            \"name\": \"Daily Deep Work - $today\",
            \"flow_type\": \"daily\",
            \"description\": \"Focused productivity session with mixed task types and energy patterns\"
        }
    }"
    
    local response=$(make_mcp_request "tools/call" "$params" "Creating new tide")
    local tide_id=$(echo "$response" | jq -r '.result.tide.id // empty' 2>/dev/null)
    
    if [ -n "$tide_id" ] && [ "$tide_id" != "null" ]; then
        print_success "Created tide: $tide_id"
        echo "$tide_id"
    else
        print_error "Failed to create tide"
        echo "$response"
        exit 1
    fi
}

# Add realistic flow sessions throughout the day
add_flow_sessions() {
    local tide_id=$1
    print_header "⚡ Adding Flow Sessions to Tide: $tide_id"
    
    # Morning deep work session (high intensity, good energy)
    local params1="{
        \"name\": \"start_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"intensity\": \"strong\",
            \"work_context\": \"Deep work: Feature development and code review\",
            \"energy_level\": \"high\"
        }
    }"
    
    make_mcp_request "tools/call" "$params1" "Starting morning deep work session"
    sleep 2
    
    # End the session after 90 minutes
    local params1_end="{
        \"name\": \"end_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"duration\": 90
        }
    }"
    
    make_mcp_request "tools/call" "$params1_end" "Ending morning session (90 min)"
    sleep 1
    
    # Mid-morning moderate session
    local params2="{
        \"name\": \"start_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"intensity\": \"moderate\",
            \"work_context\": \"Meetings and planning\",
            \"energy_level\": \"medium\"
        }
    }"
    
    make_mcp_request "tools/call" "$params2" "Starting mid-morning session"
    sleep 2
    
    local params2_end="{
        \"name\": \"end_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"duration\": 45
        }
    }"
    
    make_mcp_request "tools/call" "$params2_end" "Ending mid-morning session (45 min)"
    sleep 1
    
    # Afternoon session (lower energy, gentle intensity)
    local params3="{
        \"name\": \"start_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"intensity\": \"gentle\",
            \"work_context\": \"Documentation and email processing\",
            \"energy_level\": \"low\"
        }
    }"
    
    make_mcp_request "tools/call" "$params3" "Starting afternoon session"
    sleep 2
    
    local params3_end="{
        \"name\": \"end_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"duration\": 60
        }
    }"
    
    make_mcp_request "tools/call" "$params3_end" "Ending afternoon session (60 min)"
    sleep 1
    
    # Late afternoon creative burst
    local params4="{
        \"name\": \"start_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"intensity\": \"strong\",
            \"work_context\": \"Creative problem solving and architecture design\",
            \"energy_level\": \"high\"
        }
    }"
    
    make_mcp_request "tools/call" "$params4" "Starting late afternoon creative session"
    sleep 2
    
    local params4_end="{
        \"name\": \"end_flow_session\",
        \"arguments\": {
            \"tide_id\": \"$tide_id\",
            \"duration\": 75
        }
    }"
    
    make_mcp_request "tools/call" "$params4_end" "Ending creative session (75 min)"
    
    print_success "Added 4 realistic flow sessions with varying intensity and energy"
}

# Add energy updates throughout the day
add_energy_updates() {
    local tide_id=$1
    print_header "🔋 Adding Energy Level Updates"
    
    # Array of energy updates throughout a typical day
    local energy_updates=(
        "high:Just had coffee, feeling very focused and ready to tackle complex tasks"
        "medium:Post-meeting energy, good for collaborative work but not deep focus"
        "low:After lunch dip, struggling to maintain concentration on difficult tasks"
        "medium:Second wind kicking in, good energy for creative work"
        "low:End of day fatigue, suitable for routine tasks only"
    )
    
    for update in "${energy_updates[@]}"; do
        local level=$(echo "$update" | cut -d':' -f1)
        local context=$(echo "$update" | cut -d':' -f2)
        
        local params="{
            \"name\": \"update_energy\",
            \"arguments\": {
                \"tide_id\": \"$tide_id\",
                \"energy_level\": \"$level\",
                \"context\": \"$context\"
            }
        }"
        
        make_mcp_request "tools/call" "$params" "Recording energy level: $level"
        sleep 1
    done
    
    print_success "Added 5 energy updates showing natural daily patterns"
}

# Add task links to represent work done
add_task_links() {
    local tide_id=$1
    print_header "📋 Adding Task Links"
    
    # Sample tasks that might be worked on during the tide
    local tasks=(
        "github:Fix user authentication bug in login flow"
        "jira:Implement real-time notifications for productivity agent"
        "notion:Document MCP protocol integration patterns"
        "slack:Review and respond to architecture discussion"
        "linear:Update CI/CD pipeline for faster deployments"
    )
    
    for task in "${tasks[@]}"; do
        local type=$(echo "$task" | cut -d':' -f1)
        local title=$(echo "$task" | cut -d':' -f2)
        local url="https://$type.com/task/$(date +%s)"
        
        local params="{
            \"name\": \"link_task\",
            \"arguments\": {
                \"tide_id\": \"$tide_id\",
                \"task_url\": \"$url\",
                \"task_title\": \"$title\",
                \"task_type\": \"$type\"
            }
        }"
        
        make_mcp_request "tools/call" "$params" "Linking task: $title"
        sleep 1
    done
    
    print_success "Added 5 task links representing work completed during tide"
}

# Test the productivity agent with real data
test_agent_with_real_data() {
    local tide_id=$1
    print_header "Testing TideProductivityAgent with Real Data"
    
    print_info "Tide ID: ${MAGENTA}$tide_id${NC}"
    print_info "This tide contains:"
    print_info "  • 4 flow sessions (270 total minutes)"
    print_info "  • 5 energy level updates throughout the day"
    print_info "  • 5 linked tasks from various platforms"
    print_info "  • Realistic productivity patterns and context"
    
    echo -e "\n${YELLOW}Testing productivity questions:${NC}\n"
    
    # Test 1: Peak productivity analysis
    echo -e "${CYAN}1. Analyzing peak productivity hours...${NC}"
    ../../scripts/test-productivity-agent-live.sh 4 "Based on my flow sessions and energy patterns, when were my peak productivity hours?" "$tide_id"
    echo -e "\n${CYAN}Press Enter to continue to next test...${NC}"
    read
    
    # Test 2: Energy pattern analysis
    echo -e "${CYAN}2. Analyzing energy patterns...${NC}"
    ../../scripts/test-productivity-agent-live.sh 4 "How did my energy levels correlate with my work intensity throughout the day?" "$tide_id"
    echo -e "\n${CYAN}Press Enter to continue to next test...${NC}"
    read
    
    # Test 3: Task effectiveness analysis
    echo -e "${CYAN}3. Analyzing task effectiveness...${NC}"
    ../../scripts/test-productivity-agent-live.sh 4 "Which types of tasks was I most effective at during different energy levels?" "$tide_id"
    echo -e "\n${CYAN}Press Enter to continue to next test...${NC}"
    read
    
    # Test 4: Recommendations for future sessions
    echo -e "${CYAN}4. Getting recommendations...${NC}"
    ../../scripts/test-productivity-agent-live.sh 4 "Based on this tide session, what recommendations do you have for optimizing future work sessions?" "$tide_id"
    
    print_success "Completed comprehensive agent testing with real synthetic data!"
}

# Main execution
main() {
    print_header "🚀 Creating Sample Tide for TideProductivityAgent Testing"
    print_info "This script will create a realistic tide with synthetic productivity data"
    print_info "Target: ${MAGENTA}$BASE_URL${NC}"
    print_info "User: ${CYAN}$USER_ID${NC}"
    
    echo -e "\n${YELLOW}This will:${NC}"
    echo -e "1. Create a new daily productivity tide"
    echo -e "2. Add 4 realistic flow sessions with varying intensity"
    echo -e "3. Record 5 energy level updates throughout the day"
    echo -e "4. Link 5 tasks from different platforms"
    echo -e "5. Test the agent with comprehensive questions"
    
    # Auto-continue for non-interactive mode
    if [ -t 0 ]; then
        echo -e "\n${CYAN}Press Enter to continue or Ctrl+C to abort...${NC}"
        read
    else
        echo -e "\n${CYAN}Running in non-interactive mode, continuing automatically...${NC}"
        sleep 2
    fi
    
    # Create the tide and capture the ID
    tide_id=$(create_sample_tide)
    
    if [ -z "$tide_id" ] || [ "$tide_id" = "null" ]; then
        print_error "Failed to create tide, aborting"
        exit 1
    fi
    
    # Add all the synthetic data
    add_flow_sessions "$tide_id"
    add_energy_updates "$tide_id"
    add_task_links "$tide_id"
    
    print_header "✅ Sample Tide Created Successfully!"
    echo -e "${GREEN}Tide ID: ${MAGENTA}$tide_id${NC}"
    echo -e "${GREEN}Total Data Points:${NC}"
    echo -e "  • 4 Flow Sessions (270 total minutes)"
    echo -e "  • 5 Energy Level Updates"
    echo -e "  • 5 Task Links"
    echo -e "  • Rich contextual data for AI analysis"
    
    # Auto-test for non-interactive mode or prompt for interactive
    if [ -t 0 ]; then
        echo -e "\n${YELLOW}Ready to test the TideProductivityAgent?${NC} [Y/n]: \c"
        read test_choice
        
        if [[ "$test_choice" != "n" && "$test_choice" != "N" ]]; then
            test_agent_with_real_data "$tide_id"
        else
            print_info "You can test the agent later with tide ID: $tide_id"
            echo -e "${CYAN}Example usage:${NC}"
            echo -e "./test-productivity-agent-live.sh 4 \"What were my peak productivity hours?\" \"$tide_id\""
        fi
    else
        print_info "Non-interactive mode: Skipping agent testing"
        print_info "You can test the agent with tide ID: $tide_id"
        echo -e "${CYAN}Example usage:${NC}"
        echo -e "./test-productivity-agent-live.sh 4 \"What were my peak productivity hours?\" \"$tide_id\""
    fi
    
    print_success "Sample tide creation complete!"
}

# Check dependencies
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed"
    print_info "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

# Run main function
main