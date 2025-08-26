import type { Tide } from "../types";
import { loggingService } from "../services/loggingService";

interface AgentCommandContext {
  tideId?: string;
  activeTides: Array<{
    id: string;
    name: string;
    flow_type: string;
    status: string;
    created_at: string;
    description?: string;
    flow_count?: number;
    last_flow?: string | null;
  }>;
  totalActiveTides: number;
  currentScreen: string;
  isConnected: boolean;
  currentServerUrl: string;
  requestedAt: string;
}

interface CreateAgentContextParams {
  tideId?: string;
  activeTides: Tide[];
  isConnected: boolean;
  getCurrentServerUrl: () => string;
}

export const createAgentContext = ({
  tideId,
  activeTides,
  isConnected,
  getCurrentServerUrl,
}: CreateAgentContextParams): AgentCommandContext => {
  return {
    // Current tide context (if navigated from a specific tide)
    ...(tideId && { tideId }),

    // User's active tides for insights and analysis
    activeTides: activeTides.map((tide) => ({
      id: tide.id,
      name: tide.name,
      flow_type: tide.flow_type,
      status: tide.status,
      created_at: tide.created_at,
      description: tide.description,
      flow_count: tide.flow_count,
      last_flow: tide.last_flow,
    })),

    // Current app state
    totalActiveTides: activeTides.length,
    currentScreen: "Home",

    // Connection state
    isConnected,
    currentServerUrl: getCurrentServerUrl(),

    // Timestamp for context
    requestedAt: new Date().toISOString(),
  };
};

interface ExecuteAgentCommandParams {
  command: string;
  context: AgentCommandContext;
  sendAgentMessage: (message: string, context: any) => Promise<void>;
  toggleToolMenu: () => void;
}

export const executeAgentCommand = async ({
  command,
  context,
  sendAgentMessage,
  toggleToolMenu,
}: ExecuteAgentCommandParams): Promise<void> => {
  toggleToolMenu(); // Close menu first

  try {
    loggingService.info("ToolMenu", "Sending agent command with context", {
      command,
      contextKeys: Object.keys(context),
      activeTidesCount: context.activeTides.length,
    });

    await sendAgentMessage(command, context);

    loggingService.info("ToolMenu", "Agent command executed from menu", {
      command,
      tideId: context.tideId,
      contextProvided: true,
    });
  } catch (agentError) {
    loggingService.error(
      "ToolMenu",
      "Failed to execute agent command from menu",
      { error: agentError, command, tideId: context.tideId }
    );
    throw agentError;
  }
};