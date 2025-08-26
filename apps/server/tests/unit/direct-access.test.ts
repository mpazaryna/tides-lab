/**
 * @fileoverview Unit Tests for Direct Tool Access
 * 
 * Comprehensive test suite for the DirectToolAccess class and ToolRegistry.
 * Tests cover validation, execution, error handling, and type safety.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DirectToolAccess, createDirectToolAccess, ToolRegistry, createToolRegistry } from '../../src/tools';
import type { TideStorage } from '../../src/storage';
import * as tideCore from '../../src/tools/tide-core';
import * as tideSessions from '../../src/tools/tide-sessions';
import * as tideTasks from '../../src/tools/tide-tasks';
import * as tideAnalytics from '../../src/tools/tide-analytics';

// Mock storage for testing
const mockStorage: TideStorage = {
  createTide: jest.fn(),
  listTides: jest.fn(),
  createFlowSession: jest.fn(),
  addEnergyUpdate: jest.fn(),
  linkTask: jest.fn(),
  listTaskLinks: jest.fn(),
  getTideReport: jest.fn(),
  getTideRawData: jest.fn(),
  getParticipants: jest.fn(),
} as any;

// Mock tool functions to avoid dependency on actual implementations
jest.mock('../../src/tools/tide-core', () => ({
  createTide: jest.fn(),
  listTides: jest.fn()
}));

jest.mock('../../src/tools/tide-sessions', () => ({
  startTideFlow: jest.fn(),
  addTideEnergy: jest.fn()
}));

jest.mock('../../src/tools/tide-tasks', () => ({
  linkTideTask: jest.fn(),
  listTideTaskLinks: jest.fn()
}));

jest.mock('../../src/tools/tide-analytics', () => ({
  getTideReport: jest.fn(),
  getTideRawJson: jest.fn(),
  getParticipants: jest.fn()
}));

describe('DirectToolAccess', () => {
  let directAccess: DirectToolAccess;

  beforeEach(() => {
    jest.clearAllMocks();
    directAccess = new DirectToolAccess(mockStorage);
    
    // Setup mock return values
    (tideCore.createTide as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      tide_id: 'test-tide-123',
      name: 'Test Tide',
      flow_type: 'daily',
      created_at: '2025-08-15T10:00:00Z',
      status: 'active',
      description: 'Test description',
      next_flow: '2025-08-16 09:00'
    });

    (tideCore.listTides as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      tides: [
        {
          id: 'test-tide-123',
          name: 'Test Tide',
          flow_type: 'daily',
          status: 'active',
          created_at: '2025-08-15T10:00:00Z',
          description: 'Test description',
          flow_count: 0,
          last_flow: null
        }
      ],
      count: 1
    });

    (tideSessions.startTideFlow as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      session_id: 'session-123',
      tide_id: 'test-tide-123',
      started_at: '2025-08-15T10:00:00Z',
      intensity: 'moderate',
      duration: 25
    });

    (tideSessions.addTideEnergy as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      energy_id: 'energy-123',
      tide_id: 'test-tide-123',
      energy_level: 'high',
      recorded_at: '2025-08-15T10:00:00Z'
    });

    (tideTasks.linkTideTask as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      link_id: 'link-123',
      tide_id: 'test-tide-123',
      task_url: 'https://github.com/org/repo/issues/1',
      task_title: 'Test Issue'
    });

    (tideTasks.listTideTaskLinks as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      links: [
        {
          id: 'link-123',
          task_url: 'https://github.com/org/repo/issues/1',
          task_title: 'Test Issue',
          task_type: 'github_issue',
          linked_at: '2025-08-15T10:00:00Z'
        }
      ],
      count: 1
    });

    (tideAnalytics.getTideReport as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      report: {
        tide_id: 'test-tide-123',
        total_sessions: 5,
        total_time: 125,
        average_energy: 'medium'
      },
      format: 'json'
    });

    (tideAnalytics.getTideRawJson as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      tide: {
        id: 'test-tide-123',
        name: 'Test Tide',
        flow_sessions: [],
        energy_updates: [],
        task_links: []
      }
    });

    (tideAnalytics.getParticipants as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      participants: [
        {
          id: 'user-123',
          email: 'user@example.com',
          status: 'active'
        }
      ],
      count: 1
    });
  });

  describe('createTide', () => {
    test('should create tide with valid parameters', async () => {
      const params = {
        name: 'Test Tide',
        flow_type: 'daily' as const,
        description: 'Test description'
      };

      const result = await directAccess.createTide(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('tide_id', 'test-tide-123');
        expect(result.timestamp).toBeTruthy();
      }
    });

    test('should return validation error for invalid flow_type', async () => {
      const params = {
        name: 'Test Tide',
        flow_type: 'invalid' as any,
        description: 'Test description'
      };

      const result = await directAccess.createTide(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Validation error');
        expect(result.error).toContain('flow_type');
      }
    });

    test('should return validation error for missing name', async () => {
      const params = {
        flow_type: 'daily' as const,
        description: 'Test description'
      } as any;

      const result = await directAccess.createTide(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Validation error');
      }
    });
  });

  describe('listTides', () => {
    test('should list tides with no parameters', async () => {
      const result = await directAccess.listTides();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('tides');
        expect(Array.isArray(result.data.tides)).toBe(true);
      }
    });

    test('should list tides with filtering parameters', async () => {
      const params = {
        flow_type: 'daily',
        active_only: true
      };

      const result = await directAccess.listTides(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('tides');
      }
    });
  });

  describe('startTideFlow', () => {
    test('should start tide flow with valid parameters', async () => {
      const params = {
        tide_id: 'test-tide-123',
        intensity: 'moderate' as const,
        duration: 25,
        initial_energy: 'high',
        work_context: 'Deep work session'
      };

      const result = await directAccess.startTideFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('session_id');
      }
    });

    test('should use default values for optional parameters', async () => {
      const params = {
        tide_id: 'test-tide-123'
      };

      const result = await directAccess.startTideFlow(params);

      expect(result.success).toBe(true);
    });
  });

  describe('addTideEnergy', () => {
    test('should add energy update with valid parameters', async () => {
      const params = {
        tide_id: 'test-tide-123',
        energy_level: 'high',
        context: 'Feeling energized after coffee'
      };

      const result = await directAccess.addTideEnergy(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('energy_id');
      }
    });
  });

  describe('linkTideTask', () => {
    test('should link task with valid parameters', async () => {
      const params = {
        tide_id: 'test-tide-123',
        task_url: 'https://github.com/org/repo/issues/1',
        task_title: 'Test Issue',
        task_type: 'github_issue'
      };

      const result = await directAccess.linkTideTask(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('success', true);
        expect(result.data).toHaveProperty('link_id');
      }
    });
  });

  describe('error handling', () => {
    test('should handle tool execution errors gracefully', async () => {
      // Mock a tool to throw an error
      (tideCore.createTide as jest.MockedFunction<any>).mockRejectedValue(new Error('Storage error'));

      const params = {
        name: 'Test Tide',
        flow_type: 'daily' as const
      };

      const result = await directAccess.createTide(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Storage error');
        expect(result.timestamp).toBeTruthy();
      }
    });
  });
});

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new ToolRegistry(mockStorage);
  });

  describe('tool discovery', () => {
    test('should return all available tool names', () => {
      const toolNames = registry.getToolNames();
      
      expect(Array.isArray(toolNames)).toBe(true);
      expect(toolNames).toContain('createTide');
      expect(toolNames).toContain('listTides');
      expect(toolNames).toContain('startTideFlow');
      expect(toolNames).toContain('addTideEnergy');
      expect(toolNames).toContain('linkTideTask');
      expect(toolNames).toContain('listTideTaskLinks');
      expect(toolNames).toContain('getTideReport');
      expect(toolNames).toContain('getTideRawJson');
      expect(toolNames).toContain('getParticipants');
    });

    test('should return tools by category', () => {
      const coreTools = registry.getToolsByCategory('core');
      const sessionTools = registry.getToolsByCategory('sessions');
      const taskTools = registry.getToolsByCategory('tasks');
      const analyticsTools = registry.getToolsByCategory('analytics');

      expect(coreTools).toContain('createTide');
      expect(coreTools).toContain('listTides');
      expect(sessionTools).toContain('startTideFlow');
      expect(sessionTools).toContain('addTideEnergy');
      expect(taskTools).toContain('linkTideTask');
      expect(taskTools).toContain('listTideTaskLinks');
      expect(analyticsTools).toContain('getTideReport');
      expect(analyticsTools).toContain('getTideRawJson');
      expect(analyticsTools).toContain('getParticipants');
    });
  });

  describe('tool metadata', () => {
    test('should return metadata for existing tool', () => {
      const metadata = registry.getToolMetadata('createTide');
      
      expect(metadata).toBeTruthy();
      expect(metadata?.name).toBe('createTide');
      expect(metadata?.category).toBe('core');
      expect(metadata?.mcpToolName).toBe('tide_create');
      expect(metadata?.description).toContain('Create a new tidal workflow');
    });

    test('should return undefined for non-existent tool', () => {
      const metadata = registry.getToolMetadata('nonExistentTool');
      expect(metadata).toBeUndefined();
    });

    test('should return all tool metadata', () => {
      const allMetadata = registry.getAllToolMetadata();
      
      expect(Array.isArray(allMetadata)).toBe(true);
      expect(allMetadata.length).toBeGreaterThan(0);
      expect(allMetadata[0]).toHaveProperty('name');
      expect(allMetadata[0]).toHaveProperty('description');
      expect(allMetadata[0]).toHaveProperty('category');
    });
  });

  describe('tool validation', () => {
    test('should validate correct parameters', () => {
      const params = {
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'Test'
      };

      const result = registry.validateToolParams('createTide', params);
      
      expect(result.success).toBe(true);
    });

    test('should reject invalid parameters', () => {
      const params = {
        name: 'Test Tide',
        flow_type: 'invalid',
        description: 'Test'
      };

      const result = registry.validateToolParams('createTide', params);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Validation error');
      }
    });

    test('should reject non-existent tool', () => {
      const params = { name: 'Test' };
      const result = registry.validateToolParams('nonExistentTool', params);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tool \'nonExistentTool\' not found');
      }
    });
  });

  describe('dynamic execution', () => {
    test('should execute tool dynamically', async () => {
      const params = {
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'Test'
      };

      const result = await registry.execute('createTide', params);
      
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('createTide');
      expect(result.timestamp).toBeTruthy();
      expect(typeof result.executionTime).toBe('number');
    });

    test('should handle execution errors', async () => {
      const result = await registry.execute('nonExistentTool', {});
      
      expect(result.success).toBe(false);
      expect(result.toolName).toBe('nonExistentTool');
      if (!result.success) {
        expect(result.error).toContain('not found in registry');
      }
    });
  });

  describe('registry statistics', () => {
    test('should return correct statistics', () => {
      const stats = registry.getRegistryStats();
      
      expect(stats).toHaveProperty('totalTools');
      expect(stats).toHaveProperty('toolsByCategory');
      expect(stats).toHaveProperty('availableCategories');
      expect(typeof stats.totalTools).toBe('number');
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.availableCategories).toContain('core');
      expect(stats.availableCategories).toContain('sessions');
      expect(stats.availableCategories).toContain('tasks');
      expect(stats.availableCategories).toContain('analytics');
    });
  });

  describe('documentation generation', () => {
    test('should generate documentation for all tools', () => {
      const docs = registry.generateDocumentation();
      
      expect(typeof docs).toBe('object');
      expect(docs).toHaveProperty('createTide');
      expect(docs.createTide).toHaveProperty('name');
      expect(docs.createTide).toHaveProperty('description');
      expect(docs.createTide).toHaveProperty('category');
      expect(docs.createTide).toHaveProperty('mcpToolName');
      expect(docs.createTide).toHaveProperty('schema');
    });
  });
});

describe('Factory Functions', () => {
  test('createDirectToolAccess should create DirectToolAccess instance', () => {
    const directAccess = createDirectToolAccess(mockStorage);
    
    expect(directAccess).toBeInstanceOf(DirectToolAccess);
  });

  test('createToolRegistry should create ToolRegistry instance', () => {
    const registry = createToolRegistry(mockStorage);
    
    expect(registry).toBeInstanceOf(ToolRegistry);
  });
});

describe('Integration Tests', () => {
  test('DirectToolAccess and ToolRegistry should work together', async () => {
    const directAccess = createDirectToolAccess(mockStorage);
    const registry = createToolRegistry(mockStorage);

    // Get tool names from registry
    const toolNames = registry.getToolNames();
    expect(toolNames).toContain('createTide');

    // Validate parameters using registry
    const params = {
      name: 'Test Tide',
      flow_type: 'daily'
    };
    const validation = registry.validateToolParams('createTide', params);
    expect(validation.success).toBe(true);

    // Execute using direct access
    const result = await directAccess.createTide(params);
    expect(result.success).toBe(true);

    // Execute using registry
    const registryResult = await registry.execute('createTide', params);
    expect(registryResult.success).toBe(true);
  });
});