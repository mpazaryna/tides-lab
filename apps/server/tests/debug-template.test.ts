/**
 * Debug test for template processing issue
 */

import { jest } from '@jest/globals';
import { createServer } from '../src/server';
import { createStorage } from '../src/storage';
import { processTemplate } from '../src/prompts/registry';

// Mock the storage module
jest.mock('../src/storage');
const mockCreateStorage = createStorage as jest.MockedFunction<typeof createStorage>;

// Mock environment
const mockEnv = {
  DB: {},
  TIDES_R2: {},
} as any;

// Mock storage with proper tide data
const mockStorage = {
  getTide: jest.fn() as jest.MockedFunction<any>,
  getFlowSessions: jest.fn() as jest.MockedFunction<any>,
  getEnergyUpdates: jest.fn() as jest.MockedFunction<any>,
  getTaskLinks: jest.fn() as jest.MockedFunction<any>,
};

describe('Template Processing Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateStorage.mockReturnValue(mockStorage as any);
    
    // Setup realistic mock data
    mockStorage.getTide.mockResolvedValue({
      id: 'tide_test_123',
      name: 'Debug Test Tide',
      flow_type: 'daily',
      description: 'Test tide for debugging templates',
      created_at: '2025-08-07T17:00:00.000Z',
      status: 'active'
    });
    
    mockStorage.getFlowSessions.mockResolvedValue([
      {
        started_at: '2025-08-07T09:00:00.000Z',
        duration: 90,
        intensity: 'strong',
        energy_level: 'high',
        work_context: 'Deep focus work'
      }
    ]);
    
    mockStorage.getEnergyUpdates.mockResolvedValue([
      {
        timestamp: '2025-08-07T09:00:00.000Z',
        energy_level: 'high',
        context: 'Morning energy boost'
      }
    ]);
    
    mockStorage.getTaskLinks.mockResolvedValue([
      {
        task_title: 'Test task',
        task_type: 'github',
        task_url: 'https://github.com/test/repo',
        linked_at: '2025-08-07T10:00:00.000Z'
      }
    ]);
  });

  test('processTemplate function should work with simple data', () => {
    const template = 'Tide: {{tide.name}}, Sessions: {{flowSessions.length}}';
    const data = {
      tide: { name: 'Test Tide' },
      flowSessions: [1, 2, 3]
    };
    
    const result = processTemplate(template, data);
    expect(result).toBe('Tide: Test Tide, Sessions: 3');
  });

  test('should be able to create server and access prompts', async () => {
    const server = createServer(mockEnv);
    expect(server).toBeDefined();
    
    // Check if prompts are registered (using any to access private property for debugging)
    expect((server as any)._registeredPrompts).toBeDefined();
    console.log('Registered prompts:', Object.keys((server as any)._registeredPrompts));
  });
});