import {
  TOOL_PHRASES,
  TOOL_METADATA,
  CONFIDENCE_THRESHOLD,
  DetectedTool,
  ToolPhrase,
} from "../config/toolPhrases";
import { loggingService } from "./loggingService";

interface DetectionCache {
  input: string;
  result: DetectedTool | null;
  timestamp: number;
}

class PhraseDetectionService {
  private static instance: PhraseDetectionService;
  private cache: Map<string, DetectionCache> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly MAX_CACHE_SIZE = 50;

  private constructor() {}

  static getInstance(): PhraseDetectionService {
    if (!PhraseDetectionService.instance) {
      PhraseDetectionService.instance = new PhraseDetectionService();
    }
    return PhraseDetectionService.instance;
  }

  /**
   * Detect tool intent from user input
   */
  detectToolIntent(input: string): DetectedTool | null {
    if (!input || input.trim().length < 3) {
      return null;
    }

    const normalizedInput = input.trim().toLowerCase();

    // Check cache first
    const cached = this.getCached(normalizedInput);
    if (cached !== undefined) {
      return cached;
    }

    // Find matching patterns
    const detectedTools: DetectedTool[] = [];

    for (const phrase of TOOL_PHRASES) {
      for (const pattern of phrase.patterns) {
        const match = input.match(pattern);
        if (match) {
          const metadata = TOOL_METADATA[phrase.toolId];
          if (!metadata) continue;

          // Calculate confidence based on match quality
          const confidence = this.calculateConfidence(input, match[0], phrase);
          
          if (confidence >= CONFIDENCE_THRESHOLD) {
            const extractedParams = phrase.extractParams ? phrase.extractParams(match) : {};
            
            detectedTools.push({
              toolId: phrase.toolId,
              metadata,
              confidence,
              extractedParams,
              matchedPattern: pattern.source,
            });
            
            // Break after first pattern match for this tool
            break;
          }
        }
      }
    }

    // Sort by confidence and priority
    detectedTools.sort((a, b) => {
      // First by confidence
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // Then by priority (from phrase config)
      const aPriority = TOOL_PHRASES.find(p => p.toolId === a.toolId)?.priority || 0;
      const bPriority = TOOL_PHRASES.find(p => p.toolId === b.toolId)?.priority || 0;
      return bPriority - aPriority;
    });

    const result = detectedTools.length > 0 ? detectedTools[0] : null;

    // Cache the result
    this.cacheResult(normalizedInput, result);

    if (result) {
      loggingService.info("PhraseDetection", "Tool intent detected", {
        input: input.substring(0, 50),
        toolId: result.toolId,
        confidence: result.confidence,
        extractedParams: result.extractedParams,
      });
    }

    return result;
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(input: string, matchedText: string, phrase: ToolPhrase): number {
    const normalizedInput = input.trim().toLowerCase();
    const normalizedMatch = matchedText.toLowerCase();

    // Base confidence from match coverage
    const coverage = normalizedMatch.length / normalizedInput.length;
    let confidence = Math.min(coverage, 1.0);

    // Boost if match is at the beginning
    if (normalizedInput.startsWith(normalizedMatch)) {
      confidence += 0.1;
    }

    // Boost for exact match
    if (normalizedInput === normalizedMatch) {
      confidence = 1.0;
    }

    // Slight penalty for very short inputs (might be incomplete)
    if (normalizedInput.length < 10) {
      confidence *= 0.9;
    }

    // Apply priority weight
    const priorityBoost = (phrase.priority || 5) / 20; // 0 to 0.5 boost
    confidence = Math.min(confidence + priorityBoost, 1.0);

    return confidence;
  }

  /**
   * Get similar tools for fuzzy matching
   */
  getSimilarTools(input: string, threshold: number = 0.5): DetectedTool[] {
    if (!input || input.trim().length < 3) {
      return [];
    }

    const normalizedInput = input.trim().toLowerCase();
    const detectedTools: DetectedTool[] = [];

    // Check each tool's name and keywords
    for (const [toolId, metadata] of Object.entries(TOOL_METADATA)) {
      const toolName = metadata.name.toLowerCase();
      const toolDesc = metadata.description.toLowerCase();
      
      // Simple fuzzy matching based on containment
      let confidence = 0;
      
      // Check if input contains tool name or vice versa
      if (normalizedInput.includes(toolName) || toolName.includes(normalizedInput)) {
        confidence = 0.6;
      }
      
      // Check individual words
      const inputWords = normalizedInput.split(/\s+/);
      const toolWords = toolName.split(/\s+/);
      
      for (const inputWord of inputWords) {
        for (const toolWord of toolWords) {
          if (inputWord.length > 3 && toolWord.includes(inputWord)) {
            confidence = Math.max(confidence, 0.5);
          }
          if (toolWord.length > 3 && inputWord.includes(toolWord)) {
            confidence = Math.max(confidence, 0.5);
          }
        }
      }
      
      // Check description
      if (toolDesc.includes(normalizedInput)) {
        confidence = Math.max(confidence, 0.4);
      }
      
      if (confidence >= threshold) {
        detectedTools.push({
          toolId,
          metadata,
          confidence,
        });
      }
    }

    return detectedTools.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if input is likely a command (vs regular conversation)
   */
  isLikelyCommand(input: string): boolean {
    const commandIndicators = [
      /^(create|make|start|add|show|list|view|get|generate|analyze|link|connect)/i,
      /^(my\s+)?(tide|flow|energy|task|report|insights|recommendations)/i,
      /^(refresh|update|record|track)/i,
    ];

    return commandIndicators.some(pattern => pattern.test(input.trim()));
  }

  /**
   * Cache management
   */
  private getCached(input: string): DetectedTool | null | undefined {
    const cached = this.cache.get(input);
    if (!cached) return undefined;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(input);
      return undefined;
    }

    return cached.result;
  }

  private cacheResult(input: string, result: DetectedTool | null): void {
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(input, {
      input,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the detection cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const phraseDetectionService = PhraseDetectionService.getInstance();