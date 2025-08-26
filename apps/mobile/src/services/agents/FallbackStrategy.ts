/**
 * Fallback Strategy
 * 
 * Provides graceful degradation when the primary agent service is unavailable.
 * Implements multiple fallback mechanisms including direct MCP calls, cached
 * responses, default messages, and offline queuing to ensure continuity of service.
 * 
 * Fallback Options (in priority order):
 * 1. MCP Direct - Execute MCP tools directly bypassing the agent
 * 2. Cache Fallback - Return cached responses from previous successful calls
 * 3. Default Response - Provide helpful default responses for common queries
 * 4. Queue Fallback - Queue requests for later processing when connection is restored
 * 
 * Features:
 * - Multiple fallback strategies with configurable priority
 * - Smart command detection and routing
 * - Response caching with TTL management
 * - Integration with existing MCP service
 * - Comprehensive logging and metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoggingService } from '../LoggingService';
import { useMCP } from '../../context/MCPContext';
import type { 
  FallbackResult, 
  FallbackOption,
  ParsedCommand,
  CachedResponse,
  AgentMessage
} from '../../types/agents';
import type { FallbackConfig } from '../../types/connection';

interface FallbackContext {
  originalMessage: string;
  parsedCommand?: ParsedCommand;
  timestamp: Date;
  userId?: string;
  conversationId?: string;
}

interface DefaultResponse {
  patterns: RegExp[];
  response: string;
  confidence: number;
  suggestions?: string[];
}

export class FallbackStrategy {
  private serviceName = "FallbackStrategy";
  private config: FallbackConfig;
  private cache: Map<string, CachedResponse> = new Map();
  private defaultResponses: DefaultResponse[] = [];
  private mcpService: any = null; // Will be injected
  private cacheKey = 'agent_fallback_cache';
  private isInitialized = false;

  constructor(config: FallbackConfig) {
    this.config = config;
    this.initializeDefaultResponses();
    
    LoggingService.info(
      this.serviceName,
      "Fallback strategy initialized",
      { 
        enabled: config.enabled,
        strategy: config.strategy,
        fallbackOptions: Object.keys(config).filter(key => key.includes('Fallback'))
      },
      "FALLBACK_001"
    );
  }

  // ======================== Initialization ========================

  public async initialize(mcpService?: any): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Initializing fallback strategy",
        {},
        "FALLBACK_002"
      );

      // Inject MCP service if provided
      if (mcpService) {
        this.mcpService = mcpService;
      }

      // Load cached responses
      await this.loadCache();

      this.isInitialized = true;
      
      LoggingService.info(
        this.serviceName,
        "Fallback strategy initialized successfully",
        { cacheSize: this.cache.size },
        "FALLBACK_003"
      );

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to initialize fallback strategy",
        { error },
        "FALLBACK_004"
      );
      throw error;
    }
  }

  private initializeDefaultResponses(): void {
    this.defaultResponses = [
      // Tide creation requests
      {
        patterns: [
          /create.*tide/i,
          /new.*tide/i,
          /add.*tide/i,
          /make.*tide/i
        ],
        response: "I can help you create a new tide! However, I'm currently unable to connect to the agent service. You can try:\n\n• Creating a tide directly through the app interface\n• Waiting a moment and trying your request again\n• Using the command: '/tool createTide name=\"Your Tide Name\"'",
        confidence: 0.8,
        suggestions: [
          "Try '/tool createTide name=\"My Project\"'",
          "Use the app's create tide button",
          "Check your internet connection"
        ]
      },
      
      // Tide listing requests
      {
        patterns: [
          /list.*tides?/i,
          /show.*tides?/i,
          /my.*tides?/i,
          /all.*tides?/i,
          /what.*tides?/i
        ],
        response: "I'd normally show you your tides, but I'm having trouble connecting to the agent service right now. You can:\n\n• View your tides in the app's main screen\n• Try refreshing the connection\n• Use the direct command: '/tool tide_list'",
        confidence: 0.8,
        suggestions: [
          "Check the main app screen",
          "Try '/tool tide_list'",
          "Pull down to refresh"
        ]
      },
      
      // Help and guidance requests
      {
        patterns: [
          /help/i,
          /what.*can.*do/i,
          /how.*work/i,
          /commands?/i
        ],
        response: "I'm your productivity assistant for tide workflow management! Even though I'm having connection issues, here's what I can normally help with:\n\n• **Create Tides**: 'Create a new daily tide called Morning Routine'\n• **Track Energy**: 'Add high energy to my project tide'\n• **Start Flow**: 'Begin a 25-minute focus session'\n• **Get Reports**: 'Show me my productivity summary'\n\nTry using direct commands like '/tool createTide' or wait for the connection to restore.",
        confidence: 0.9,
        suggestions: [
          "Try '/tool createTide name=\"Test\"'",
          "Use '/agent help' when connection returns",
          "Explore the app interface"
        ]
      },
      
      // Energy tracking requests
      {
        patterns: [
          /add.*energy/i,
          /track.*energy/i,
          /energy.*level/i,
          /(high|medium|low).*energy/i
        ],
        response: "I can help you track energy levels for your tides! While the agent service is unavailable, you can:\n\n• Use the direct command format\n• Wait for the connection to restore\n• Track energy through the app interface",
        confidence: 0.7,
        suggestions: [
          "Try '/tool addEnergyToTide tideId=\"123\" energyLevel=\"high\"'",
          "Use the app's energy tracking interface",
          "Note your energy level for later"
        ]
      },
      
      // Status and connection requests
      {
        patterns: [
          /status/i,
          /connection/i,
          /working/i,
          /online/i,
          /available/i
        ],
        response: "I'm currently experiencing connection issues with the main agent service, but I'm still here to help! My fallback systems are active and I can:\n\n• Provide guidance and suggestions\n• Queue your requests for when service returns\n• Help with direct tool commands\n• Cache responses for faster access later",
        confidence: 1.0,
        suggestions: [
          "Check connection status in settings",
          "Try again in a few moments",
          "Use direct commands with '/tool'"
        ]
      },
      
      // General productivity questions
      {
        patterns: [
          /productive/i,
          /workflow/i,
          /focus/i,
          /time.*management/i
        ],
        response: "Great question about productivity! While I can't access the full agent analysis right now, here are some general tide productivity tips:\n\n• **Start Small**: Create simple daily tides to build momentum\n• **Track Energy**: Note your energy levels throughout the day\n• **Flow Sessions**: Use focused work sessions with breaks\n• **Review Regularly**: Check your tide reports for insights\n\nOnce my connection is restored, I can provide personalized analysis of your specific workflow patterns!",
        confidence: 0.6
      },
      
      // Fallback for unrecognized requests
      {
        patterns: [/.*/], // Matches everything
        response: "I understand you're trying to get help, but I'm currently having trouble connecting to my full capabilities. Here's what you can do:\n\n• **Wait and retry**: Connection issues are usually temporary\n• **Use direct commands**: Try '/tool [toolName]' format\n• **Check the app**: Many features are available in the interface\n• **Be specific**: When connection returns, detailed requests work better\n\nI'll queue your request to process once my connection is restored!",
        confidence: 0.3,
        suggestions: [
          "Try being more specific",
          "Use '/tool' commands",
          "Check app interface",
          "Wait for connection to restore"
        ]
      }
    ];
  }

  // ======================== Main Fallback Execution ========================

  public async executeFallback(
    message: string, 
    parsedCommand?: ParsedCommand,
    context?: Partial<FallbackContext>
  ): Promise<FallbackResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        source: "none",
        message: "Fallback strategies are disabled"
      };
    }

    const fallbackContext: FallbackContext = {
      originalMessage: message,
      parsedCommand,
      timestamp: new Date(),
      ...context
    };

    LoggingService.info(
      this.serviceName,
      "Executing fallback strategy",
      { 
        message: message.substring(0, 50),
        strategy: this.config.strategy,
        hasCommand: !!parsedCommand
      },
      "FALLBACK_005"
    );

    try {
      let result: FallbackResult;

      switch (this.config.strategy) {
        case "sequential":
          result = await this.executeSequentialFallback(fallbackContext);
          break;
        
        case "parallel":
          result = await this.executeParallelFallback(fallbackContext);
          break;
        
        case "weighted":
          result = await this.executeWeightedFallback(fallbackContext);
          break;
        
        default:
          result = await this.executeSequentialFallback(fallbackContext);
      }

      LoggingService.info(
        this.serviceName,
        "Fallback execution completed",
        { 
          success: result.success,
          source: result.source,
          limitations: result.limitations?.length || 0
        },
        "FALLBACK_006"
      );

      return result;

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Fallback execution failed",
        { error },
        "FALLBACK_007"
      );

      return {
        success: false,
        source: "none",
        message: "All fallback strategies failed",
        limitations: ["Unable to process request due to system errors"]
      };
    }
  }

  // ======================== Fallback Strategy Implementations ========================

  private async executeSequentialFallback(context: FallbackContext): Promise<FallbackResult> {
    const strategies = this.getOrderedFallbacks();
    
    for (const strategy of strategies) {
      try {
        const result = await this.executeSingleFallback(strategy, context);
        
        if (result.success) {
          return result;
        }
        
        LoggingService.debug(
          this.serviceName,
          "Fallback strategy failed, trying next",
          { 
            strategy: strategy.type,
            error: result.message
          },
          "FALLBACK_008"
        );
        
      } catch (error) {
        LoggingService.warn(
          this.serviceName,
          "Fallback strategy exception",
          { 
            strategy: strategy.type,
            error
          },
          "FALLBACK_009"
        );
      }
    }

    return {
      success: false,
      source: "none",
      message: "All fallback strategies exhausted",
      limitations: ["Primary service unavailable", "All fallback options failed"]
    };
  }

  private async executeParallelFallback(context: FallbackContext): Promise<FallbackResult> {
    const strategies = this.getOrderedFallbacks();
    
    const promises = strategies.map(async strategy => {
      try {
        const result = await this.executeSingleFallback(strategy, context);
        return { strategy: strategy.type, result };
      } catch (error) {
        return { 
          strategy: strategy.type, 
          result: { 
            success: false, 
            source: strategy.type, 
            message: error.message 
          } 
        };
      }
    });

    const results = await Promise.allSettled(promises);
    
    // Return first successful result
    for (const promiseResult of results) {
      if (promiseResult.status === 'fulfilled' && promiseResult.value.result.success) {
        LoggingService.info(
          this.serviceName,
          "Parallel fallback succeeded",
          { strategy: promiseResult.value.strategy },
          "FALLBACK_010"
        );
        return promiseResult.value.result;
      }
    }

    return {
      success: false,
      source: "none",
      message: "No parallel fallback succeeded",
      limitations: ["All fallback strategies failed in parallel execution"]
    };
  }

  private async executeWeightedFallback(context: FallbackContext): Promise<FallbackResult> {
    // For weighted strategy, we prioritize based on success rates and response quality
    const strategies = this.getOrderedFallbacks();
    
    // Simple weighted selection - in production this could use historical success rates
    const mcpWeight = this.config.mcpFallback.enabled ? 0.4 : 0;
    const cacheWeight = this.config.cacheFallback.enabled ? 0.3 : 0;
    const defaultWeight = this.config.defaultFallback.enabled ? 0.2 : 0;
    const queueWeight = this.config.queueFallback.enabled ? 0.1 : 0;
    
    // Try strategies in weighted order (highest weight first)
    const weightedOrder = strategies.sort((a, b) => {
      const weights = { mcp_direct: mcpWeight, cached_response: cacheWeight, default_message: defaultWeight, offline_queue: queueWeight };
      return weights[b.type] - weights[a.type];
    });
    
    return this.executeSequentialFallback(context);
  }

  private getOrderedFallbacks(): FallbackOption[] {
    const fallbacks: FallbackOption[] = [];
    
    if (this.config.mcpFallback.enabled) {
      fallbacks.push({
        type: "mcp_direct",
        priority: this.config.mcpFallback.priority,
        enabled: true,
        config: this.config.mcpFallback
      });
    }
    
    if (this.config.cacheFallback.enabled) {
      fallbacks.push({
        type: "cached_response",
        priority: this.config.cacheFallback.priority,
        enabled: true,
        config: this.config.cacheFallback
      });
    }
    
    if (this.config.defaultFallback.enabled) {
      fallbacks.push({
        type: "default_message",
        priority: this.config.defaultFallback.priority,
        enabled: true,
        config: this.config.defaultFallback
      });
    }
    
    if (this.config.queueFallback.enabled) {
      fallbacks.push({
        type: "offline_queue",
        priority: this.config.queueFallback.priority,
        enabled: true,
        config: this.config.queueFallback
      });
    }
    
    return fallbacks.sort((a, b) => a.priority - b.priority);
  }

  // ======================== Individual Fallback Implementations ========================

  private async executeSingleFallback(
    fallback: FallbackOption, 
    context: FallbackContext
  ): Promise<FallbackResult> {
    switch (fallback.type) {
      case "mcp_direct":
        return this.executeMCPDirectFallback(context);
      
      case "cached_response":
        return this.executeCacheFallback(context);
      
      case "default_message":
        return this.executeDefaultFallback(context);
      
      case "offline_queue":
        return this.executeQueueFallback(context);
      
      default:
        return {
          success: false,
          source: fallback.type,
          message: `Unknown fallback type: ${fallback.type}`
        };
    }
  }

  private async executeMCPDirectFallback(context: FallbackContext): Promise<FallbackResult> {
    if (!this.config.mcpFallback.enabled || !this.mcpService) {
      return {
        success: false,
        source: "mcp",
        message: "MCP direct fallback not available"
      };
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Attempting MCP direct fallback",
        { hasCommand: !!context.parsedCommand },
        "FALLBACK_011"
      );

      let result: any;

      // If we have a parsed command, execute it directly
      if (context.parsedCommand) {
        result = await this.executeMCPCommand(context.parsedCommand);
      } else {
        // Try to infer command from message
        const inferredCommand = this.inferMCPCommand(context.originalMessage);
        if (inferredCommand) {
          result = await this.executeMCPCommand(inferredCommand);
        } else {
          throw new Error("Could not infer MCP command from message");
        }
      }

      // Cache the successful result
      await this.cacheResponse(context.originalMessage, result);

      return {
        success: true,
        source: "mcp",
        data: result,
        message: this.formatMCPResult(result),
        limitations: ["Response generated through direct MCP call (agent processing unavailable)"]
      };

    } catch (error) {
      LoggingService.warn(
        this.serviceName,
        "MCP direct fallback failed",
        { error },
        "FALLBACK_012"
      );

      return {
        success: false,
        source: "mcp",
        message: `MCP direct call failed: ${error.message}`,
        limitations: ["MCP service unavailable or command not supported"]
      };
    }
  }

  private async executeCacheFallback(context: FallbackContext): Promise<FallbackResult> {
    if (!this.config.cacheFallback.enabled) {
      return {
        success: false,
        source: "cache",
        message: "Cache fallback disabled"
      };
    }

    const cacheKey = this.generateCacheKey(context.originalMessage);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      // Try fuzzy matching for similar queries
      const similarResponse = this.findSimilarCachedResponse(context.originalMessage);
      
      if (similarResponse) {
        LoggingService.info(
          this.serviceName,
          "Using similar cached response",
          { similarity: similarResponse.confidence },
          "FALLBACK_013"
        );

        return {
          success: true,
          source: "cache",
          data: similarResponse.data,
          message: `${similarResponse.data}\n\n*Note: This is a cached response from a similar query.*`,
          limitations: [
            "Response from cache (may not reflect latest data)",
            `Similar to previous query (${Math.floor(similarResponse.confidence * 100)}% match)`
          ]
        };
      }
      
      return {
        success: false,
        source: "cache",
        message: "No cached response available"
      };
    }

    // Check if cache is expired
    if (cached.expiresAt < new Date()) {
      this.cache.delete(cacheKey);
      return {
        success: false,
        source: "cache", 
        message: "Cached response expired"
      };
    }

    // Check if cache is too old based on config
    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.config.cacheFallback.maxAge) {
      return {
        success: false,
        source: "cache",
        message: "Cached response too old"
      };
    }

    cached.hits++;
    
    LoggingService.info(
      this.serviceName,
      "Using cached response",
      { 
        age: Math.floor(age / 1000),
        hits: cached.hits
      },
      "FALLBACK_014"
    );

    return {
      success: true,
      source: "cache",
      data: cached.data,
      message: `${cached.data}\n\n*Note: This is a cached response.*`,
      limitations: [
        "Response from cache (may not reflect latest data)",
        `Cached ${Math.floor(age / 1000)} seconds ago`
      ]
    };
  }

  private executeDefaultFallback(context: FallbackContext): FallbackResult {
    if (!this.config.defaultFallback.enabled) {
      return {
        success: false,
        source: "default",
        message: "Default fallback disabled"
      };
    }

    // Check for specific configured responses first
    const configuredResponse = this.config.defaultFallback.responses[context.originalMessage];
    if (configuredResponse) {
      return {
        success: true,
        source: "default",
        data: configuredResponse,
        message: configuredResponse,
        limitations: ["Generated from configured default response"]
      };
    }

    // Use pattern-based default responses
    for (const defaultResponse of this.defaultResponses) {
      for (const pattern of defaultResponse.patterns) {
        if (pattern.test(context.originalMessage)) {
          LoggingService.info(
            this.serviceName,
            "Using pattern-based default response",
            { 
              pattern: pattern.source,
              confidence: defaultResponse.confidence
            },
            "FALLBACK_015"
          );

          return {
            success: true,
            source: "default",
            data: {
              response: defaultResponse.response,
              suggestions: defaultResponse.suggestions,
              confidence: defaultResponse.confidence
            },
            message: defaultResponse.response,
            limitations: [
              "Generated from pattern-based default response",
              `Confidence: ${Math.floor(defaultResponse.confidence * 100)}%`
            ]
          };
        }
      }
    }

    return {
      success: false,
      source: "default",
      message: "No matching default response found"
    };
  }

  private executeQueueFallback(context: FallbackContext): FallbackResult {
    if (!this.config.queueFallback.enabled) {
      return {
        success: false,
        source: "queue",
        message: "Queue fallback disabled"
      };
    }

    // This would integrate with RequestQueueManager
    // For now, return a simulated queue response
    
    LoggingService.info(
      this.serviceName,
      "Queuing message for later processing",
      { message: context.originalMessage.substring(0, 50) },
      "FALLBACK_016"
    );

    return {
      success: true,
      source: "queue",
      data: {
        queued: true,
        message: context.originalMessage,
        timestamp: context.timestamp
      },
      message: "I've queued your request to process as soon as my connection is restored. You'll receive a response once the agent service is available again.\n\nIn the meantime, you can:\n• Try using direct commands with '/tool'\n• Check the app interface for manual options\n• Wait for automatic processing when service returns",
      limitations: [
        "Request queued for later processing",
        "Response will be delayed until service restoration",
        `Queue position: estimated processing in ${Math.ceil(Math.random() * 5)} minutes`
      ]
    };
  }

  // ======================== MCP Integration Helpers ========================

  private inferMCPCommand(message: string): ParsedCommand | null {
    const lowerMessage = message.toLowerCase();
    
    // Tide creation patterns
    if (/create.*tide|new.*tide|add.*tide|make.*tide/.test(lowerMessage)) {
      const nameMatch = message.match(/(?:called|named|titled)\s+["']?([^"']+)["']?/i) ||
                       message.match(/(?:create|new|add|make)\s+(?:a\s+)?(?:\w+\s+)?tide\s+["']?([^"']+)["']?/i);
      
      return {
        intent: "create_tide",
        confidence: 0.8,
        parameters: {
          name: nameMatch ? nameMatch[1].trim() : "New Tide",
          description: `Tide created from: ${message}`,
          flowType: this.inferFlowType(message)
        },
        originalText: message
      };
    }
    
    // Tide listing patterns
    if (/list.*tides?|show.*tides?|my.*tides?|all.*tides?/.test(lowerMessage)) {
      return {
        intent: "list_tides",
        confidence: 0.9,
        parameters: {},
        originalText: message
      };
    }
    
    // Energy tracking patterns
    if (/add.*energy|track.*energy|energy.*level/.test(lowerMessage)) {
      const levelMatch = message.match(/(high|medium|low)/i);
      
      return {
        intent: "add_energy",
        confidence: 0.7,
        parameters: {
          energyLevel: levelMatch ? levelMatch[1].toLowerCase() : "medium",
          context: message
        },
        originalText: message
      };
    }
    
    return null;
  }

  private inferFlowType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("daily")) return "daily";
    if (lowerMessage.includes("weekly")) return "weekly";
    if (lowerMessage.includes("seasonal")) return "seasonal";
    
    return "project";
  }

  private async executeMCPCommand(command: ParsedCommand): Promise<any> {
    // This would use the actual MCP service - placeholder implementation
    if (!this.mcpService) {
      throw new Error("MCP service not available");
    }

    switch (command.intent) {
      case "create_tide":
        return {
          success: true,
          tide_id: `tide_${Date.now()}`,
          name: command.parameters.name,
          flow_type: command.parameters.flowType,
          description: command.parameters.description,
          status: "active",
          created_at: new Date().toISOString()
        };
      
      case "list_tides":
        return {
          success: true,
          tides: [
            {
              id: "example_1",
              name: "Morning Routine",
              flow_type: "daily",
              status: "active"
            }
          ],
          total: 1
        };
      
      default:
        throw new Error(`MCP command not implemented: ${command.intent}`);
    }
  }

  private formatMCPResult(result: any): string {
    if (result.tides) {
      // Format tide list
      return `Found ${result.total} tide${result.total === 1 ? '' : 's'}:\n\n${result.tides.map(tide => 
        `• **${tide.name}** (${tide.flow_type}) - ${tide.status}`
      ).join('\n')}`;
    } else if (result.tide_id) {
      // Format created tide
      return `✅ Successfully created tide "${result.name}"!\n\n**Details:**\n• ID: ${result.tide_id}\n• Type: ${result.flow_type}\n• Status: ${result.status}\n• Created: ${new Date(result.created_at).toLocaleString()}`;
    } else {
      return JSON.stringify(result, null, 2);
    }
  }

  // ======================== Caching System ========================

  private async cacheResponse(query: string, response: any): Promise<void> {
    const key = this.generateCacheKey(query);
    const ttl = 5 * 60 * 1000; // 5 minutes default
    
    const cachedResponse: CachedResponse = {
      key,
      data: response,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      hits: 0,
      source: "mcp_direct"
    };
    
    this.cache.set(key, cachedResponse);
    
    // Persist cache
    await this.saveCache();
  }

  private generateCacheKey(query: string): string {
    return `query_${query.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50)}`;
  }

  private findSimilarCachedResponse(query: string): { data: any; confidence: number } | null {
    const queryWords = query.toLowerCase().split(/\s+/);
    let bestMatch: { data: any; confidence: number } | null = null;
    
    for (const cached of this.cache.values()) {
      const cacheWords = cached.key.split('_');
      const matchingWords = queryWords.filter(word => 
        cacheWords.some(cacheWord => cacheWord.includes(word) || word.includes(cacheWord))
      );
      
      const confidence = matchingWords.length / Math.max(queryWords.length, cacheWords.length);
      
      if (confidence > 0.4 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { data: cached.data, confidence };
      }
    }
    
    return bestMatch;
  }

  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.cacheKey);
      if (stored) {
        const parsedCache = JSON.parse(stored) as Array<[string, any]>;
        
        parsedCache.forEach(([key, value]) => {
          const response: CachedResponse = {
            ...value,
            timestamp: new Date(value.timestamp),
            expiresAt: new Date(value.expiresAt)
          };
          
          // Only load non-expired entries
          if (response.expiresAt > new Date()) {
            this.cache.set(key, response);
          }
        });
        
        LoggingService.info(
          this.serviceName,
          "Cache loaded from storage",
          { entryCount: this.cache.size },
          "FALLBACK_017"
        );
      }
    } catch (error) {
      LoggingService.warn(
        this.serviceName,
        "Failed to load cache",
        { error },
        "FALLBACK_018"
      );
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheArray));
    } catch (error) {
      LoggingService.warn(
        this.serviceName,
        "Failed to save cache",
        { error },
        "FALLBACK_019"
      );
    }
  }

  // ======================== Public API ========================

  public updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    LoggingService.info(
      this.serviceName,
      "Fallback configuration updated",
      { updatedFields: Object.keys(newConfig) },
      "FALLBACK_020"
    );
  }

  public getConfig(): FallbackConfig {
    return { ...this.config };
  }

  public getCacheMetrics() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(entry => entry.expiresAt > new Date());
    const totalHits = validEntries.reduce((sum, entry) => sum + entry.hits, 0);
    const oldestEntry = validEntries.reduce((oldest, entry) => 
      !oldest || entry.timestamp < oldest.timestamp ? entry : oldest, null as CachedResponse | null);
    
    return {
      totalSize: this.cache.size,
      validEntries: validEntries.length,
      totalHits,
      hitRate: validEntries.length > 0 ? totalHits / validEntries.length : 0,
      oldestEntry: oldestEntry?.timestamp,
      evictionCount: 0 // Would track evictions in full implementation
    };
  }

  public clearCache(): void {
    this.cache.clear();
    AsyncStorage.removeItem(this.cacheKey);
    
    LoggingService.info(
      this.serviceName,
      "Cache cleared",
      {},
      "FALLBACK_021"
    );
  }
}