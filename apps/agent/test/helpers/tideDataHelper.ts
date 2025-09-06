/**
 * Test helper for loading real tide data structure
 * Uses the same mock-tide-data.json that's deployed to R2
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { TideData } from '../../src/types.js';

/**
 * Load the real mock tide data used in R2
 */
export function loadMockTideData(): TideData {
  const filePath = join(__dirname, '..', 'fixtures', 'mock-tide-data.json');
  const rawData = readFileSync(filePath, 'utf8');
  return JSON.parse(rawData) as TideData;
}

/**
 * Create mock R2 response for tide data
 */
export function createMockR2Response(tideData: TideData) {
  return {
    json: async () => tideData,
    text: async () => JSON.stringify(tideData)
  };
}

/**
 * Setup R2 mock to return real tide data
 */
export function setupR2MockWithRealData(mockEnv: any) {
  const mockTideData = loadMockTideData();
  const mockR2 = mockEnv.TIDES_R2 as any;
  
  // Mock R2.get to return the real tide data
  mockR2.get.mockResolvedValue(createMockR2Response(mockTideData));
  
  // Setup server bucket mocks if they exist
  if (mockEnv.TIDES_SERVER_001) {
    mockEnv.TIDES_SERVER_001.get.mockResolvedValue(createMockR2Response(mockTideData));
  }
  if (mockEnv.TIDES_SERVER_002) {
    mockEnv.TIDES_SERVER_002.get.mockResolvedValue(createMockR2Response(mockTideData));
  }
  if (mockEnv.TIDES_SERVER_003) {
    mockEnv.TIDES_SERVER_003.get.mockResolvedValue(createMockR2Response(mockTideData));
  }
  
  return mockTideData;
}