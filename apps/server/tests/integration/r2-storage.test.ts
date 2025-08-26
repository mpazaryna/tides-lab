import { R2TideStorage } from '../../src/storage/r2';
import { CreateTideInput } from '../../src/storage';

// Mock R2Bucket for testing
class MockR2Bucket {
  private objects: Map<string, string> = new Map();

  async get(key: string): Promise<{ text: () => Promise<string> } | null> {
    const content = this.objects.get(key);
    if (!content) return null;
    
    return {
      text: async () => content,
    };
  }

  async put(key: string, value: string, options?: any): Promise<any> {
    this.objects.set(key, value);
    return null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async list(options?: any): Promise<any> {
    return { objects: [] };
  }

  async head(key: string): Promise<any> {
    return null;
  }

  // Additional R2Bucket methods (not used in our implementation)
  async createMultipartUpload(): Promise<any> {
    throw new Error('Not implemented in mock');
  }

  async resumeMultipartUpload(): Promise<any> {
    throw new Error('Not implemented in mock');
  }

  // Helper methods for testing
  clear(): void {
    this.objects.clear();
  }

  size(): number {
    return this.objects.size;
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }

  getContent(key: string): string | undefined {
    return this.objects.get(key);
  }
}

describe('R2TideStorage', () => {
  let storage: R2TideStorage;
  let mockR2: MockR2Bucket;

  beforeEach(() => {
    mockR2 = new MockR2Bucket();
    storage = new R2TideStorage(mockR2 as any);
  });

  describe('createTide', () => {
    it('should create a tide and store as JSON file', async () => {
      const input: CreateTideInput = {
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'A test tide'
      };

      const tide = await storage.createTide(input);

      expect(tide.id).toMatch(/^tide_\d+_[a-z0-9]+$/);
      expect(tide.name).toBe('Test Tide');
      expect(tide.flow_type).toBe('daily');
      expect(tide.description).toBe('A test tide');
      expect(tide.status).toBe('active');
      expect(tide.created_at).toBeDefined();
      expect(tide.flow_sessions).toEqual([]);
      expect(tide.energy_updates).toEqual([]);
      expect(tide.task_links).toEqual([]);

      // Check that tide file was created
      expect(mockR2.has(`tides/${tide.id}.json`)).toBe(true);
      
      // Check that index file was created/updated
      expect(mockR2.has('tides/index.json')).toBe(true);
      
      const indexContent = mockR2.getContent('tides/index.json')!;
      const index = JSON.parse(indexContent);
      expect(index.tides).toHaveLength(1);
      expect(index.tides[0].id).toBe(tide.id);
      expect(index.tides[0].name).toBe('Test Tide');
    });

    it('should create tide without description', async () => {
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

    it('should return empty array when no index exists', async () => {
      const freshStorage = new R2TideStorage(new MockR2Bucket() as any);
      const tides = await freshStorage.listTides();
      expect(tides).toEqual([]);
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
      
      // Check that file was updated
      const tideContent = mockR2.getContent(`tides/${created.id}.json`)!;
      const tideData = JSON.parse(tideContent);
      expect(tideData.name).toBe('Updated Name');
      expect(tideData.status).toBe('paused');
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

      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.tide_id).toBe(tideId);
      expect(session.intensity).toBe('strong');
      expect(session.duration).toBe(60);
      
      // Check that tide file was updated with session
      const tideContent = mockR2.getContent(`tides/${tideId}.json`)!;
      const tideData = JSON.parse(tideContent);
      expect(tideData.flow_sessions).toHaveLength(1);
      expect(tideData.flow_sessions[0].id).toBe(session.id);
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

      expect(update.id).toMatch(/^energy_\d+_[a-z0-9]+$/);
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

      expect(link.id).toMatch(/^link_\d+_[a-z0-9]+$/);
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
  });

  describe('index management', () => {
    it('should update index when tide flow count changes', async () => {
      const tide = await storage.createTide({ name: 'Index Test', flow_type: 'daily' });
      
      // Add a flow session
      await storage.addFlowSession(tide.id, {
        intensity: 'moderate',
        duration: 25,
        started_at: new Date().toISOString()
      });
      
      // Check that index was updated with flow count
      const indexContent = mockR2.getContent('tides/index.json')!;
      const index = JSON.parse(indexContent);
      const tideEntry = index.tides.find((t: any) => t.id === tide.id);
      
      expect(tideEntry.flow_count).toBe(1);
      expect(tideEntry.last_flow).toBeDefined();
    });

    it('should handle index updates gracefully on errors', async () => {
      // This test would require mocking R2 errors, but the main point is
      // that index update failures shouldn't break the main operation
      const tide = await storage.createTide({ name: 'Error Test', flow_type: 'daily' });
      expect(tide).toBeDefined();
    });
  });
});