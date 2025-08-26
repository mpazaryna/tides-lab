/**
 * Enhanced tool configuration for Tides mobile app
 * Maps MCP tool names to user-friendly display information with detailed parameter guidance
 */

export interface ToolParameter {
  name: string;
  description: string;
  example: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[]; // For select type
}

export interface ToolConfig {
  title: string;
  description: string;
  category: string;
  requiresAI?: boolean;
  requiredParams: ToolParameter[];
  optionalParams: ToolParameter[];
  triggers: string[];
}

export const TOOLS_CONFIG: Record<string, ToolConfig> = {
  // Flow Sessions
  tide_smart_flow: {
    title: "Start Flow",
    description: "Create a Pomodoro-style flow session",
    category: "Flow Sessions",
    requiredParams: [],
    optionalParams: [
      {
        name: "work_context",
        description: "what you're working on",
        example: "implementing auth, reviewing PRs, writing docs",
        type: "text",
      },
      {
        name: "initial_energy",
        description: "starting energy level",
        example: "high, medium, low, 8",
        type: "text",
      },
      {
        name: "duration",
        description: "session length in minutes",
        example: "25, 45, 90",
        type: "number",
      },
      {
        name: "intensity",
        description: "work intensity",
        example: "gentle, moderate, strong",
        type: "select",
        options: ["gentle", "moderate", "strong"],
      },
    ],
    triggers: [
      "start flow",
      "begin session",
      "pomodoro",
      "focus session",
      "work session",
      "start working",
      "deep work",
      "flow state",
      "productivity session",
      "time block",
      "concentration",
      "focused time",
    ],
  },

  // Context Management
  tide_switch_context: {
    title: "Switch Context",
    description: "Switch between daily, weekly, monthly views",
    category: "Context Management",
    requiredParams: [
      {
        name: "context",
        description: "which view you want",
        example: "daily, weekly, monthly",
        type: "select",
        options: ["daily", "weekly", "monthly"],
      },
    ],
    optionalParams: [
      {
        name: "date",
        description: "target date (ISO format)",
        example: "2025-08-25, 2025-01-15",
        type: "text",
      },
      {
        name: "create_if_missing",
        description: "create context if it doesn't exist",
        example: "true, false",
        type: "select",
        options: ["true", "false"],
      },
    ],
    triggers: [
      "switch context",
      "change view",
      "daily view",
      "weekly view",
      "monthly view",
      "context switch",
      "change context",
      "switch to",
      "view daily",
      "view weekly",
      "view monthly",
      "change period",
    ],
  },

  tide_get_todays_summary: {
    title: "Create Summary",
    description: "Get summary of today's activity across contexts",
    category: "Context Management",
    requiredParams: [],
    optionalParams: [
      {
        name: "date",
        description: "which day",
        example: "2024-01-15, today, yesterday",
        type: "text",
      },
    ],
    triggers: [
      "summary",
      "today's summary",
      "summarize today",
      "daily summary",
      "what happened today",
      "recap today",
      "today recap",
      "daily recap",
      "show summary",
      "activity summary",
      "progress summary",
      "day overview",
    ],
  },

  // AI Analysis
  ai_analyze_productivity: {
    title: "Analyze Productivity",
    description: "AI analysis of productivity patterns",
    category: "AI Analysis",
    requiresAI: true,
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "analyze productivity",
      "productivity analysis",
      "analyze patterns",
      "performance analysis",
      "productivity insights",
      "how productive",
      "efficiency analysis",
      "work patterns",
      "productivity review",
      "analyze performance",
      "productivity metrics",
      "work efficiency",
    ],
  },

  ai_suggest_flow_session: {
    title: "Suggest Session",
    description: "AI-powered session recommendations",
    category: "AI Analysis",
    requiresAI: true,
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "suggest session",
      "recommend session",
      "what to work on",
      "session suggestion",
      "flow recommendation",
      "work recommendation",
      "suggest flow",
      "what should i do",
      "next session",
      "work suggestions",
      "productivity suggestion",
      "focus suggestion",
    ],
  },

  ai_predict_energy: {
    title: "Predict Energy",
    description: "ML prediction of future energy levels",
    category: "AI Analysis",
    requiresAI: true,
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "predict energy",
      "energy prediction",
      "future energy",
      "energy forecast",
      "when will i be energized",
      "energy levels",
      "predict fatigue",
      "energy planning",
      "optimal time",
      "best time to work",
      "energy patterns",
      "fatigue prediction",
    ],
  },

  ai_optimize_schedule: {
    title: "Optimize Schedule",
    description: "AI schedule optimization recommendations",
    category: "AI Analysis",
    requiresAI: true,
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "optimize schedule",
      "schedule optimization",
      "improve schedule",
      "better schedule",
      "schedule suggestions",
      "optimize time",
      "time optimization",
      "schedule efficiency",
      "perfect schedule",
      "ideal schedule",
      "schedule planning",
      "time management",
    ],
  },

  ai_session_insights: {
    title: "Generate Insights",
    description: "AI insights from completed sessions",
    category: "AI Analysis",
    requiresAI: true,
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "session insights",
      "analyze sessions",
      "session analysis",
      "insights",
      "session patterns",
      "work insights",
      "productivity insights",
      "session review",
      "what learned",
      "session feedback",
      "performance insights",
      "work analysis",
    ],
  },

  // Energy & Tasks
  tide_add_energy: {
    title: "Record Energy",
    description: "Record energy level for tracking",
    category: "Energy & Tasks",
    requiredParams: [
      {
        name: "energy_level",
        description: "energy level (1-10 or descriptive)",
        example: "8, high, medium, low",
        type: "text",
      },
    ],
    optionalParams: [
      {
        name: "context",
        description: "what's affecting your energy",
        example: "after coffee, post-lunch dip, completed big task",
        type: "text",
      },
    ],
    triggers: [
      "add energy",
      "record energy",
      "energy level",
      "how energized",
      "feeling tired",
      "feeling energized",
      "energy check",
      "track energy",
      "log energy",
      "energy status",
      "current energy",
      "energy update",
    ],
  },

  tide_link_task: {
    title: "Link Task",
    description: "Connect external tasks to tides",
    category: "Energy & Tasks",
    requiredParams: [
      {
        name: "task_url",
        description: "URL of the external task",
        example:
          "https://github.com/user/repo/issues/123, https://trello.com/c/abc123",
        type: "text",
      },
      {
        name: "task_title",
        description: "title or description of the task",
        example: "Fix authentication bug, Review PR #456",
        type: "text",
      },
    ],
    optionalParams: [
      {
        name: "task_type",
        description: "type of external task",
        example: "github_issue, trello_card, linear_ticket",
        type: "text",
      },
    ],
    triggers: [
      "link task",
      "connect task",
      "add task",
      "attach task",
      "task link",
      "link url",
      "connect url",
      "add link",
      "external task",
      "link project",
      "connect work",
      "task connection",
    ],
  },

  tide_list_task_links: {
    title: "View Links",
    description: "List all linked tasks for a tide",
    category: "Energy & Tasks",
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "view links",
      "show links",
      "task links",
      "linked tasks",
      "connected tasks",
      "view tasks",
      "list links",
      "show tasks",
      "task list",
      "connected work",
      "linked projects",
      "view connections",
    ],
  },

  // Analytics & Data
  tide_get_report: {
    title: "Generate Report",
    description: "Generate analytics reports",
    category: "Analytics & Data",
    requiredParams: [],
    optionalParams: [
      {
        name: "format",
        description: "report output format",
        example: "json, markdown, csv",
        type: "select",
        options: ["json", "markdown", "csv"],
      },
    ],
    triggers: [
      "generate report",
      "create report",
      "analytics report",
      "data report",
      "progress report",
      "performance report",
      "activity report",
      "work report",
      "productivity report",
      "detailed report",
      "export report",
      "report data",
    ],
  },

  tide_get_raw_json: {
    title: "Export Data",
    description: "Export complete JSON data",
    category: "Analytics & Data",
    requiredParams: [],
    optionalParams: [],
    triggers: [
      "export data",
      "raw data",
      "json data",
      "download data",
      "export json",
      "data export",
      "backup data",
      "save data",
      "get data",
      "extract data",
      "raw export",
      "complete data",
    ],
  },

  tides_get_participants: {
    title: "View Participants",
    description: "List system participants",
    category: "Analytics & Data",
    requiredParams: [],
    optionalParams: [
      {
        name: "status_filter",
        description: "filter by participant status",
        example: "active, inactive, all",
        type: "select",
        options: ["active", "inactive", "all"],
      },
      {
        name: "date_from",
        description: "start date for filtering (ISO format)",
        example: "2025-08-01, 2025-01-15",
        type: "text",
      },
      {
        name: "date_to",
        description: "end date for filtering (ISO format)",
        example: "2025-08-31, 2025-12-31",
        type: "text",
      },
      {
        name: "limit",
        description: "maximum number of participants to return",
        example: "50, 100, 25",
        type: "number",
      },
    ],
    triggers: [
      "view participants",
      "show participants",
      "list participants",
      "participants",
      "who's involved",
      "team members",
      "collaborators",
      "users",
      "active users",
      "participant list",
      "system users",
      "user list",
    ],
  },
};

export type ToolId = keyof typeof TOOLS_CONFIG;

// Helper function to get tool info
export function getToolInfo(toolId: string) {
  return TOOLS_CONFIG[toolId as ToolId] || null;
}

// Get tools by category
export function getToolsByCategory(category: string) {
  return Object.entries(TOOLS_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([toolId, config]) => ({ toolId, ...config }));
}
