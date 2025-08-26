import { MockTideStorage } from '../../src/storage/mock';
import { CreateTideInput } from '../../src/storage';

describe('MockTideStorage', () => {
  let storage: MockTideStorage;

  beforeEach(() => {
    storage = new MockTideStorage();
  });

  describe('createTide', () => {
    it('should create a tide with all required fields', async () => {
      const input: CreateTideInput = {
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'A test tide'
      };

      const tide = await storage.createTide(input);

      expect(tide.id).toMatch(/^tide_\d+_\d+$/);
      expect(tide.name).toBe('Test Tide');
      expect(tide.flow_type).toBe('daily');
      expect(tide.description).toBe('A test tide');
      expect(tide.status).toBe('active');
      expect(tide.created_at).toBeDefined();
      expect(tide.flow_sessions).toEqual([]);
      expect(tide.energy_updates).toEqual([]);
      expect(tide.task_links).toEqual([]);
    });

    it('should create a tide without description', async () => {
      const input: CreateTideInput = {
        name: 'Simple Tide',
        flow_type: 'weekly'
      };

      const tide = await storage.createTide(input);

      expect(tide.name).toBe('Simple Tide');
      expect(tide.flow_type).toBe('weekly');
      expect(tide.description).toBeUndefined();
    });
  });

  describe('getTide', () => {
    it('should return null for non-existent tide', async () => {
      const result = await storage.getTide('non-existent');
      expect(result).toBeNull();
    });

    it('should return existing tide', async () => {
      const input: CreateTideInput = {
        name: 'Get Test Tide',
        flow_type: 'project'
      };

      const created = await storage.createTide(input);
      const retrieved = await storage.getTide(created.id);

      expect(retrieved).toEqual(created);
    });
  });

  describe('listTides', () => {
    beforeEach(async () => {
      // Create test data
      await storage.createTide({ name: 'Daily Tide', flow_type: 'daily' });
      await storage.createTide({ name: 'Weekly Tide', flow_type: 'weekly' });
      
      // Create an inactive tide
      const inactiveTide = await storage.createTide({ name: 'Inactive Tide', flow_type: 'daily' });
      await storage.updateTide(inactiveTide.id, { status: 'completed' });
    });

    it('should list all tides without filter', async () => {
      const tides = await storage.listTides();
      expect(tides).toHaveLength(3);
    });

    it('should filter by flow_type', async () => {
      const dailyTides = await storage.listTides({ flow_type: 'daily' });
      expect(dailyTides).toHaveLength(2);
      expect(dailyTides.every(t => t.flow_type === 'daily')).toBe(true);
    });

    it('should filter by active_only', async () => {
      const activeTides = await storage.listTides({ active_only: true });
      expect(activeTides).toHaveLength(2);
      expect(activeTides.every(t => t.status === 'active')).toBe(true);
    });

    it('should combine filters', async () => {
      const activeDailyTides = await storage.listTides({ 
        flow_type: 'daily', 
        active_only: true 
      });
      expect(activeDailyTides).toHaveLength(1);
      expect(activeDailyTides[0].name).toBe('Daily Tide');
    });
  });

  describe('updateTide', () => {
    it('should update existing tide', async () => {
      const created = await storage.createTide({ name: 'Original', flow_type: 'daily' });
      
      const updated = await storage.updateTide(created.id, { 
        name: 'Updated Name',
        status: 'paused'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('paused');
      expect(updated.flow_type).toBe('daily'); // unchanged
    });

    it('should throw error for non-existent tide', async () => {
      await expect(storage.updateTide('non-existent', { name: 'Updated' }))
        .rejects.toThrow('Tide with id non-existent not found');
    });
  });

  describe('flow sessions', () => {
    let tideId: string;

    beforeEach(async () => {
      const tide = await storage.createTide({ name: 'Session Test', flow_type: 'daily' });
      tideId = tide.id;
    });

    it('should add flow session', async () => {
      const session = await storage.addFlowSession(tideId, {
        intensity: 'strong',
        duration: 60,
        started_at: new Date().toISOString(),
        work_context: 'Deep work',
        energy_level: 'high'
      });

      expect(session.id).toMatch(/^session_\d+_\d+$/);
      expect(session.tide_id).toBe(tideId);
      expect(session.intensity).toBe('strong');
      expect(session.duration).toBe(60);
    });

    it('should get flow sessions for tide', async () => {
      await storage.addFlowSession(tideId, {
        intensity: 'moderate',
        duration: 25,
        started_at: new Date().toISOString()
      });

      const sessions = await storage.getFlowSessions(tideId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].intensity).toBe('moderate');
    });

    it('should throw error for non-existent tide', async () => {
      await expect(storage.addFlowSession('non-existent', {
        intensity: 'moderate',
        duration: 25,
        started_at: new Date().toISOString()
      })).rejects.toThrow('Tide with id non-existent not found');
    });
  });

  describe('energy updates', () => {
    let tideId: string;

    beforeEach(async () => {
      const tide = await storage.createTide({ name: 'Energy Test', flow_type: 'daily' });
      tideId = tide.id;
    });

    it('should add energy update', async () => {
      const update = await storage.addEnergyUpdate(tideId, {
        energy_level: 'high',
        context: 'Feeling great',
        timestamp: new Date().toISOString()
      });

      expect(update.id).toMatch(/^energy_\d+_\d+$/);
      expect(update.tide_id).toBe(tideId);
      expect(update.energy_level).toBe('high');
      expect(update.context).toBe('Feeling great');
    });

    it('should get energy updates for tide', async () => {
      await storage.addEnergyUpdate(tideId, {
        energy_level: 'medium',
        timestamp: new Date().toISOString()
      });

      const updates = await storage.getEnergyUpdates(tideId);
      expect(updates).toHaveLength(1);
      expect(updates[0].energy_level).toBe('medium');
    });

    it('should throw error for non-existent tide', async () => {
      await expect(storage.addEnergyUpdate('non-existent', {
        energy_level: 'high',
        timestamp: new Date().toISOString()
      })).rejects.toThrow('Tide with id non-existent not found');
    });
  });

  describe('task links', () => {
    let tideId: string;

    beforeEach(async () => {
      const tide = await storage.createTide({ name: 'Link Test', flow_type: 'project' });
      tideId = tide.id;
    });

    it('should add task link', async () => {
      const link = await storage.addTaskLink(tideId, {
        task_url: 'https://github.com/user/repo/issues/1',
        task_title: 'Fix bug',
        task_type: 'github_issue',
        linked_at: new Date().toISOString()
      });

      expect(link.id).toMatch(/^link_\d+_\d+$/);
      expect(link.tide_id).toBe(tideId);
      expect(link.task_url).toBe('https://github.com/user/repo/issues/1');
      expect(link.task_title).toBe('Fix bug');
      expect(link.task_type).toBe('github_issue');
    });

    it('should get task links for tide', async () => {
      await storage.addTaskLink(tideId, {
        task_url: 'https://example.com/task',
        task_title: 'General task',
        task_type: 'general',
        linked_at: new Date().toISOString()
      });

      const links = await storage.getTaskLinks(tideId);
      expect(links).toHaveLength(1);
      expect(links[0].task_title).toBe('General task');
    });

    it('should remove task link', async () => {
      const link = await storage.addTaskLink(tideId, {
        task_url: 'https://example.com/task',
        task_title: 'To be removed',
        task_type: 'general',
        linked_at: new Date().toISOString()
      });

      const removed = await storage.removeTaskLink(link.id);
      expect(removed).toBe(true);

      const links = await storage.getTaskLinks(tideId);
      expect(links).toHaveLength(0);
    });

    it('should return false when removing non-existent link', async () => {
      const removed = await storage.removeTaskLink('non-existent');
      expect(removed).toBe(false);
    });

    it('should throw error for non-existent tide', async () => {
      await expect(storage.addTaskLink('non-existent', {
        task_url: 'https://example.com/task',
        task_title: 'Task',
        task_type: 'general',
        linked_at: new Date().toISOString()
      })).rejects.toThrow('Tide with id non-existent not found');
    });
  });

  describe('helper methods', () => {
    it('should clear all data', () => {
      storage.createTide({ name: 'Test', flow_type: 'daily' });
      expect(storage.size()).toBe(1);
      
      storage.clear();
      expect(storage.size()).toBe(0);
    });

    it('should return correct size', async () => {
      expect(storage.size()).toBe(0);
      
      await storage.createTide({ name: 'Test 1', flow_type: 'daily' });
      expect(storage.size()).toBe(1);
      
      await storage.createTide({ name: 'Test 2', flow_type: 'weekly' });
      expect(storage.size()).toBe(2);
    });
  });
});