/**
 * Debug test to isolate storage auth context issue between tools and prompts
 */

import { jest } from '@jest/globals';
import { createServer } from '../src/server';
import { createStorage } from '../src/storage';

// Mock environment with D1 enabled
const mockEnv = {
  DB: {
    prepare: jest.fn(() => ({
      bind: jest.fn(() => ({
        first: jest.fn(() => Promise.resolve(null)),
        all: jest.fn(() => Promise.resolve({ results: [] }))
      }))
    }))
  },
  CLOUDFLARE_API_TOKEN: 'test-token',
  CLOUDFLARE_ACCOUNT_ID: 'test-account',
  R2_BUCKET_NAME: 'test-bucket'
} as any;

const authContext = {
  userId: 'testuser001',
  apiKeyName: 'test-key'
};

describe('Storage Auth Context Debug', () => {
  test('storage should maintain auth context when calling getTide', async () => {
    const storage = createStorage(mockEnv);
    
    // Set auth context (same as done in server.ts)
    if ('setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
      (storage as any).setAuthContext(authContext);
    }
    
    // Test that getTide is called with proper auth context
    console.log('Testing storage.getTide with auth context...');
    const tide = await storage.getTide('tide_test_123');
    console.log('getTide result:', tide);
    
    // The tide should be null (since we're mocking), but should not throw auth errors
    expect(tide).toBe(null);
  });

  test('server creation should set auth context on storage', () => {
    console.log('Creating server with auth context...');
    const server = createServer(mockEnv, authContext);
    expect(server).toBeDefined();
    
    // Verify server has prompts registered
    const registeredPrompts = Object.keys((server as any)._registeredPrompts);
    console.log('Registered prompts:', registeredPrompts);
    expect(registeredPrompts).toContain('analyze_tide');
  });
  
  test('should be able to access storage methods without auth errors', async () => {
    const storage = createStorage(mockEnv);
    
    if ('setAuthContext' in storage && typeof storage.setAuthContext === 'function') {
      (storage as any).setAuthContext(authContext);
    }
    
    // Test all the methods used in prompt registration
    console.log('Testing storage methods used in prompts...');
    
    const tideId = 'tide_test_123';
    
    try {
      const tide = await storage.getTide(tideId);
      const flowSessions = await storage.getFlowSessions(tideId);
      const energyUpdates = await storage.getEnergyUpdates(tideId);  
      const taskLinks = await storage.getTaskLinks(tideId);
      
      console.log('Storage method results:', {
        tide: tide ? 'found' : 'null',
        flowSessions: flowSessions.length,
        energyUpdates: energyUpdates.length,
        taskLinks: taskLinks.length
      });
      
      // All methods should succeed (even if returning null/empty)
      expect(flowSessions).toBeDefined();
      expect(energyUpdates).toBeDefined();
      expect(taskLinks).toBeDefined();
    } catch (error) {
      console.error('Storage method failed:', error);
      throw error;
    }
  });
});