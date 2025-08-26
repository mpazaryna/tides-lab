# Tides MCP Tools Parameter Reference - Complete Implementation

## Core Tide Management Tools (✅ Implemented)

| Tool | Essential Parameters | Nice-to-have Parameters | Usage |
|------|---------------------|------------------------|-------|
| **tide_create** | `name` (string), `flow_type` ('daily'/'weekly'/'monthly'/'project'/'seasonal') | `description` (string, max 500 chars) | 📱 Mobile + 🖥️ Server |
| **tide_list** | None | `flow_type` (string), `active_only` (boolean, default: false) | 📱 Mobile + 🖥️ Server |
| **tide_flow** | `tide_id` (string) | `intensity` ('gentle'/'moderate'/'strong', default: 'moderate'), `duration` (number, default: 25 mins), `initial_energy` (string, default: 'high'), `work_context` (string, default: 'General work') | 📱 Mobile + 🖥️ Server |
| **tide_add_energy** | `tide_id` (string), `energy_level` (string) | `context` (string, describes energy state) | 📱 Mobile + 🖥️ Server |
| **tide_link_task** | `tide_id` (string), `task_url` (string), `task_title` (string) | `task_type` (string, default: 'general') | 📱 Mobile + 🖥️ Server |
| **tide_list_task_links** | `tide_id` (string) | None | 📱 Mobile + 🖥️ Server |
| **tide_get_report** | `tide_id` (string) | `format` ('json'/'markdown'/'csv', default: 'json') | 📱 Mobile + 🖥️ Server |
| **tide_get_raw_json** | `tide_id` (string) | None | 🖥️ Server Only |
| **tides_get_participants** | None | `status_filter` (string), `date_from` (string, ISO format), `date_to` (string, ISO format), `limit` (number, default: 100) | 📱 Mobile + 🖥️ Server |

## Hierarchical Context Tools (✅ Implemented)

| Tool | Essential Parameters | Nice-to-have Parameters | Usage |
|------|---------------------|------------------------|-------|
| **tide_get_or_create_daily** | None | `timezone` (string), `date` (string, YYYY-MM-DD) | 📱 Mobile + 🖥️ Server |
| **tide_start_hierarchical_flow** | None | `intensity` ('gentle'/'moderate'/'strong', default: 'moderate'), `duration` (number, default: 25 mins), `initial_energy` (string, default: 'medium'), `work_context` (string, default: 'General work'), `date` (string, YYYY-MM-DD) | 📱 Mobile + 🖥️ Server |
| **tide_get_todays_summary** | None | `date` (string, YYYY-MM-DD, defaults to today) | 📱 Mobile + 🖥️ Server |
| **tide_list_contexts** | None | `date` (string, YYYY-MM-DD), `include_empty` (boolean, default: true) | 📱 Mobile + 🖥️ Server |
| **tide_switch_context** | `context_type` ('daily'/'weekly'/'monthly'/'project') | `date` (string, YYYY-MM-DD) | 📱 Mobile + 🖥️ Server |

## AI-Powered Tools (🔄 Planned)

| Tool | Essential Parameters | Nice-to-have Parameters |
|------|---------------------|------------------------|
| **ai_analyze_productivity** | `tide_id` (string) | `analysis_period` (string), `focus_areas` (array of strings) |
| **ai_suggest_flow_session** | `user_id` (string) | `time_preference` (string), `energy_level` (string), `available_duration` (number) |
| **ai_predict_energy** | `user_id` (string) | `prediction_hours` (number, default: 24), `historical_days` (number, default: 30) |
| **ai_optimize_schedule** | `user_id` (string), `tasks` (array) | `constraints` (object), `optimization_goal` (string) |
| **ai_session_insights** | `session_id` (string) | `comparison_period` (string), `improvement_focus` (string) |

## Tool Summary

**Total Tools:** 19 (14 Implemented ✅ + 5 Planned 🔄)

- **Core Tide Management:** 9 tools for basic tide operations
- **Hierarchical Context:** 5 tools for automatic daily/weekly/monthly contexts
- **AI-Powered:** 5 planned tools for intelligent insights and optimization

### Implementation Status Breakdown

**✅ Server Registered & Mobile Integrated (14 tools):**
- All core tide management tools (9)
- All hierarchical context tools (5)

**📱 Mobile mcpService methods available:**
- ✅ All convenience methods implemented
- ✅ Type safety with shared definitions
- ✅ Proper parameter mapping

## Parameter Details

**Essential Parameters:** Required for tool execution. If missing, the agent should prompt the user.

**Nice-to-have Parameters:** Optional with sensible defaults. Agent should execute without prompting if these are missing.

## Usage Notes

- **tide_id format:** `tide_TIMESTAMP_HASH` (e.g., `tide_1738366800000_abc123`)
- **Flow intensity levels:** 
  - `gentle`: Light, non-demanding work
  - `moderate`: Standard focused work
  - `strong`: High-concentration, demanding tasks
- **Energy levels:** Can be numeric (1-10) or descriptive (low/medium/high)
- **Date format:** YYYY-MM-DD (ISO date format)
- **Task types:** 'github_issue', 'github_pr', 'linear_task', 'jira_task', 'obsidian_note', 'notion_page', 'calendar_event', 'general'

## Implementation Status

- ✅ **Implemented:** Ready for use in mobile/web apps
- 🔄 **Planned:** In development roadmap, requires AI model binding