#!/usr/bin/env node
// Helper script to extract JSON data from SSE format responses

const fs = require('fs');

function extractSSEData(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.substring(6); // Remove 'data: ' prefix
        try {
          const parsed = JSON.parse(jsonData);
          return parsed;
        } catch (e) {
          console.error('Failed to parse JSON:', e.message);
          return null;
        }
      }
    }
    
    console.error('No data line found in SSE response');
    return null;
  } catch (error) {
    console.error('Failed to read file:', error.message);
    return null;
  }
}

// If called with a filename argument, process that file
if (process.argv[2]) {
  const result = extractSSEData(process.argv[2]);
  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
} else {
  console.error('Usage: node extract-sse-data.js <filename>');
}