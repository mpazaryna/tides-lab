import { loggingService } from "../services/loggingService";

type TideContext = 'daily' | 'weekly' | 'monthly';

interface ContextTide {
  id: string;
  name: string;
  context: TideContext;
  created_at: string;
  status: 'active';
}

interface AgentCommandContext {
  tideId?: string;
  currentContextTide: ContextTide | null;
  currentScreen: string;
  isConnected: boolean;
  currentServerUrl: string;
  requestedAt: string;
}

interface CreateAgentContextParams {
  tideId?: string;
  currentContextTide: ContextTide | null;
  isConnected: boolean;
  getCurrentServerUrl: () => string;
}

export const createAgentContext = ({
  tideId,
  currentContextTide,
  isConnected,
  getCurrentServerUrl,
}: CreateAgentContextParams): AgentCommandContext => {
  return {
    // Current tide context (if navigated from a specific tide)
    ...(tideId && { tideId }),

    // Current context tide (daily/weekly/monthly - always available)
    currentContextTide,

    // Current app state  
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
      currentContext: context.currentContextTide?.context || 'none',
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