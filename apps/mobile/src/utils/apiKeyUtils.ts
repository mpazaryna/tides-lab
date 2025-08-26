/**
 * API Key Utilities for Tides Mobile App
 * 
 * Provides centralized functionality for working with API keys
 * in the format: tides_userId_randomId
 */

/**
 * Extract user ID from API key
 * @param apiKey API key in format: tides_userId_randomId
 * @returns User ID (UUID) or null if invalid format
 */
export function extractUserIdFromApiKey(apiKey: string): string | null {
  if (!apiKey) return null;
  
  // Check if API key is in new format: tides_userId_randomId
  const match = apiKey.match(/^tides_([a-f0-9-]{36})_[a-z0-9]{6}$/i);
  if (match) {
    return match[1]; // Return the userId part
  }
  
  return null;
}

/**
 * Validate API key format
 * @param apiKey API key to validate
 * @returns Object with validation results
 */
export function validateApiKeyFormat(apiKey: string): {
  isValid: boolean;
  isNewFormat: boolean;
  userId?: string;
} {
  if (!apiKey) {
    return {
      isValid: false,
      isNewFormat: false,
    };
  }
  
  // Check new format: tides_userId_randomId
  const newFormatMatch = apiKey.match(/^tides_([a-f0-9-]{36})_[a-z0-9]{6}$/i);
  if (newFormatMatch) {
    return {
      isValid: true,
      isNewFormat: true,
      userId: newFormatMatch[1],
    };
  }
  
  return {
    isValid: false,
    isNewFormat: false,
  };
}

/**
 * Generate a new API key for a user
 * @param userId User ID (UUID)
 * @returns API key in format: tides_userId_randomId
 */
export function generateApiKey(userId: string): string {
  // Generate a random suffix for uniqueness (6 chars)
  const randomId = Math.random().toString(36).substring(2, 8);
  // Format: tides_userId_randomId (per server auth requirements)
  return `tides_${userId}_${randomId}`;
}

/**
 * Mask an API key for logging purposes
 * @param apiKey API key to mask
 * @returns Masked API key showing only prefix and suffix
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return 'null';
  if (apiKey.length <= 20) return apiKey.substring(0, 8) + '...';
  
  const prefix = apiKey.substring(0, 15);
  const suffix = apiKey.substring(apiKey.length - 10);
  return `${prefix}...${suffix}`;
}