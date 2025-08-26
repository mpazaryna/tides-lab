/**
 * Utility functions for parsing confidence scores and priorities from AI responses
 */

/**
 * Parse confidence score from AI response text
 * Looks for patterns like "Confidence: 0.85" or "confidence score of 85%"
 */
export function parseConfidenceScore(response: string): number {
  if (!response || typeof response !== 'string') {
    return 0.5; // Default confidence
  }

  // Look for explicit confidence patterns
  const patterns = [
    /confidence[:\s]+([0-9.]+)/i,
    /([0-9.]+)\s*confidence/i,
    /confidence\s+score[:\s]+([0-9.]+)/i,
    /([0-9]{1,2})%\s+confident/i
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      
      // Handle percentage vs decimal
      if (value > 1 && value <= 100) {
        return value / 100;
      } else if (value >= 0 && value <= 1) {
        return value;
      }
    }
  }

  // Heuristic confidence based on language patterns
  return calculateHeuristicConfidence(response);
}

/**
 * Calculate priority level based on urgency keywords in response
 */
export function calculateInsightPriority(insights: string): number {
  if (!insights || typeof insights !== 'string') {
    return 5; // Default priority
  }

  const lowercaseInsights = insights.toLowerCase();

  // High priority keywords
  if (lowercaseInsights.includes('urgent') || 
      lowercaseInsights.includes('critical') ||
      lowercaseInsights.includes('immediate')) {
    return 10;
  }

  // Medium-high priority
  if (lowercaseInsights.includes('important') || 
      lowercaseInsights.includes('significant') ||
      lowercaseInsights.includes('recommend')) {
    return 7;
  }

  // Medium priority
  if (lowercaseInsights.includes('should') || 
      lowercaseInsights.includes('consider') ||
      lowercaseInsights.includes('suggest')) {
    return 6;
  }

  // Default priority
  return 5;
}

/**
 * Check if insights contain actionable recommendations
 */
export function hasActionableRecommendations(insights: string): boolean {
  if (!insights || typeof insights !== 'string') {
    return false;
  }

  const actionWords = [
    'should', 'consider', 'try', 'recommend', 'suggest', 
    'optimize', 'adjust', 'increase', 'decrease', 'focus',
    'schedule', 'plan', 'implement', 'change'
  ];

  const lowercaseInsights = insights.toLowerCase();
  return actionWords.some(word => lowercaseInsights.includes(word));
}

/**
 * Calculate heuristic confidence based on language patterns
 */
function calculateHeuristicConfidence(response: string): number {
  const lowercaseResponse = response.toLowerCase();
  let confidence = 0.5; // Base confidence

  // Positive indicators
  if (lowercaseResponse.includes('based on the data') || 
      lowercaseResponse.includes('analysis shows')) {
    confidence += 0.2;
  }

  if (lowercaseResponse.includes('consistently') || 
      lowercaseResponse.includes('pattern')) {
    confidence += 0.15;
  }

  if (lowercaseResponse.includes('specific') || 
      lowercaseResponse.includes('actionable')) {
    confidence += 0.1;
  }

  // Negative indicators (uncertainty language)
  if (lowercaseResponse.includes('might') || 
      lowercaseResponse.includes('possibly') ||
      lowercaseResponse.includes('unclear')) {
    confidence -= 0.2;
  }

  if (lowercaseResponse.includes('insufficient data') ||
      lowercaseResponse.includes('limited information')) {
    confidence -= 0.3;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}