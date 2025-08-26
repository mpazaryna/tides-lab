// Basic API key authentication for Phase 1
// In production, this will validate against KV store

export interface AuthContext {
  userId: string;
  email?: string;
  keyId: string;
}

/**
 * Validates API key from Authorization header
 * Supports hybrid authentication:
 * - Legacy: tides_testuser_001-005 (existing tools/agents compatibility)
 * - React Native: tides_userId_randomId (mobile app compatibility)
 */
export async function validateApiKey(
  apiKey: string
): Promise<AuthContext | null> {
  // Only accept keys starting with "tides_"
  if (!apiKey || !apiKey.startsWith("tides_")) {
    return null;
  }

  // Extract parts from the API key format
  const parts = apiKey.split("_");

  // Legacy format: tides_testuser_001 -> testuser001
  if (parts.length === 3 && parts[1] === "testuser") {
    // Only accept the documented test keys: 001-005
    const keyNumber = parts[2];
    if (["001", "002", "003", "004", "005"].includes(keyNumber)) {
      const userId = parts[1] + parts[2]; // "testuser" + "001" = "testuser001"
      return {
        userId,
        email: `${userId}@example.com`,
        keyId: apiKey,
      };
    }
  }

  // React Native format: tides_userId_randomId (3+ parts supported)
  if (parts.length >= 3 && parts[1] !== "testuser") {
    const userId = parts[1];
    // Validate userId is non-empty and reasonable
    if (userId && userId.length > 0 && userId.length <= 50) {
      return {
        userId,
        email: `${userId}@mobile.tides.app`,
        keyId: apiKey,
      };
    }
  }

  // Reject all other keys (no fallback for invalid keys)
  return null;
}

/**
 * Authentication middleware for the request
 */
export async function authenticate(
  request: Request
): Promise<AuthContext | null> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return validateApiKey(token);
  }

  return null;
}
