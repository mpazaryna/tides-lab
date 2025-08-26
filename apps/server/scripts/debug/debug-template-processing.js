#!/usr/bin/env node

// Debug script to test template processing with actual data

const { processTemplate } = require('./src/prompts/registry.ts');

// Test data that should match what the MCP prompt expects
const testData = {
  tide: {
    id: 'tide_test_123',
    name: 'Test Deep Work Tide',
    flow_type: 'daily',
    description: 'Test tide for debugging',
    created_at: '2025-08-07T17:00:00.000Z',
    status: 'active'
  },
  flowSessions: [
    {
      started_at: '2025-08-07T09:00:00.000Z',
      duration: 90,
      intensity: 'strong',
      energy_level: 'high',
      work_context: 'Deep focus work'
    },
    {
      started_at: '2025-08-07T11:00:00.000Z', 
      duration: 60,
      intensity: 'moderate',
      energy_level: 'medium',
      work_context: 'Collaborative work'
    }
  ],
  energyUpdates: [
    {
      timestamp: '2025-08-07T09:00:00.000Z',
      energy_level: 'high',
      context: 'Morning coffee effect'
    },
    {
      timestamp: '2025-08-07T11:30:00.000Z',
      energy_level: 'medium', 
      context: 'Post-meeting energy'
    }
  ],
  taskLinks: [
    {
      task_title: 'Implement auth middleware',
      task_type: 'github',
      task_url: 'https://github.com/user/repo/issues/123',
      linked_at: '2025-08-07T10:00:00.000Z'
    }
  ],
  totalDuration: 150,
  averageDuration: 75,
  analysis_depth: 'detailed',
  Math: Math
};

// Simple template to test basic substitution
const simpleTemplate = `
Tide: {{tide.name}}
Type: {{tide.flow_type}}
Sessions: {{flowSessions.length}}
Duration: {{totalDuration}} minutes
`;

// More complex template similar to what's in the prompts
const complexTemplate = `
TIDE INFORMATION:
- Name: {{tide.name}}
- Type: {{tide.flow_type}}
- Description: {{tide.description || 'No description provided'}}
- Total Sessions: {{flowSessions.length}}

FLOW SESSIONS:
{{flowSessions.map((session, index) => \`Session \${index + 1}: \${session.duration} min\`).join('\\n')}}
`;

console.log('🧪 Testing Template Processing\n');

console.log('📝 Test Data Structure:');
console.log(`- Tide: ${testData.tide.name}`);
console.log(`- Sessions: ${testData.flowSessions.length}`);
console.log(`- Energy Updates: ${testData.energyUpdates.length}`);
console.log(`- Task Links: ${testData.taskLinks.length}\n`);

console.log('🔧 Simple Template Test:');
console.log('Template:', simpleTemplate.trim());
console.log('Result:');
console.log(processTemplate(simpleTemplate, testData));

console.log('\n🔧 Complex Template Test:');
console.log('Template:', complexTemplate.trim());
console.log('Result:');
console.log(processTemplate(complexTemplate, testData));