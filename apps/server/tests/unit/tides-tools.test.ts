import * as tideTools from '../../src/tools';
import { MockTideStorage } from '../../src/storage/mock';

describe('Tides Tools Functions', () => {
  let storage: MockTideStorage;
  
  beforeEach(() => {
    storage = new MockTideStorage();
  });

  describe('createTide', () => {
    it('should create a tide with valid input', async () => {
      const result = await tideTools.createTide({
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'Test description'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.name).toBe('Test Tide');
      expect(result.flow_type).toBe('daily');
      expect(result.description).toBe('Test description');
      expect(result.tide_id).toMatch(/^tide_\d+_\d+$/);
      expect(result.status).toBe('active');
      expect(result.created_at).toBeDefined();
      expect(result.next_flow).toMatch(/^\d{4}-\d{2}-\d{2} 09:00$/);
    });

    it('should create a tide without description', async () => {
      const result = await tideTools.createTide({
        name: 'Minimal Tide',
        flow_type: 'weekly'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.name).toBe('Minimal Tide');
      expect(result.flow_type).toBe('weekly');
      expect(result.description).toBe('');
    });

    it('should handle all flow types', async () => {
      const flowTypes = ['daily', 'weekly', 'project', 'seasonal'] as const;
      
      for (const flow_type of flowTypes) {
        const result = await tideTools.createTide({
          name: `${flow_type} tide`,
          flow_type
        }, storage);

        expect(result.success).toBe(true);
        expect(result.flow_type).toBe(flow_type);
      }
    });
  });

  describe('listTides', () => {
    it('should return list of tides', async () => {
      // First create some test tides
      await tideTools.createTide({
        name: 'Morning Deep Work',
        flow_type: 'daily',
        description: '90-minute focus block for creative work'
      }, storage);
      
      await tideTools.createTide({
        name: 'Weekly Review',
        flow_type: 'weekly',
        description: 'Review progress and plan ahead'
      }, storage);

      const result = await tideTools.listTides({}, storage);

      expect(result.success).toBe(true);
      expect(result.tides).toBeInstanceOf(Array);
      expect(result.tides).toHaveLength(2);
      expect(result.count).toBe(2);
      
      // Check first tide structure
      const firstTide = result.tides[0];
      expect(firstTide.id).toBeDefined();
      expect(firstTide.name).toBeDefined();
      expect(firstTide.flow_type).toBeDefined();
      expect(firstTide.status).toBeDefined();
      expect(firstTide.created_at).toBeDefined();
    });

    it('should accept filter parameters', async () => {
      // Create tides with different flow types
      await tideTools.createTide({
        name: 'Daily Tide',
        flow_type: 'daily'
      }, storage);
      
      await tideTools.createTide({
        name: 'Weekly Tide',
        flow_type: 'weekly'
      }, storage);

      const result = await tideTools.listTides({
        flow_type: 'daily',
        active_only: true
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tides).toHaveLength(1);
      expect(result.tides[0].flow_type).toBe('daily');
    });
  });

  describe('startTideFlow', () => {
    it('should start flow session with default values', async () => {
      // First create a tide to flow with
      await tideTools.createTide({
        name: 'Test Tide',
        flow_type: 'daily'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.startTideFlow({
        tide_id: tideId
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tide_id).toBe(tideId);
      expect(result.intensity).toBe('moderate');
      expect(result.duration).toBe(25);
      expect(result.session_id).toMatch(/^session_\d+_\d+$/);
      expect(result.started_at).toBeDefined();
      expect(result.energy_level).toBe('high');
      expect(result.work_context).toBe('General work');
    });

    it('should start flow session with custom values', async () => {
      // First create a tide to flow with
      await tideTools.createTide({
        name: 'Test Tide 2',
        flow_type: 'weekly'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.startTideFlow({
        tide_id: tideId,
        intensity: 'strong',
        duration: 90,
        initial_energy: 'medium',
        work_context: 'Deep coding session'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tide_id).toBe(tideId);
      expect(result.intensity).toBe('strong');
      expect(result.duration).toBe(90);
      expect(result.energy_level).toBe('medium');
      expect(result.work_context).toBe('Deep coding session');
    });
  });

  describe('addTideEnergy', () => {
    it('should add energy check-in', async () => {
      // First create a tide to add energy to
      await tideTools.createTide({
        name: 'Energy Test Tide',
        flow_type: 'daily'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.addTideEnergy({
        tide_id: tideId,
        energy_level: 'high',
        context: 'Feeling focused'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tide_id).toBe(tideId);
      expect(result.energy_level).toBe('high');
      expect(result.context).toBe('Feeling focused');
      expect(result.energy_id).toMatch(/^energy_\d+_\d+$/);
      expect(result.timestamp).toBeDefined();
      expect(result.message).toBe("Energy level 'high' recorded");
    });

    it('should add energy without context', async () => {
      // First create a tide to add energy to
      await tideTools.createTide({
        name: 'Energy Test Tide 2',
        flow_type: 'weekly'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.addTideEnergy({
        tide_id: tideId,
        energy_level: 'low'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.context).toBe('');
    });
  });

  describe('linkTideTask', () => {
    it('should link external task', async () => {
      // First create a tide to link tasks to
      await tideTools.createTide({
        name: 'Task Link Test Tide',
        flow_type: 'project'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.linkTideTask({
        tide_id: tideId,
        task_url: 'https://github.com/user/repo/issues/42',
        task_title: 'Fix authentication bug',
        task_type: 'github_issue'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tide_id).toBe(tideId);
      expect(result.task_url).toBe('https://github.com/user/repo/issues/42');
      expect(result.task_title).toBe('Fix authentication bug');
      expect(result.task_type).toBe('github_issue');
      expect(result.link_id).toMatch(/^link_\d+_\d+$/);
      expect(result.linked_at).toBeDefined();
      expect(result.message).toBe("Task 'Fix authentication bug' linked successfully");
    });

    it('should link task without type', async () => {
      // First create a tide to link tasks to
      await tideTools.createTide({
        name: 'Task Link Test Tide 2',
        flow_type: 'daily'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      const result = await tideTools.linkTideTask({
        tide_id: tideId,
        task_url: 'https://example.com/task',
        task_title: 'General task'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.task_type).toBe('general');
    });
  });

  describe('listTideTaskLinks', () => {
    it('should list task links for tide', async () => {
      // First create a tide and add some task links
      await tideTools.createTide({
        name: 'List Links Test Tide',
        flow_type: 'project'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      // Add some task links
      await tideTools.linkTideTask({
        tide_id: tideId,
        task_url: 'https://github.com/user/repo/issues/1',
        task_title: 'First task',
        task_type: 'github_issue'
      }, storage);
      
      await tideTools.linkTideTask({
        tide_id: tideId,
        task_url: 'https://example.com/task/2',
        task_title: 'Second task'
      }, storage);
      
      const result = await tideTools.listTideTaskLinks({
        tide_id: tideId
      }, storage);

      expect(result.success).toBe(true);
      expect(result.tide_id).toBe(tideId);
      expect(result.links).toBeInstanceOf(Array);
      expect(result.links).toHaveLength(2);
      expect(result.count).toBe(2);
      
      // Check link structure
      const firstLink = result.links[0];
      expect(firstLink.id).toBeDefined();
      expect(firstLink.task_url).toBeDefined();
      expect(firstLink.task_title).toBeDefined();
      expect(firstLink.task_type).toBeDefined();
      expect(firstLink.linked_at).toBeDefined();
    });
  });

  describe('getTideRawJson', () => {
    it('should return complete raw JSON data', async () => {
      // Create a tide with some data
      await tideTools.createTide({
        name: 'Raw JSON Test Tide',
        flow_type: 'project',
        description: 'Test description'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      // Add some flow sessions and energy updates
      await tideTools.startTideFlow({
        tide_id: tideId,
        intensity: 'moderate',
        duration: 30
      }, storage);
      
      await tideTools.addTideEnergy({
        tide_id: tideId,
        energy_level: 'high',
        context: 'Feeling great'
      }, storage);
      
      // Get the raw JSON
      const result = await tideTools.getTideRawJson({
        tide_id: tideId
      }, storage);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(tideId);
      expect(result.data?.name).toBe('Raw JSON Test Tide');
      expect(result.data?.description).toBe('Test description');
      expect(result.data?.flow_sessions).toHaveLength(1);
      expect(result.data?.energy_updates).toHaveLength(1);
      expect(result.data?.task_links).toHaveLength(0);
      
      // Verify complete structure
      expect(result.data?.flow_sessions[0].intensity).toBe('moderate');
      expect(result.data?.energy_updates[0].energy_level).toBe('high');
    });
    
    it('should handle non-existent tide', async () => {
      const result = await tideTools.getTideRawJson({
        tide_id: 'non_existent_tide'
      }, storage);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Tide with id non_existent_tide not found');
      expect(result.data).toBeUndefined();
    });
  });

  describe('getTideReport', () => {
    it('should generate JSON report by default', async () => {
      // First create a tide with some data
      await tideTools.createTide({
        name: 'Report Test Tide',
        flow_type: 'daily'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      // Add some flow sessions and energy updates
      await tideTools.startTideFlow({ tide_id: tideId }, storage);
      await tideTools.addTideEnergy({ tide_id: tideId, energy_level: 'high' }, storage);
      
      const result = await tideTools.getTideReport({
        tide_id: tideId
      }, storage);

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.report).toBeDefined();
      expect((result as any).report.tide_id).toBe(tideId);
      expect((result as any).report.name).toBe('Report Test Tide');
      expect((result as any).report.flow_type).toBe('daily');
      expect((result as any).report.total_flows).toBe(1);
    });

    it('should generate markdown report', async () => {
      // First create a tide with some data
      await tideTools.createTide({
        name: 'Markdown Report Tide',
        flow_type: 'weekly'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      // Add some energy updates
      await tideTools.addTideEnergy({ tide_id: tideId, energy_level: 'medium' }, storage);
      
      const result = await tideTools.getTideReport({
        tide_id: tideId,
        format: 'markdown'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.format).toBe('markdown');
      expect(result.content).toBeDefined();
      expect(result.content).toContain('# Tide Report: Markdown Report Tide');
      expect(result.content).toContain('**Type:** weekly');
      expect(result.content).toContain('## Energy Progression');
    });

    it('should generate CSV report', async () => {
      // First create a tide with some data
      await tideTools.createTide({
        name: 'CSV Report Tide',
        flow_type: 'project'
      }, storage);
      
      const tides = await storage.listTides();
      const tideId = tides[0].id;
      
      // Add some energy updates
      await tideTools.addTideEnergy({ tide_id: tideId, energy_level: 'high' }, storage);
      await tideTools.addTideEnergy({ tide_id: tideId, energy_level: 'low' }, storage);
      
      const result = await tideTools.getTideReport({
        tide_id: tideId,
        format: 'csv'
      }, storage);

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.content).toBeDefined();
      expect(result.content).toContain('session_number,energy_level,date');
      expect(result.content).toContain('1,high,');
      expect(result.content).toContain('2,low,');
    });
  });

  describe('getParticipants', () => {
    it('should get participants with default params', async () => {
      const result = await tideTools.getParticipants({}, storage);

      expect(result.success).toBe(true);
      expect(result.participants).toBeInstanceOf(Array);
      expect(result.participants).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.filters_applied).toBeDefined();
      expect(result.filters_applied.limit).toBe(100);
      
      // Check participant structure
      const firstParticipant = result.participants[0];
      expect(firstParticipant.id).toBeDefined();
      expect(firstParticipant.provider_id).toBeDefined();
      expect(firstParticipant.first_name).toBeDefined();
      expect(firstParticipant.last_name).toBeDefined();
      expect(firstParticipant.email).toBeDefined();
      expect(firstParticipant.status).toBeDefined();
      expect(firstParticipant.created_at).toBeDefined();
    });

    it('should get participants with filters', async () => {
      const result = await tideTools.getParticipants({
        status_filter: 'active',
        date_from: '2025-01-01',
        date_to: '2025-01-31',
        limit: 50
      }, storage);

      expect(result.success).toBe(true);
      expect(result.filters_applied.status).toBe('active');
      expect(result.filters_applied.date_from).toBe('2025-01-01');
      expect(result.filters_applied.date_to).toBe('2025-01-31');
      expect(result.filters_applied.limit).toBe(50);
    });
  });
  
  describe('error handling', () => {
    it('should handle createTide storage errors', async () => {
      // Create a broken storage that throws errors
      const brokenStorage = {
        ...storage,
        createTide: jest.fn().mockRejectedValue(new Error('Storage error'))
      };
      
      const result = await tideTools.createTide({
        name: 'Test Tide',
        flow_type: 'daily'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
    
    it('should handle listTides storage errors', async () => {
      const brokenStorage = {
        ...storage,
        listTides: jest.fn().mockRejectedValue(new Error('List error'))
      };
      
      const result = await tideTools.listTides({}, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('List error');
      expect(result.tides).toEqual([]);
      expect(result.count).toBe(0);
    });
    
    it('should handle startTideFlow storage errors', async () => {
      const brokenStorage = {
        ...storage,
        addFlowSession: jest.fn().mockRejectedValue(new Error('Flow error'))
      };
      
      const result = await tideTools.startTideFlow({
        tide_id: 'test'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow error');
    });
    
    it('should handle addTideEnergy storage errors', async () => {
      const brokenStorage = {
        ...storage,
        addEnergyUpdate: jest.fn().mockRejectedValue(new Error('Energy error'))
      };
      
      const result = await tideTools.addTideEnergy({
        tide_id: 'test',
        energy_level: 'high'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Energy error');
    });
    
    it('should handle linkTideTask storage errors', async () => {
      const brokenStorage = {
        ...storage,
        addTaskLink: jest.fn().mockRejectedValue(new Error('Link error'))
      };
      
      const result = await tideTools.linkTideTask({
        tide_id: 'test',
        task_url: 'https://example.com',
        task_title: 'Test task'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Link error');
    });
    
    it('should handle listTideTaskLinks storage errors', async () => {
      const brokenStorage = {
        ...storage,
        getTaskLinks: jest.fn().mockRejectedValue(new Error('Task links error'))
      };
      
      const result = await tideTools.listTideTaskLinks({
        tide_id: 'test'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Task links error');
      expect(result.links).toEqual([]);
      expect(result.count).toBe(0);
    });
    
    it('should handle getTideReport storage errors', async () => {
      const brokenStorage = {
        ...storage,
        getTide: jest.fn().mockRejectedValue(new Error('Report error'))
      };
      
      const result = await tideTools.getTideReport({
        tide_id: 'test'
      }, brokenStorage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Report error');
    });
    
    it('should handle getTideReport with non-existent tide', async () => {
      const result = await tideTools.getTideReport({
        tide_id: 'non-existent'
      }, storage);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Tide with id non-existent not found');
    });
  });
});