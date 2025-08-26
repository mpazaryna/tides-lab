import {
  Plus,
  CheckCircle,
  Waves,
  Zap,
  Link,
  FileText,
  BarChart3,
  Users,
  Brain,
  Eye,
  Target,
} from "lucide-react-native";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "tide" | "energy" | "task" | "analytics" | "agent";
  requiresTide: boolean;
}

export interface ToolPhrase {
  toolId: string;
  patterns: RegExp[];
  priority: number;
  extractParams?: (match: RegExpMatchArray) => Record<string, any>;
}

export const TOOL_METADATA: Record<string, ToolMetadata> = {
  createTide: {
    id: "createTide",
    name: "Create Tide",
    description: "Start a new productivity tide",
    icon: Plus,
    category: "tide",
    requiresTide: false,
  },
  startTideFlow: {
    id: "startTideFlow",
    name: "Start Flow",
    description: "Begin a flow session",
    icon: CheckCircle,
    category: "tide",
    requiresTide: true,
  },
  listTides: {
    id: "listTides",
    name: "List Tides",
    description: "View all your tides",
    icon: Waves,
    category: "tide",
    requiresTide: false,
  },
  addEnergyToTide: {
    id: "addEnergyToTide",
    name: "Add Energy",
    description: "Record your energy level",
    icon: Zap,
    category: "energy",
    requiresTide: true,
  },
  linkTaskToTide: {
    id: "linkTaskToTide",
    name: "Link Task",
    description: "Connect a task to tide",
    icon: Link,
    category: "task",
    requiresTide: true,
  },
  getTaskLinks: {
    id: "getTaskLinks",
    name: "View Task Links",
    description: "See linked tasks",
    icon: FileText,
    category: "task",
    requiresTide: true,
  },
  getTideReport: {
    id: "getTideReport",
    name: "Get Report",
    description: "Generate tide report",
    icon: BarChart3,
    category: "analytics",
    requiresTide: true,
  },
  getTideParticipants: {
    id: "getTideParticipants",
    name: "View Participants",
    description: "See tide participants",
    icon: Users,
    category: "analytics",
    requiresTide: false,
  },
  getInsights: {
    id: "getInsights",
    name: "Get Insights",
    description: "AI-powered productivity insights",
    icon: Brain,
    category: "agent",
    requiresTide: false,
  },
  analyzeTides: {
    id: "analyzeTides",
    name: "Analyze Tides",
    description: "Deep analysis of your patterns",
    icon: Eye,
    category: "agent",
    requiresTide: false,
  },
  getRecommendations: {
    id: "getRecommendations",
    name: "Get Recommendations",
    description: "Personalized action suggestions",
    icon: Target,
    category: "agent",
    requiresTide: false,
  },
};

export const TOOL_PHRASES: ToolPhrase[] = [
  // Create Tide variations
  {
    toolId: "createTide",
    patterns: [
      /^(create|make|start|new|add|begin)\s+(a\s+)?(?:new\s+)?tide/i,
      /^tide\s+(create|new|add|start)/i,
      /^(i\s+want\s+to\s+)?(create|make|start)\s+(a\s+)?(?:new\s+)?tide/i,
      /^(can\s+you\s+)?(create|make)\s+(me\s+)?(a\s+)?tide/i,
      /^(let'?s\s+)?(create|start|make)\s+(a\s+)?tide/i,
      /^(create|new)\s+my\s+tide/i,
    ],
    priority: 10,
    extractParams: (match) => {
      const text = match[0].toLowerCase();
      const params: Record<string, any> = {};
      
      // Extract flow type from context
      if (text.includes("work")) params.flowType = "work";
      else if (text.includes("personal")) params.flowType = "personal";
      else if (text.includes("daily")) params.flowType = "daily";
      else if (text.includes("project")) params.flowType = "project";
      
      return params;
    },
  },
  
  // Start Flow variations
  {
    toolId: "startTideFlow",
    patterns: [
      /^(start|begin|initiate|launch)\s+(a\s+)?flow/i,
      /^flow\s+(start|begin|now)/i,
      /^(i\s+want\s+to\s+)?(start|begin)\s+(a\s+)?flow\s+session/i,
      /^(let'?s\s+)?(start|begin)\s+flowing/i,
      /^(time\s+to\s+)?flow/i,
      /^enter\s+flow\s+state/i,
    ],
    priority: 9,
    extractParams: (match) => {
      const text = match[0].toLowerCase();
      const params: Record<string, any> = {};
      
      // Extract intensity
      if (text.includes("gentle")) params.intensity = "gentle";
      else if (text.includes("moderate")) params.intensity = "moderate";
      else if (text.includes("intense") || text.includes("strong")) params.intensity = "strong";
      
      // Extract duration if mentioned
      const durationMatch = text.match(/(\d+)\s*min/);
      if (durationMatch) {
        params.duration = parseInt(durationMatch[1], 10);
      }
      
      return params;
    },
  },
  
  // List/Show Tides
  {
    toolId: "listTides",
    patterns: [
      /^(show|list|display|view)\s+(me\s+)?(my\s+)?tides/i,
      /^(what\s+are\s+)?my\s+tides/i,
      /^tides\s+(list|show|view)/i,
      /^(see|check)\s+(all\s+)?tides/i,
      /^refresh\s+tides/i,
    ],
    priority: 8,
  },
  
  // Add Energy
  {
    toolId: "addEnergyToTide",
    patterns: [
      /^(add|record|log|track)\s+(my\s+)?energy/i,
      /^energy\s+(add|level|update)/i,
      /^(i'?m\s+feeling\s+)(low|moderate|high)(\s+energy)?/i,
      /^(update|set)\s+energy\s+level/i,
      /^(my\s+)?energy\s+is\s+(low|moderate|high)/i,
    ],
    priority: 7,
    extractParams: (match) => {
      const text = match[0].toLowerCase();
      const params: Record<string, any> = {};
      
      if (text.includes("low")) params.energyLevel = "low";
      else if (text.includes("moderate") || text.includes("medium")) params.energyLevel = "moderate";
      else if (text.includes("high")) params.energyLevel = "high";
      
      return params;
    },
  },
  
  // Link Task
  {
    toolId: "linkTaskToTide",
    patterns: [
      /^(link|connect|attach|add)\s+(a\s+)?task/i,
      /^task\s+(link|connect|add)/i,
      /^(connect|link)\s+to\s+task/i,
      /^(add|create)\s+task\s+link/i,
    ],
    priority: 6,
  },
  
  // View Task Links
  {
    toolId: "getTaskLinks",
    patterns: [
      /^(show|view|list|see)\s+(my\s+)?task\s+links/i,
      /^(what\s+)?tasks\s+(are\s+)?linked/i,
      /^linked\s+tasks/i,
      /^task\s+links/i,
    ],
    priority: 5,
  },
  
  // Get Report
  {
    toolId: "getTideReport",
    patterns: [
      /^(get|generate|create|show)\s+(a\s+)?report/i,
      /^(tide\s+)?report/i,
      /^(show|view)\s+(my\s+)?statistics/i,
      /^(get|show)\s+analytics/i,
      /^summary\s+report/i,
    ],
    priority: 4,
  },
  
  // View Participants
  {
    toolId: "getTideParticipants",
    patterns: [
      /^(show|view|list|see)\s+participants/i,
      /^(who'?s\s+|who\s+is\s+)?participating/i,
      /^participants\s+list/i,
      /^tide\s+participants/i,
    ],
    priority: 3,
  },
  
  // Agent Commands - Insights
  {
    toolId: "getInsights",
    patterns: [
      /^(get|show|give\s+me)\s+insights/i,
      /^insights(\s+please)?/i,
      /^(what\s+are\s+my\s+)?productivity\s+insights/i,
      /^analyze\s+my\s+productivity/i,
    ],
    priority: 8,
  },
  
  // Agent Commands - Analyze
  {
    toolId: "analyzeTides",
    patterns: [
      /^analyze\s+(my\s+)?tides/i,
      /^(deep\s+)?analysis\s+of\s+(my\s+)?tides/i,
      /^tide\s+analysis/i,
      /^(check|review)\s+my\s+patterns/i,
    ],
    priority: 7,
  },
  
  // Agent Commands - Recommendations
  {
    toolId: "getRecommendations",
    patterns: [
      /^(get|show|give\s+me)\s+recommendations/i,
      /^recommend\s+(me\s+)?actions/i,
      /^(what\s+should\s+i\s+do)(\s+next)?/i,
      /^suggestions(\s+please)?/i,
      /^(what'?s\s+|what\s+is\s+)recommended/i,
    ],
    priority: 6,
  },
];

export const CONFIDENCE_THRESHOLD = 0.8;

export interface DetectedTool {
  toolId: string;
  metadata: ToolMetadata;
  confidence: number;
  extractedParams?: Record<string, any>;
  matchedPattern?: string;
}