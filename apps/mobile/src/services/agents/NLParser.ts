/**
 * Natural Language Parser
 * 
 * Advanced natural language processing for tide productivity commands.
 * Provides intent recognition, parameter extraction, command validation,
 * and confidence scoring for conversational agent interactions.
 * 
 * Features:
 * - Intent classification with confidence scoring
 * - Parameter extraction with type validation
 * - Context-aware parsing with conversation history
 * - Extensible pattern system with regex and keyword matching
 * - Command suggestions for failed parses
 * - Multi-language support foundations
 */

import { LoggingService } from '../LoggingService';
import type {
  ParsedCommand,
  CommandIntent,
  IntentPattern
} from '../../types/agents';

interface ParsingContext {
  conversationHistory?: string[];
  userId?: string;
  currentTideId?: string;
  timezone?: string;
  preferences?: Record<string, any>;
}

interface ParameterExtractor {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  patterns: RegExp[];
  enumValues?: string[];
  required: boolean;
  defaultValue?: any;
  validator?: (value: any) => boolean;
}

interface IntentClassifier {
  intent: CommandIntent;
  keywords: string[];
  patterns: RegExp[];
  parameters: ParameterExtractor[];
  examples: string[];
  confidence: number;
  contextDependency?: 'none' | 'tide' | 'user' | 'conversation';
}

export class NLParser {
  private serviceName = "NLParser";
  private classifiers: IntentClassifier[] = [];
  private initialized = false;

  constructor() {
    LoggingService.info(
      this.serviceName,
      "Natural language parser initialized",
      {},
      "NL_PARSER_001"
    );
  }

  // ======================== Initialization ========================

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Initializing natural language parser",
        {},
        "NL_PARSER_002"
      );

      this.initializeClassifiers();
      this.initialized = true;

      LoggingService.info(
        this.serviceName,
        "Natural language parser initialized successfully",
        { classifierCount: this.classifiers.length },
        "NL_PARSER_003"
      );

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to initialize natural language parser",
        { error },
        "NL_PARSER_004"
      );
      throw error;
    }
  }

  private initializeClassifiers(): void {
    this.classifiers = [
      // Tide Creation
      {
        intent: "create_tide",
        keywords: ["create", "new", "add", "make", "start", "begin", "tide"],
        patterns: [
          /create\s+(?:a\s+)?(?:new\s+)?tide/i,
          /new\s+tide/i,
          /add\s+(?:a\s+)?tide/i,
          /make\s+(?:a\s+)?(?:new\s+)?tide/i,
          /start\s+(?:a\s+)?(?:new\s+)?tide/i
        ],
        parameters: [
          {
            name: "name",
            type: "string",
            patterns: [
              /(?:called|named|titled)\s+["']?([^"']+)["']?/i,
              /tide\s+["']?([^"']+)["']?/i,
              /"([^"]+)"/,
              /'([^']+)'/
            ],
            required: true,
            defaultValue: "New Tide"
          },
          {
            name: "flowType",
            type: "enum",
            patterns: [
              /(daily|weekly|project|seasonal)/i
            ],
            enumValues: ["daily", "weekly", "project", "seasonal"],
            required: false,
            defaultValue: "project"
          },
          {
            name: "description",
            type: "string",
            patterns: [
              /(?:description|about|for)\s+["']?([^"']+)["']?/i,
              /that\s+(?:is\s+)?(?:about|for)\s+([^.!?]+)/i
            ],
            required: false,
            defaultValue: null
          }
        ],
        examples: [
          "Create a new tide called Morning Routine",
          "Add a daily tide named Exercise",
          "Make a project tide for my app development",
          "Start a new weekly tide called Team Meetings"
        ],
        confidence: 0.9,
        contextDependency: "user"
      },

      // Tide Listing
      {
        intent: "list_tides",
        keywords: ["list", "show", "display", "my", "all", "tides", "see"],
        patterns: [
          /(?:list|show|display)\s+(?:my\s+|all\s+)?tides?/i,
          /(?:what|which)\s+tides?\s+(?:do\s+i\s+have|are\s+there)/i,
          /my\s+tides?/i,
          /all\s+(?:my\s+)?tides?/i,
          /see\s+(?:my\s+)?tides?/i
        ],
        parameters: [
          {
            name: "status",
            type: "enum",
            patterns: [
              /(active|completed|paused|all)/i
            ],
            enumValues: ["active", "completed", "paused", "all"],
            required: false,
            defaultValue: "active"
          },
          {
            name: "type",
            type: "enum",
            patterns: [
              /(daily|weekly|project|seasonal)/i
            ],
            enumValues: ["daily", "weekly", "project", "seasonal"],
            required: false
          }
        ],
        examples: [
          "List my tides",
          "Show all active tides", 
          "Display my daily tides",
          "What tides do I have?"
        ],
        confidence: 0.95,
        contextDependency: "user"
      },

      // Flow Session Start
      {
        intent: "start_flow",
        keywords: ["start", "begin", "focus", "session", "flow", "work", "pomodoro"],
        patterns: [
          /start\s+(?:a\s+)?(?:focus\s+)?(?:flow\s+)?session/i,
          /begin\s+(?:a\s+)?(?:focus\s+)?(?:work\s+)?session/i,
          /(?:start|begin)\s+(?:working\s+on|focusing\s+on)/i,
          /(?:start|begin)\s+(?:a\s+)?\d+\s*(?:minute|min)/i,
          /pomodoro/i
        ],
        parameters: [
          {
            name: "duration",
            type: "number",
            patterns: [
              /(\d+)\s*(?:minute|min)/i,
              /for\s+(\d+)/i
            ],
            required: false,
            defaultValue: 25,
            validator: (value: number) => value > 0 && value <= 180
          },
          {
            name: "intensity",
            type: "enum",
            patterns: [
              /(low|moderate|high|intense)/i
            ],
            enumValues: ["low", "moderate", "high", "intense"],
            required: false,
            defaultValue: "moderate"
          },
          {
            name: "tideId",
            type: "string",
            patterns: [
              /(?:for|on)\s+["']?([^"']+)["']?\s+tide/i,
              /tide\s+["']?([^"']+)["']?/i
            ],
            required: false
          }
        ],
        examples: [
          "Start a focus session",
          "Begin a 25-minute work session",
          "Start working on my project tide",
          "Begin a high intensity session for 45 minutes"
        ],
        confidence: 0.85,
        contextDependency: "tide"
      },

      // Energy Addition
      {
        intent: "add_energy",
        keywords: ["add", "track", "record", "energy", "level", "feeling", "mood"],
        patterns: [
          /add\s+(?:my\s+)?energy\s+(?:level\s+)?(?:as\s+)?/i,
          /track\s+(?:my\s+)?energy/i,
          /record\s+(?:my\s+)?energy/i,
          /(?:i\s+(?:am\s+)?feeling|my\s+energy\s+is)\s+(high|medium|low)/i,
          /(high|medium|low)\s+energy/i
        ],
        parameters: [
          {
            name: "energyLevel",
            type: "enum",
            patterns: [
              /(high|medium|low|peak|good|okay|tired|exhausted)/i
            ],
            enumValues: ["high", "medium", "low"],
            required: true,
            validator: (value: string) => ["high", "medium", "low"].includes(value.toLowerCase())
          },
          {
            name: "context",
            type: "string",
            patterns: [
              /because\s+([^.!?]+)/i,
              /due\s+to\s+([^.!?]+)/i,
              /after\s+([^.!?]+)/i,
              /-\s*([^.!?]+)/
            ],
            required: false
          },
          {
            name: "tideId",
            type: "string",
            patterns: [
              /(?:to|for)\s+["']?([^"']+)["']?\s+tide/i
            ],
            required: false
          }
        ],
        examples: [
          "Add high energy to my project",
          "Track my energy as low after lunch", 
          "Record medium energy level",
          "I'm feeling high energy right now"
        ],
        confidence: 0.8,
        contextDependency: "tide"
      },

      // Task Linking
      {
        intent: "link_task",
        keywords: ["link", "connect", "attach", "add", "task", "item", "todo"],
        patterns: [
          /link\s+(?:a\s+)?task/i,
          /connect\s+(?:a\s+)?task/i,
          /attach\s+(?:a\s+)?(?:task|item)/i,
          /add\s+(?:a\s+)?task\s+(?:to|link)/i
        ],
        parameters: [
          {
            name: "taskUrl",
            type: "string",
            patterns: [
              /(https?:\/\/[^\s]+)/i,
              /url\s+([^\s]+)/i
            ],
            required: true
          },
          {
            name: "taskTitle",
            type: "string",
            patterns: [
              /(?:title|called|named)\s+["']?([^"']+)["']?/i,
              /"([^"]+)"/,
              /'([^']+)'/
            ],
            required: true
          },
          {
            name: "taskType",
            type: "enum",
            patterns: [
              /(issue|pr|pull\s+request|ticket|card|task|bug|feature)/i
            ],
            enumValues: ["issue", "pull_request", "ticket", "card", "task", "bug", "feature"],
            required: false,
            defaultValue: "task"
          },
          {
            name: "tideId",
            type: "string",
            patterns: [
              /(?:to|with)\s+["']?([^"']+)["']?\s+tide/i
            ],
            required: false
          }
        ],
        examples: [
          "Link task https://github.com/repo/issues/123 called Bug Fix",
          "Connect a task named Feature Implementation to my project tide",
          "Add task https://trello.com/card/abc titled Design Review"
        ],
        confidence: 0.75,
        contextDependency: "tide"
      },

      // Report Generation
      {
        intent: "get_report",
        keywords: ["report", "summary", "analysis", "stats", "statistics", "progress"],
        patterns: [
          /(?:get|show|generate)\s+(?:a\s+)?report/i,
          /(?:show|give)\s+(?:me\s+)?(?:a\s+)?summary/i,
          /(?:my\s+)?(?:progress|stats|statistics)/i,
          /how\s+(?:am\s+i\s+doing|productive)/i,
          /analysis/i
        ],
        parameters: [
          {
            name: "format",
            type: "enum",
            patterns: [
              /(json|markdown|csv|text)/i,
              /(?:as|in)\s+(json|markdown|csv|text)/i
            ],
            enumValues: ["json", "markdown", "csv", "text"],
            required: false,
            defaultValue: "markdown"
          },
          {
            name: "period",
            type: "enum", 
            patterns: [
              /(today|yesterday|week|month|year)/i,
              /(?:this|last)\s+(week|month|year)/i
            ],
            enumValues: ["today", "yesterday", "week", "month", "year"],
            required: false,
            defaultValue: "week"
          },
          {
            name: "tideId",
            type: "string",
            patterns: [
              /for\s+["']?([^"']+)["']?\s+tide/i
            ],
            required: false
          }
        ],
        examples: [
          "Get a report for this week",
          "Show me my progress summary",
          "Generate analysis for my project tide",
          "How am I doing today?"
        ],
        confidence: 0.85,
        contextDependency: "user"
      },

      // Insights Request
      {
        intent: "get_insights", 
        keywords: ["insights", "recommendations", "suggestions", "advice", "tips", "improve"],
        patterns: [
          /(?:get|show|give)\s+(?:me\s+)?insights/i,
          /(?:any\s+)?recommendations/i,
          /(?:give\s+me\s+)?(?:some\s+)?suggestions/i,
          /(?:how\s+(?:can\s+i|to))\s+improve/i,
          /advice/i,
          /tips/i
        ],
        parameters: [
          {
            name: "focus",
            type: "enum",
            patterns: [
              /(productivity|energy|time|focus|workflow)/i,
              /about\s+(productivity|energy|time|focus|workflow)/i
            ],
            enumValues: ["productivity", "energy", "time", "focus", "workflow"],
            required: false,
            defaultValue: "productivity"
          },
          {
            name: "tideId",
            type: "string",
            patterns: [
              /for\s+["']?([^"']+)["']?\s+tide/i
            ],
            required: false
          }
        ],
        examples: [
          "Give me insights on my productivity",
          "Show recommendations for better energy management",
          "Any suggestions to improve my workflow?",
          "How can I improve my focus?"
        ],
        confidence: 0.8,
        contextDependency: "user"
      },

      // Tide Optimization
      {
        intent: "optimize_tide",
        keywords: ["optimize", "improve", "enhance", "better", "adjust", "tune"],
        patterns: [
          /optimize\s+(?:my\s+)?tide/i,
          /improve\s+(?:my\s+)?(?:tide|workflow)/i,
          /make\s+(?:my\s+)?tide\s+better/i,
          /adjust\s+(?:my\s+)?tide/i,
          /tune\s+(?:my\s+)?tide/i
        ],
        parameters: [
          {
            name: "tideId",
            type: "string",
            patterns: [
              /tide\s+["']?([^"']+)["']?/i,
              /["']?([^"']+)["']?\s+tide/i
            ],
            required: false
          },
          {
            name: "focus",
            type: "enum",
            patterns: [
              /for\s+(productivity|energy|time|focus|workflow)/i
            ],
            enumValues: ["productivity", "energy", "time", "focus", "workflow"],
            required: false
          }
        ],
        examples: [
          "Optimize my morning routine tide",
          "Improve my project workflow",
          "Make my daily tide better",
          "Adjust my tide for better productivity"
        ],
        confidence: 0.75,
        contextDependency: "tide"
      },

      // General Question
      {
        intent: "question",
        keywords: ["what", "how", "when", "where", "why", "which", "can", "will", "should"],
        patterns: [
          /^(?:what|how|when|where|why|which)\b/i,
          /\?$/,
          /^(?:can|will|should)\s+(?:i|you)\b/i,
          /help/i
        ],
        parameters: [
          {
            name: "topic",
            type: "enum",
            patterns: [
              /(tide|energy|flow|productivity|time|focus|workflow)/i
            ],
            enumValues: ["tide", "energy", "flow", "productivity", "time", "focus", "workflow"],
            required: false
          }
        ],
        examples: [
          "What is a tide?",
          "How do I track energy levels?",
          "Can you help me with productivity?",
          "What should I focus on today?"
        ],
        confidence: 0.6,
        contextDependency: "conversation"
      }
    ];
  }

  // ======================== Main Parsing Interface ========================

  public parseCommand(
    text: string, 
    context: ParsingContext = {}
  ): ParsedCommand {
    if (!this.initialized) {
      this.initialize();
    }

    const startTime = Date.now();
    const cleanText = this.preprocessText(text);
    
    LoggingService.debug(
      this.serviceName,
      "Parsing command",
      { 
        originalLength: text.length,
        cleanLength: cleanText.length,
        hasContext: Object.keys(context).length > 0
      },
      "NL_PARSER_005"
    );

    try {
      // Find matching classifiers
      const matches = this.findMatchingClassifiers(cleanText, context);
      
      if (matches.length === 0) {
        LoggingService.info(
          this.serviceName,
          "No intent matches found",
          { text: cleanText.substring(0, 50) },
          "NL_PARSER_006"
        );

        return {
          intent: "unknown",
          confidence: 0.1,
          parameters: {},
          originalText: text,
          alternatives: this.generateSuggestions(cleanText)
        };
      }

      // Select best match
      const bestMatch = this.selectBestMatch(matches, context);
      
      // Extract parameters
      const parameters = this.extractParameters(cleanText, bestMatch.classifier, context);
      
      // Build result
      const result: ParsedCommand = {
        intent: bestMatch.classifier.intent,
        confidence: bestMatch.confidence,
        parameters,
        originalText: text,
        alternatives: matches.slice(1, 4).map(match => ({
          intent: match.classifier.intent,
          confidence: match.confidence,
          parameters: this.extractParameters(cleanText, match.classifier, context),
          originalText: text
        }))
      };

      const processingTime = Date.now() - startTime;

      LoggingService.info(
        this.serviceName,
        "Command parsed successfully",
        {
          intent: result.intent,
          confidence: result.confidence,
          parameterCount: Object.keys(parameters).length,
          processingTime
        },
        "NL_PARSER_007"
      );

      return result;

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Command parsing failed",
        { error, text: cleanText.substring(0, 50) },
        "NL_PARSER_008"
      );

      return {
        intent: "unknown",
        confidence: 0.0,
        parameters: {},
        originalText: text
      };
    }
  }

  // ======================== Text Preprocessing ========================

  private preprocessText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Handle common contractions
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bit's\b/gi, 'it is')
      // Remove punctuation that doesn't affect meaning
      .replace(/[,;]/g, ' ')
      // Keep important punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ======================== Intent Classification ========================

  private findMatchingClassifiers(
    text: string, 
    context: ParsingContext
  ): Array<{ classifier: IntentClassifier; confidence: number; reasons: string[] }> {
    const matches: Array<{ classifier: IntentClassifier; confidence: number; reasons: string[] }> = [];
    
    for (const classifier of this.classifiers) {
      const match = this.evaluateClassifier(text, classifier, context);
      
      if (match.confidence > 0.1) { // Minimum threshold
        matches.push(match);
      }
    }
    
    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private evaluateClassifier(
    text: string,
    classifier: IntentClassifier, 
    context: ParsingContext
  ): { classifier: IntentClassifier; confidence: number; reasons: string[] } {
    let confidence = 0;
    const reasons: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Pattern matching (high weight)
    let patternMatches = 0;
    for (const pattern of classifier.patterns) {
      if (pattern.test(text)) {
        patternMatches++;
        confidence += 0.3;
        reasons.push(`Pattern match: ${pattern.source}`);
      }
    }
    
    // Keyword matching (medium weight)
    let keywordMatches = 0;
    for (const keyword of classifier.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywordMatches++;
        confidence += 0.1;
        reasons.push(`Keyword match: ${keyword}`);
      }
    }
    
    // Context dependency bonus
    if (classifier.contextDependency !== 'none') {
      const contextBonus = this.calculateContextBonus(classifier.contextDependency, context);
      confidence += contextBonus;
      if (contextBonus > 0) {
        reasons.push(`Context bonus: ${contextBonus.toFixed(2)}`);
      }
    }
    
    // Required parameter presence
    const requiredParams = classifier.parameters.filter(p => p.required);
    let foundRequired = 0;
    
    for (const param of requiredParams) {
      if (this.hasParameter(text, param)) {
        foundRequired++;
        confidence += 0.05;
        reasons.push(`Required parameter found: ${param.name}`);
      }
    }
    
    // Penalty for missing required parameters
    if (requiredParams.length > 0) {
      const requiredRatio = foundRequired / requiredParams.length;
      if (requiredRatio < 1) {
        confidence *= requiredRatio;
        reasons.push(`Missing required parameters: ${requiredParams.length - foundRequired}`);
      }
    }
    
    // Base classifier confidence
    confidence *= classifier.confidence;
    
    // Apply overall confidence normalization
    confidence = Math.min(confidence, 1.0);
    
    return { classifier, confidence, reasons };
  }

  private calculateContextBonus(
    dependency: 'none' | 'tide' | 'user' | 'conversation',
    context: ParsingContext
  ): number {
    switch (dependency) {
      case 'tide':
        return context.currentTideId ? 0.1 : -0.05;
      
      case 'user':
        return context.userId ? 0.05 : -0.02;
      
      case 'conversation':
        return context.conversationHistory?.length ? 0.05 : 0;
      
      default:
        return 0;
    }
  }

  private selectBestMatch(
    matches: Array<{ classifier: IntentClassifier; confidence: number; reasons: string[] }>,
    context: ParsingContext
  ): { classifier: IntentClassifier; confidence: number; reasons: string[] } {
    if (matches.length === 0) {
      throw new Error("No matches to select from");
    }
    
    // For now, just return highest confidence
    // In a more sophisticated system, we might consider context, user preferences, etc.
    return matches[0];
  }

  // ======================== Parameter Extraction ========================

  private extractParameters(
    text: string,
    classifier: IntentClassifier,
    context: ParsingContext
  ): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    for (const paramExtractor of classifier.parameters) {
      const value = this.extractParameter(text, paramExtractor, context);
      
      if (value !== null) {
        parameters[paramExtractor.name] = value;
      } else if (paramExtractor.required && paramExtractor.defaultValue !== undefined) {
        parameters[paramExtractor.name] = paramExtractor.defaultValue;
      }
    }
    
    return parameters;
  }

  private extractParameter(
    text: string,
    extractor: ParameterExtractor,
    context: ParsingContext
  ): any {
    // Try each pattern to extract the parameter
    for (const pattern of extractor.patterns) {
      const match = pattern.exec(text);
      
      if (match && match[1]) {
        let value = match[1].trim();
        
        // Type conversion and validation
        const convertedValue = this.convertParameterValue(value, extractor);
        
        if (convertedValue !== null) {
          LoggingService.debug(
            this.serviceName,
            "Parameter extracted",
            { 
              name: extractor.name,
              value: convertedValue,
              pattern: pattern.source
            },
            "NL_PARSER_009"
          );
          
          return convertedValue;
        }
      }
    }
    
    // Check for context-based defaults
    if (extractor.name === 'tideId' && context.currentTideId) {
      return context.currentTideId;
    }
    
    // Return default value if available
    return extractor.defaultValue || null;
  }

  private convertParameterValue(
    value: string,
    extractor: ParameterExtractor
  ): any {
    switch (extractor.type) {
      case 'string':
        return value;
      
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return null;
        }
        if (extractor.validator && !extractor.validator(numValue)) {
          return null;
        }
        return numValue;
      
      case 'boolean':
        const boolValue = ['true', 'yes', '1', 'on', 'enabled'].includes(value.toLowerCase());
        return boolValue;
      
      case 'enum':
        if (!extractor.enumValues) {
          return value;
        }
        
        const normalizedValue = value.toLowerCase();
        const enumMatch = extractor.enumValues.find(enumVal => 
          enumVal.toLowerCase() === normalizedValue ||
          enumVal.toLowerCase().includes(normalizedValue) ||
          normalizedValue.includes(enumVal.toLowerCase())
        );
        
        return enumMatch || null;
      
      case 'date':
        // Simple date parsing - could be enhanced
        const dateValue = new Date(value);
        return isNaN(dateValue.getTime()) ? null : dateValue;
      
      default:
        return value;
    }
  }

  private hasParameter(text: string, extractor: ParameterExtractor): boolean {
    return extractor.patterns.some(pattern => pattern.test(text));
  }

  // ======================== Suggestion Generation ========================

  private generateSuggestions(text: string): ParsedCommand[] {
    const suggestions: ParsedCommand[] = [];
    const lowerText = text.toLowerCase();
    
    // Generate suggestions based on partial keyword matches
    for (const classifier of this.classifiers) {
      let score = 0;
      
      // Check for partial keyword matches
      for (const keyword of classifier.keywords) {
        if (lowerText.includes(keyword.substring(0, Math.min(3, keyword.length)))) {
          score += 0.1;
        }
      }
      
      if (score > 0.05) {
        suggestions.push({
          intent: classifier.intent,
          confidence: score * 0.5, // Lower confidence for suggestions
          parameters: {},
          originalText: classifier.examples[0] || `Try: ${classifier.intent}`
        });
      }
    }
    
    // Sort and limit suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  // ======================== Utility Methods ========================

  public getIntentPatterns(): IntentPattern[] {
    return this.classifiers.map(classifier => ({
      intent: classifier.intent,
      patterns: classifier.patterns,
      requiredParams: classifier.parameters.filter(p => p.required).map(p => p.name),
      optionalParams: classifier.parameters.filter(p => !p.required).map(p => p.name),
      examples: classifier.examples
    }));
  }

  public getSupportedIntents(): CommandIntent[] {
    return this.classifiers.map(c => c.intent);
  }

  public getExamplesForIntent(intent: CommandIntent): string[] {
    const classifier = this.classifiers.find(c => c.intent === intent);
    return classifier?.examples || [];
  }

  public validateCommand(command: ParsedCommand): { valid: boolean; errors: string[] } {
    const classifier = this.classifiers.find(c => c.intent === command.intent);
    
    if (!classifier) {
      return { valid: false, errors: [`Unknown intent: ${command.intent}`] };
    }
    
    const errors: string[] = [];
    
    // Check required parameters
    for (const param of classifier.parameters.filter(p => p.required)) {
      if (!(param.name in command.parameters)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }
    }
    
    // Validate parameter values
    for (const [name, value] of Object.entries(command.parameters)) {
      const param = classifier.parameters.find(p => p.name === name);
      
      if (param && param.validator && !param.validator(value)) {
        errors.push(`Invalid value for parameter ${name}: ${value}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // ======================== Statistics and Monitoring ========================

  public getParsingStats() {
    return {
      classifierCount: this.classifiers.length,
      totalPatterns: this.classifiers.reduce((sum, c) => sum + c.patterns.length, 0),
      totalKeywords: this.classifiers.reduce((sum, c) => sum + c.keywords.length, 0),
      supportedIntents: this.classifiers.map(c => c.intent),
      initialized: this.initialized
    };
  }
}