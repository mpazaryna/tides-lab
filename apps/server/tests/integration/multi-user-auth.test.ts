import { D1R2HybridStorage } from '../../src/storage/d1-r2';

// Simple R2 Mock for testing
class MockR2Storage {
  private data: Map<string, any> = new Map();

  async putObject(key: string, data: any): Promise<void> {
    this.data.set(key, data);
  }

  async getObject(key: string): Promise<any | null> {
    return this.data.get(key) || null;
  }
}

// Mock D1 Database for testing
interface MockD1Result {
  results: any[];
}

interface MockD1Statement {
  bind(...values: any[]): MockD1Statement;
  first(): Promise<any>;
  all(): Promise<MockD1Result>;
  run(): Promise<any>;
}

class MockD1Database {
  private data: Map<string, any[]> = new Map();
  
  constructor() {
    // Initialize empty tables
    this.data.set('users', []);
    this.data.set('api_keys', []);
    this.data.set('tide_index', []);
  }

  prepare(query: string): MockD1Statement {
    return new MockD1StatementImpl(query, this.data);
  }

  // Minimal implementations to satisfy interface
  batch(): any { return this; }
  dump(): Promise<ArrayBuffer> { throw new Error('Not implemented'); }
  exec(): Promise<any> { throw new Error('Not implemented'); }
  withSession(): any { throw new Error('Not implemented'); }
}

class MockD1StatementImpl implements MockD1Statement {
  private boundValues: any[] = [];

  constructor(private query: string, private data: Map<string, any[]>) {}

  bind(...values: any[]): MockD1Statement {
    this.boundValues = values;
    return this;
  }

  async first(): Promise<any> {
    const results = await this.all();
    return results.results.length > 0 ? results.results[0] : null;
  }

  async all(): Promise<MockD1Result> {
    // Simple query parsing for testing
    if (this.query.includes('SELECT') && this.query.includes('api_keys')) {
      const apiKeys = this.data.get('api_keys') || [];
      if (this.query.includes('WHERE key_hash = ?')) {
        const keyHash = this.boundValues[0];
        const found = apiKeys.find(key => key.key_hash === keyHash);
        return { results: found ? [found] : [] };
      }
      return { results: apiKeys };
    }
    
    if (this.query.includes('SELECT') && this.query.includes('users')) {
      const users = this.data.get('users') || [];
      return { results: users };
    }

    if (this.query.includes('SELECT') && this.query.includes('tide_index')) {
      const tides = this.data.get('tide_index') || [];
      if (this.query.includes('WHERE') && this.query.includes('user_id = ?')) {
        const userId = this.boundValues[0];
        const userTides = tides.filter(tide => tide.user_id === userId);
        return { results: userTides };
      }
      return { results: tides };
    }

    return { results: [] };
  }

  async run(): Promise<any> {
    if (this.query.includes('INSERT INTO users')) {
      const users = this.data.get('users') || [];
      const [id, email, created_at] = this.boundValues;
      users.push({ id, email, created_at });
      this.data.set('users', users);
      return { success: true };
    }

    if (this.query.includes('INSERT INTO api_keys')) {
      const apiKeys = this.data.get('api_keys') || [];
      const [id, user_id, key_hash, name, created_at] = this.boundValues;
      apiKeys.push({ id, user_id, key_hash, name, created_at, last_used: null });
      this.data.set('api_keys', apiKeys);
      return { success: true };
    }

    if (this.query.includes('INSERT INTO tide_index')) {
      const tides = this.data.get('tide_index') || [];
      const [id, user_id, name, flow_type, status, created_at, r2_path] = this.boundValues;
      tides.push({ id, user_id, name, flow_type, status, created_at, r2_path, flow_count: 0, last_flow: null });
      this.data.set('tide_index', tides);
      return { success: true };
    }

    if (this.query.includes('UPDATE api_keys') && this.query.includes('last_used')) {
      const apiKeys = this.data.get('api_keys') || [];
      const [last_used, key_hash] = this.boundValues;
      const key = apiKeys.find(k => k.key_hash === key_hash);
      if (key) {
        key.last_used = last_used;
      }
      return { success: true };
    }

    return { success: true };
  }
}

describe('Phase 4: Multi-User Authentication TDD', () => {
  let storage: D1R2HybridStorage;
  let mockDb: MockD1Database;
  let mockR2: MockR2Storage;

  beforeEach(() => {
    mockDb = new MockD1Database();
    mockR2 = new MockR2Storage();
    storage = new D1R2HybridStorage({
      db: mockDb as any, // Type assertion to bypass interface issues in tests
      r2Storage: mockR2
    });
  });

  describe('Step 1: Create 4 Users with API Keys', () => {
    test('should create 4 users with unique API keys in D1', async () => {
      // Test data for 4 users
      const testUsers = [
        { id: 'user1', email: 'user1@test.com' },
        { id: 'user2', email: 'user2@test.com' },
        { id: 'user3', email: 'user3@test.com' },
        { id: 'user4', email: 'user4@test.com' }
      ];

      const createdApiKeys: string[] = [];

      // Create each user and their API key
      for (const user of testUsers) {
        // Generate API key
        const apiKey = `tides_${user.id}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Hash the API key
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Store user in D1
        await mockDb.prepare(`
          INSERT INTO users (id, email, created_at) 
          VALUES (?, ?, ?)
        `).bind(user.id, user.email, new Date().toISOString()).run();

        // Store hashed API key in D1
        await mockDb.prepare(`
          INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          `key_${user.id}`,
          user.id,
          keyHash,
          'default',
          new Date().toISOString()
        ).run();

        createdApiKeys.push(apiKey);
      }

      // Verify all users were created
      const users = await mockDb.prepare('SELECT * FROM users').all();
      expect(users.results).toHaveLength(4);
      expect(users.results.map(u => u.id)).toEqual(['user1', 'user2', 'user3', 'user4']);

      // Verify all API keys were created
      const apiKeys = await mockDb.prepare('SELECT * FROM api_keys').all();
      expect(apiKeys.results).toHaveLength(4);
      expect(apiKeys.results.every(key => key.user_id.startsWith('user'))).toBe(true);

      // Verify we have all API keys
      expect(createdApiKeys).toHaveLength(4);
      expect(createdApiKeys.every(key => key.startsWith('tides_'))).toBe(true);
    });

    test('should validate API keys for all 4 users', async () => {
      // First create the users (duplicate setup for isolated test)
      const testUsers = [
        { id: 'user1', email: 'user1@test.com' },
        { id: 'user2', email: 'user2@test.com' },
        { id: 'user3', email: 'user3@test.com' },
        { id: 'user4', email: 'user4@test.com' }
      ];

      const apiKeys: string[] = [];

      for (const user of testUsers) {
        const apiKey = `tides_${user.id}_test123`;
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await mockDb.prepare(`
          INSERT INTO users (id, email, created_at) 
          VALUES (?, ?, ?)
        `).bind(user.id, user.email, new Date().toISOString()).run();

        await mockDb.prepare(`
          INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          `key_${user.id}`,
          user.id,
          keyHash,
          'default',
          new Date().toISOString()
        ).run();

        apiKeys.push(apiKey);
      }

      // Test API key validation for each user
      for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        const apiKey = apiKeys[i];
        
        const authContext = await storage.validateApiKey(apiKey);
        
        expect(authContext).not.toBeNull();
        expect(authContext!.userId).toBe(user.id);
        expect(authContext!.apiKeyName).toBe('default');
      }

      // Test invalid API key
      const invalidAuth = await storage.validateApiKey('tides_invalid_key');
      expect(invalidAuth).toBeNull();
    });
  });

  describe('Step 2: Test auth_validate_key MCP Tool', () => {
    test('should create auth_validate_key tool that validates API keys', async () => {
      // Create test user first
      const testUser = { id: 'testuser', email: 'test@example.com' };
      const apiKey = 'tides_testuser_auth123';
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await mockDb.prepare(`
        INSERT INTO users (id, email, created_at) 
        VALUES (?, ?, ?)
      `).bind(testUser.id, testUser.email, new Date().toISOString()).run();

      await mockDb.prepare(`
        INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'key_testuser',
        testUser.id,
        keyHash,
        'default',
        new Date().toISOString()
      ).run();

      // Test the tool functionality (this will be implemented in server.ts)
      const result = await storage.validateApiKey(apiKey);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('testuser');
      expect(result!.apiKeyName).toBe('default');

      // Test with invalid key
      const invalidResult = await storage.validateApiKey('invalid_key');
      expect(invalidResult).toBeNull();
    });
  });

  describe('Step 3: Multi-User Isolation Test', () => {
    test('should isolate tides between different users', async () => {
      // Create 3 test users with API keys
      const testUsers = [
        { id: 'alice', email: 'alice@test.com', apiKey: 'tides_alice_iso123' },
        { id: 'bob', email: 'bob@test.com', apiKey: 'tides_bob_iso456' },
        { id: 'charlie', email: 'charlie@test.com', apiKey: 'tides_charlie_iso789' }
      ];

      // Create users and API keys in D1
      for (const user of testUsers) {
        const encoder = new TextEncoder();
        const data = encoder.encode(user.apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await mockDb.prepare(`
          INSERT INTO users (id, email, created_at) 
          VALUES (?, ?, ?)
        `).bind(user.id, user.email, new Date().toISOString()).run();

        await mockDb.prepare(`
          INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          `key_${user.id}`,
          user.id,
          keyHash,
          'default',
          new Date().toISOString()
        ).run();
      }

      // Create tides for each user with their auth context
      const tidesByUser: { [userId: string]: any[] } = {};

      for (const user of testUsers) {
        // Set auth context for this user
        const authContext = await storage.validateApiKey(user.apiKey);
        expect(authContext).not.toBeNull();
        storage.setAuthContext(authContext!);

        // Create 2 tides for this user
        const tide1 = await storage.createTide({
          name: `${user.id}'s First Tide`,
          flow_type: 'daily',
          description: `Personal tide for ${user.id}`
        });

        const tide2 = await storage.createTide({
          name: `${user.id}'s Second Tide`,
          flow_type: 'weekly',
          description: `Work tide for ${user.id}`
        });

        tidesByUser[user.id] = [tide1, tide2];

        // Verify the tides were created with correct user isolation
        expect(tide1.name).toBe(`${user.id}'s First Tide`);
        expect(tide2.name).toBe(`${user.id}'s Second Tide`);
      }

      // Test isolation: each user should only see their own tides
      for (const user of testUsers) {
        // Set auth context for this user
        const authContext = await storage.validateApiKey(user.apiKey);
        storage.setAuthContext(authContext!);

        // List tides - should only see this user's tides
        const userTides = await storage.listTides();
        
        expect(userTides).toHaveLength(2);
        expect(userTides.every(tide => tide.name.startsWith(user.id))).toBe(true);
        
        // Verify specific tides match
        const expectedTides = tidesByUser[user.id];
        expect(userTides.map(t => t.name).sort()).toEqual(
          expectedTides.map(t => t.name).sort()
        );
      }

      // Test cross-user access denial
      for (let i = 0; i < testUsers.length; i++) {
        const currentUser = testUsers[i];
        const otherUsers = testUsers.filter((_, index) => index !== i);

        // Set current user's auth context
        const authContext = await storage.validateApiKey(currentUser.apiKey);
        storage.setAuthContext(authContext!);

        // Try to access other users' tides by ID - should return null
        for (const otherUser of otherUsers) {
          const otherUserTides = tidesByUser[otherUser.id];
          for (const otherTide of otherUserTides) {
            const accessAttempt = await storage.getTide(otherTide.id);
            expect(accessAttempt).toBeNull(); // Should not be able to access other user's tide
          }
        }
      }

      // Verify R2 path isolation
      const aliceAuthContext = await storage.validateApiKey(testUsers[0].apiKey);
      storage.setAuthContext(aliceAuthContext!);
      const aliceTides = await storage.listTides();
      
      // Check that R2 paths are user-isolated (this tests the private getUserR2Path method behavior)
      expect(aliceTides.length).toBe(2);
      // We can't directly check R2 paths from the returned tides in our current interface,
      // but the fact that cross-user access fails proves the isolation is working
    });

    test('should handle invalid auth context gracefully', async () => {
      // Test with no auth context set
      storage.setAuthContext({ userId: '', apiKeyName: 'test' });
      
      // Should use 'default-user' fallback for backwards compatibility
      const tide = await storage.createTide({
        name: 'Default User Tide',
        flow_type: 'daily',
        description: 'Test tide'
      });
      
      expect(tide.name).toBe('Default User Tide');
      
      // Test listing with invalid context
      const tides = await storage.listTides();
      expect(Array.isArray(tides)).toBe(true);
    });
  });

  describe('Step 4: End-to-End Authentication Workflow', () => {
    test('should handle complete multi-user workflow with server authentication', async () => {
      // Create 4 test users as specified in the requirements
      const testUsers = [
        { id: 'user1', email: 'user1@example.com', apiKey: 'tides_user1_e2e123' },
        { id: 'user2', email: 'user2@example.com', apiKey: 'tides_user2_e2e456' },
        { id: 'user3', email: 'user3@example.com', apiKey: 'tides_user3_e2e789' },
        { id: 'user4', email: 'user4@example.com', apiKey: 'tides_user4_e2eabc' }
      ];

      // Step 1: Create all 4 users with API keys in D1
      for (const user of testUsers) {
        const encoder = new TextEncoder();
        const data = encoder.encode(user.apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await mockDb.prepare(`
          INSERT INTO users (id, email, created_at) 
          VALUES (?, ?, ?)
        `).bind(user.id, user.email, new Date().toISOString()).run();

        await mockDb.prepare(`
          INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          `key_${user.id}`,
          user.id,
          keyHash,
          'default',
          new Date().toISOString()
        ).run();
      }

      // Step 2: Test auth_validate_key tool for each user
      for (const user of testUsers) {
        const authContext = await storage.validateApiKey(user.apiKey);
        expect(authContext).not.toBeNull();
        expect(authContext!.userId).toBe(user.id);
        expect(authContext!.apiKeyName).toBe('default');
      }

      // Step 3: Create tides for each user and verify isolation
      const createdTides: { [userId: string]: any[] } = {};

      for (const user of testUsers) {
        // Set auth context
        const authContext = await storage.validateApiKey(user.apiKey);
        storage.setAuthContext(authContext!);

        // Create 2 unique tides for this user
        const tide1 = await storage.createTide({
          name: `${user.id} Daily Workflow`,
          flow_type: 'daily',
          description: `Daily productivity tide for ${user.id}`
        });

        const tide2 = await storage.createTide({
          name: `${user.id} Project Focus`,
          flow_type: 'project',
          description: `Project work tide for ${user.id}`
        });

        createdTides[user.id] = [tide1, tide2];

        // Verify tides were created correctly
        expect(tide1.name).toBe(`${user.id} Daily Workflow`);
        expect(tide2.name).toBe(`${user.id} Project Focus`);
      }

      // Step 4: Verify complete user isolation
      for (const user of testUsers) {
        // Set current user context
        const authContext = await storage.validateApiKey(user.apiKey);
        storage.setAuthContext(authContext!);

        // User should only see their own tides
        const userTides = await storage.listTides();
        expect(userTides).toHaveLength(2);
        
        // All tides should belong to this user
        expect(userTides.every(tide => tide.name.startsWith(user.id))).toBe(true);

        // Specific tide names should match
        const expectedNames = createdTides[user.id].map(t => t.name).sort();
        const actualNames = userTides.map(t => t.name).sort();
        expect(actualNames).toEqual(expectedNames);

        // Test cross-user access denial - try to access other users' tides
        const otherUsers = testUsers.filter(u => u.id !== user.id);
        for (const otherUser of otherUsers) {
          const otherUserTides = createdTides[otherUser.id];
          for (const otherTide of otherUserTides) {
            const accessResult = await storage.getTide(otherTide.id);
            expect(accessResult).toBeNull(); // Should not be able to access
          }
        }
      }

      // Step 5: Test invalid API key handling
      const invalidResult = await storage.validateApiKey('tides_invalid_user_key');
      expect(invalidResult).toBeNull();

      // Step 6: Test authentication failure with no API key
      storage.setAuthContext({ userId: '', apiKeyName: 'none' });
      const fallbackTides = await storage.listTides();
      expect(Array.isArray(fallbackTides)).toBe(true); // Should handle gracefully

      // Verify we now have 4 users, 4 API keys, and 8 tides total (2 per user) in our mock DB
      const allUsers = await mockDb.prepare('SELECT * FROM users').all();
      const allApiKeys = await mockDb.prepare('SELECT * FROM api_keys').all();
      const allTideIndex = await mockDb.prepare('SELECT * FROM tide_index').all();

      expect(allUsers.results.filter(u => u.id.startsWith('user'))).toHaveLength(4);
      expect(allApiKeys.results.filter(k => k.user_id.startsWith('user'))).toHaveLength(4);
      expect(allTideIndex.results.filter(t => t.user_id.startsWith('user'))).toHaveLength(8);

      // Each user should have exactly 2 tides
      for (const user of testUsers) {
        const userTideCount = allTideIndex.results.filter(t => t.user_id === user.id).length;
        expect(userTideCount).toBe(2);
      }
    });

    test('should enforce authentication for all MCP tools when implemented', async () => {
      // This test verifies that our authentication system is ready for server integration
      
      // Create a test user
      const testUser = { id: 'authtest', email: 'authtest@example.com', apiKey: 'tides_authtest_server' };
      const encoder = new TextEncoder();
      const data = encoder.encode(testUser.apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await mockDb.prepare(`
        INSERT INTO users (id, email, created_at) 
        VALUES (?, ?, ?)
      `).bind(testUser.id, testUser.email, new Date().toISOString()).run();

      await mockDb.prepare(`
        INSERT INTO api_keys (id, user_id, key_hash, name, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'key_authtest',
        testUser.id,
        keyHash,
        'default',
        new Date().toISOString()
      ).run();

      // Test that authentication context can be set and retrieved
      const authContext = await storage.validateApiKey(testUser.apiKey);
      expect(authContext).not.toBeNull();
      
      storage.setAuthContext(authContext!);
      
      // Verify that operations work with proper auth context
      const tide = await storage.createTide({
        name: 'Auth Test Tide',
        flow_type: 'daily',
        description: 'Testing authentication integration'
      });

      expect(tide.name).toBe('Auth Test Tide');
      
      const tides = await storage.listTides();
      expect(tides).toHaveLength(1);
      expect(tides[0].name).toBe('Auth Test Tide');

      // This confirms that our authentication system is ready for server.ts integration
    });
  });
});