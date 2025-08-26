/**
 * @fileoverview Tool Detection Utility
 * 
 * Detects tool suggestions based on keywords/triggers from toolsConfig.ts
 * Provides smart matching with confidence scores for user input.
 */

import { TOOLS_CONFIG, type ToolId } from "../config/toolsConfig";

export interface DetectedToolSuggestion {
  toolId: ToolId;
  title: string;
  description: string;
  category: string;
  confidence: number;
  matchedTriggers: string[];
}

/**
 * Detect tool suggestions from user input text
 */
export function detectToolSuggestions(inputText: string): DetectedToolSuggestion[] {
  if (!inputText.trim()) {
    return [];
  }

  const suggestions: DetectedToolSuggestion[] = [];
  const normalizedInput = inputText.toLowerCase().trim();

  // Check each tool for trigger matches
  Object.entries(TOOLS_CONFIG).forEach(([toolId, config]) => {
    const triggers = config.triggers || [];
    const matchedTriggers: string[] = [];
    let totalScore = 0;

    // Check title match (highest weight)
    const titleMatch = checkTextMatch(normalizedInput, config.title.toLowerCase());
    if (titleMatch.matched) {
      matchedTriggers.push(config.title);
      totalScore += titleMatch.score * 1.0; // Full weight for title
    }

    // Check trigger phrases
    triggers.forEach(trigger => {
      const triggerMatch = checkTextMatch(normalizedInput, trigger.toLowerCase());
      if (triggerMatch.matched) {
        matchedTriggers.push(trigger);
        totalScore += triggerMatch.score * 0.8; // Lower weight for triggers
      }
    });

    // If we found matches, add to suggestions
    if (matchedTriggers.length > 0) {
      const confidence = Math.min(totalScore / matchedTriggers.length, 1.0);
      
      suggestions.push({
        toolId: toolId as ToolId,
        title: config.title,
        description: config.description,
        category: config.category,
        confidence,
        matchedTriggers,
      });
    }
  });

  // Sort by confidence (highest first) and return top matches
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Limit to top 3 suggestions
}

/**
 * Check if input text matches a target phrase with scoring
 */
function checkTextMatch(input: string, target: string): { matched: boolean; score: number } {
  // Exact match (highest score)
  if (input === target) {
    return { matched: true, score: 1.0 };
  }

  // Contains full phrase (high score)
  if (input.includes(target)) {
    return { matched: true, score: 0.9 };
  }

  // Check if input starts with target (good score)
  if (input.startsWith(target)) {
    return { matched: true, score: 0.8 };
  }

  // Check if target starts with input (partial match)
  if (target.startsWith(input)) {
    return { matched: true, score: 0.7 };
  }

  // Word-level matching
  const inputWords = input.split(/\s+/);
  const targetWords = target.split(/\s+/);
  
  // Check if all input words are in target
  const inputWordsInTarget = inputWords.every(word => 
    targetWords.some(targetWord => 
      targetWord.includes(word) || word.includes(targetWord)
    )
  );

  if (inputWordsInTarget && inputWords.length > 0) {
    const matchRatio = inputWords.length / targetWords.length;
    return { matched: true, score: Math.min(matchRatio * 0.6, 0.6) };
  }

  // Check for any word matches (lower score)
  const commonWords = inputWords.filter(word => 
    word.length > 2 && // Skip short words
    targetWords.some(targetWord => 
      targetWord.includes(word) || word.includes(targetWord)
    )
  );

  if (commonWords.length > 0) {
    const matchRatio = commonWords.length / Math.max(inputWords.length, targetWords.length);
    return { matched: true, score: Math.min(matchRatio * 0.4, 0.4) };
  }

  return { matched: false, score: 0 };
}

/**
 * Check if input exactly matches a tool title (for overlay highlighting)
 * Returns the user's exact input that matches, preserving their capitalization
 */
export function isExactToolTitle(input: string): string | null {
  if (!input.trim()) {
    return null;
  }

  const normalizedInput = input.toLowerCase().trim();
  
  // Check if input starts with any tool title
  for (const [_toolId, config] of Object.entries(TOOLS_CONFIG)) {
    const toolTitle = config.title.toLowerCase();
    if (normalizedInput.startsWith(toolTitle)) {
      // Return the user's exact input for the tool title portion, preserving their capitalization
      return input.substring(0, config.title.length);
    }
  }
  
  return null;
}

/**
 * Extract tool title from input if it starts with a tool title
 */
export function extractToolTitle(input: string): string | null {
  return isExactToolTitle(input);
}