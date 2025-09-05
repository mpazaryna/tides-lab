/**
 * Jest test setup for Cloudflare Workers environment
 */

// Global test utilities and mocks
global.console = {
  ...console,
  // Suppress expected errors in tests unless explicitly testing error conditions
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock crypto for API key generation in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
    subtle: {
      digest: async (algorithm: string, data: BufferSource) => {
        // Simple mock for SHA-256 hashing - return deterministic hash
        const text = new TextDecoder().decode(data);
        // Create a simple deterministic hash for testing
        let hash = '';
        for (let i = 0; i < text.length; i++) {
          hash += text.charCodeAt(i).toString(16).padStart(2, '0');
        }
        // Pad to 64 characters (256 bits / 8 bits per byte * 2 hex chars per byte)
        hash = (hash + '0'.repeat(64)).substring(0, 64);
        
        // Convert to ArrayBuffer
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes.buffer;
      }
    }
  }
});

// Test timeout for async operations
jest.setTimeout(10000);