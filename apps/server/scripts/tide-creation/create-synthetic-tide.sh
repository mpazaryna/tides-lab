#!/bin/bash

# Create a fully synthetic tide with comprehensive test data
# This creates realistic productivity patterns for testing MCP tools and prompts

set -e

# Configuration - can be overridden by environment variables
BASE_URL="${TIDES_URL:-https://tides-003.mpazbot.workers.dev}"
API_KEY="${TIDES_API_KEY:-tides_testuser_001}"
TIDE_NAME="${TIDE_NAME:-Synthetic Test Tide}"
FLOW_TYPE="${FLOW_TYPE:-daily}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
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
    echo -e "${RED}✗ $1${NC}"
}

# Function to call MCP tools
call_mcp_tool() {
    local tool_name=$1
    local args=$2
    local description=$3
    
    print_info "$description"
    
    local request_body=$(cat <<EOF
{
    "jsonrpc": "2.0",
    "id": $(date +%s),
    "method": "tools/call",
    "params": {
        "name": "$tool_name",
        "arguments": $args
    }
}
EOF
    )
    
    local response=$(curl -s -X POST "$BASE_URL/mcp" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$request_body")
    
    # Parse the response
    local success=$(echo "$response" | jq -r '.result.content[0].text | fromjson.success // false' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        echo "$response" | jq -r '.result.content[0].text' 2>/dev/null
    else
        print_error "Failed: $description"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Create the main tide
create_tide() {
    print_header "🌊 Creating Synthetic Tide"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local args=$(cat <<EOF
{
    "name": "$TIDE_NAME - $timestamp",
    "flow_type": "$FLOW_TYPE",
    "description": "Synthetic tide with complete productivity data for testing. Created at $(date)"
}
EOF
    )
    
    local result=$(call_mcp_tool "tide_create" "$args" "Creating new tide")
    local tide_id=$(echo "$result" | jq -r '.tide_id // .tide.id // empty' 2>/dev/null)
    
    if [ -n "$tide_id" ] && [ "$tide_id" != "null" ]; then
        print_success "Created tide: $tide_id"
        echo "$tide_id"
    else
        print_error "Failed to create tide"
        exit 1
    fi
}

# Add flow sessions with varying patterns
add_flow_sessions() {
    local tide_id=$1
    print_header "⚡ Adding Flow Sessions"
    
    # Define realistic flow sessions throughout a day
    local sessions=(
        "25:focused:Morning deep focus on complex problem solving"
        "50:deep:Extended deep work session with high concentration"
        "15:light:Quick email and admin tasks"
        "45:moderate:Team collaboration and code review"
        "30:focused:Afternoon focused work on implementation"
        "20:light:End of day planning and wrap-up"
    )
    
    local total_duration=0
    local session_count=0
    
    for session in "${sessions[@]}"; do
        IFS=':' read -r duration intensity context <<< "$session"
        
        local args=$(cat <<EOF
{
    "tide_id": "$tide_id",
    "duration": $duration,
    "intensity": "$intensity",
    "work_context": "$context"
}
EOF
        )
        
        if call_mcp_tool "tide_flow" "$args" "Adding $duration min $intensity session" > /dev/null; then
            ((session_count++))
            ((total_duration+=duration))
        fi
        
        sleep 0.5  # Small delay between API calls
    done
    
    print_success "Added $session_count flow sessions (Total: $total_duration minutes)"
}

# Add energy level tracking
add_energy_levels() {
    local tide_id=$1
    print_header "🔋 Adding Energy Levels"
    
    # Realistic energy pattern throughout the day
    local energy_data=(
        "85:Morning energy after coffee - ready for deep work"
        "90:Peak morning focus - in the zone"
        "75:Pre-lunch maintaining good focus"
        "60:Post-lunch dip - energy dropping"
        "70:Afternoon recovery - second wind"
        "80:Late afternoon creative burst"
        "65:Evening wind-down - lower but steady"
        "50:End of day - time to rest"
    )
    
    local update_count=0
    
    for entry in "${energy_data[@]}"; do
        IFS=':' read -r level context <<< "$entry"
        
        local args=$(cat <<EOF
{
    "tide_id": "$tide_id",
    "energy_level": $level,
    "context": "$context"
}
EOF
        )
        
        if call_mcp_tool "tide_add_energy" "$args" "Recording energy level: $level" > /dev/null; then
            ((update_count++))
        fi
        
        sleep 0.5
    done
    
    print_success "Added $update_count energy level updates"
}

# Add task links
add_task_links() {
    local tide_id=$1
    print_header "📋 Adding Task Links"
    
    # Sample tasks from different platforms
    local tasks=(
        "github_issue:GH-1234:Fix authentication flow bug:https://github.com/org/repo/issues/1234"
        "linear_task:LIN-5678:Implement new dashboard feature:https://linear.app/team/issue/LIN-5678"
        "notion_page:DOC-9012:Update API documentation:https://notion.so/page/doc-9012"
        "jira_ticket:PROJ-3456:Optimize database queries:https://jira.company.com/browse/PROJ-3456"
        "asana_task:TASK-7890:Design review meeting prep:https://app.asana.com/task/7890"
    )
    
    local task_count=0
    
    for task in "${tasks[@]}"; do
        IFS=':' read -r task_type task_id task_title task_url <<< "$task"
        
        local args=$(cat <<EOF
{
    "tide_id": "$tide_id",
    "task_type": "$task_type",
    "task_id": "$task_id",
    "task_title": "$task_title",
    "task_url": "$task_url"
}
EOF
        )
        
        if call_mcp_tool "tide_link_task" "$args" "Linking task: $task_title" > /dev/null; then
            ((task_count++))
        fi
        
        sleep 0.5
    done
    
    print_success "Added $task_count task links"
}

# Generate and display report
generate_report() {
    local tide_id=$1
    print_header "📊 Generating Analytics Report"
    
    local args=$(cat <<EOF
{
    "tide_id": "$tide_id",
    "report_type": "productivity"
}
EOF
    )
    
    local report=$(call_mcp_tool "tide_get_report" "$args" "Generating productivity report")
    
    if [ -n "$report" ]; then
        echo -e "\n${CYAN}Productivity Report:${NC}"
        echo "$report" | jq '.' 2>/dev/null || echo "$report"
        print_success "Report generated successfully"
    fi
}

# Main execution
main() {
    print_header "🚀 Synthetic Tide Generator"
    
    print_info "Configuration:"
    print_info "  Server: $BASE_URL"
    print_info "  API Key: ${API_KEY:0:15}..."
    print_info "  Tide Name: $TIDE_NAME"
    print_info "  Flow Type: $FLOW_TYPE"
    
    # Check for required tools
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed"
        print_info "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    # Create the tide
    tide_id=$(create_tide)
    
    if [ -z "$tide_id" ] || [ "$tide_id" = "null" ]; then
        print_error "Failed to create tide"
        exit 1
    fi
    
    # Add all synthetic data
    add_flow_sessions "$tide_id"
    add_energy_levels "$tide_id"
    add_task_links "$tide_id"
    
    # Generate report
    generate_report "$tide_id"
    
    print_header "✅ Synthetic Tide Created Successfully!"
    
    echo -e "${GREEN}Summary:${NC}"
    echo -e "  ${CYAN}Tide ID:${NC} $tide_id"
    echo -e "  ${CYAN}Name:${NC} $TIDE_NAME"
    echo -e "  ${CYAN}Type:${NC} $FLOW_TYPE"
    echo -e "  ${CYAN}Data Created:${NC}"
    echo -e "    • 6 flow sessions (185 total minutes)"
    echo -e "    • 8 energy level updates"
    echo -e "    • 5 task links"
    echo -e ""
    echo -e "${YELLOW}You can now test MCP tools and prompts with this tide:${NC}"
    echo -e "  ${CYAN}Tide ID:${NC} $tide_id"
    echo -e ""
    echo -e "${GREEN}Example test commands:${NC}"
    echo -e "  # Get raw JSON data"
    echo -e "  curl -X POST $BASE_URL/mcp \\"
    echo -e "    -H 'Authorization: Bearer $API_KEY' \\"
    echo -e "    -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"tide_get_raw_json\",\"arguments\":{\"tide_id\":\"$tide_id\"}},\"id\":1}'"
    echo -e ""
    echo -e "  # Analyze with AI prompt"
    echo -e "  curl -X POST $BASE_URL/mcp \\"
    echo -e "    -H 'Authorization: Bearer $API_KEY' \\"
    echo -e "    -d '{\"jsonrpc\":\"2.0\",\"method\":\"prompts/get\",\"params\":{\"name\":\"analyze_tide\",\"arguments\":{\"tide_id\":\"$tide_id\"}},\"id\":1}'"
}

# Handle command-line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Create a fully synthetic tide with comprehensive test data"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick        Create minimal data (3 sessions, 4 energy, 2 tasks)"
        echo "  --full         Create extensive data (default)"
        echo ""
        echo "Environment variables:"
        echo "  TIDES_URL      Server URL (default: https://tides-003.mpazbot.workers.dev)"
        echo "  TIDES_API_KEY  API key (default: tides_testuser_001)"
        echo "  TIDE_NAME      Tide name (default: Synthetic Test Tide)"
        echo "  FLOW_TYPE      Flow type: daily|weekly|custom (default: daily)"
        exit 0
        ;;
    --quick)
        print_info "Quick mode: Creating minimal synthetic data"
        # TODO: Implement quick mode with reduced data
        ;;
esac

# Run main function
main