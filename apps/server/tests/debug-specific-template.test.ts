/**
 * Test the specific template and data that's failing in production
 */

import { processTemplate } from '../src/prompts/registry';

const realTemplate = `COMPREHENSIVE TIDE ANALYSIS REQUEST

TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Description: {{tide.description || 'No description provided'}}
- Created: {{tide.created_at}}
- Status: {{tide.status || 'active'}}

PERFORMANCE METRICS:
- Total Sessions: {{flowSessions.length}}
- Total Duration: {{totalDuration}} minutes ({{Math.round(totalDuration / 60 * 10) / 10}} hours)
- Average Session: {{averageDuration}} minutes`;

const realData = {
  tide: {
    id: 'tide_1754586971583_ph37cp2nze',
    name: 'Deep Work Day - Complete Test',
    flow_type: 'daily',
    description: 'Full day of focused work with realistic energy patterns and task management',
    created_at: '2025-08-07T17:16:11.583Z',
    status: 'active'
  },
  flowSessions: [
    {
      id: 'session_1',
      duration: 90,
      intensity: 'strong',
      started_at: '2025-08-07T09:00:00Z',
      energy_level: 'high',
      work_context: 'Deep focus work'
    }
  ],
  energyUpdates: [],
  taskLinks: [],
  totalDuration: 90,
  averageDuration: 90,
  analysis_depth: 'detailed',
  Math: Math
};

describe('Specific Template Processing Debug', () => {
  test('should process the real template with real data', () => {
    console.log('Input data:', JSON.stringify(realData, null, 2));
    
    const result = processTemplate(realTemplate, realData);
    
    console.log('Template result:');
    console.log(result);
    
    // Check that basic substitutions worked
    expect(result).toContain('Deep Work Day - Complete Test');
    expect(result).toContain('daily');
    expect(result).toContain('Total Sessions: 1');
    expect(result).toContain('Total Duration: 90 minutes');
    expect(result).not.toContain('{{tide.name}}');
    expect(result).not.toContain('{{flowSessions.length}}');
  });

  test('should handle empty/null data gracefully', () => {
    const emptyData = {
      tide: null,
      flowSessions: [],
      energyUpdates: [],
      taskLinks: [],
      totalDuration: 0,
      averageDuration: 0
    };

    const result = processTemplate(realTemplate, emptyData);
    console.log('Empty data result:');
    console.log(result.substring(0, 200));
    
    // With null data, variables should either fallback or remain as placeholders
    expect(result).toBeDefined();
  });

  test('should handle data structure mismatch', () => {
    const malformedData = {
      // Missing expected properties
      wrongProperty: 'test'
    };

    const result = processTemplate(realTemplate, malformedData);
    console.log('Malformed data result:');
    console.log(result.substring(0, 200));
    
    // Should not throw, but may leave placeholders
    expect(result).toBeDefined();
  });
});