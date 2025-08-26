/**
 * Benchmark Runner Script
 * 
 * Run this script to compare D1/R2 hybrid storage against other implementations
 * Usage: npx tsx scripts/benchmark/run-benchmark.ts
 */

import { compareStorageImplementations, analyzeBenchmarkResults } from './benchmark';
import { createStorage } from '../../src/storage/index';
import { MockTideStorage } from '../../src/storage/mock';

// Mock environment for testing
const mockEnv = {
  DB: {} as D1Database, // Will need actual D1 instance for real testing
  CLOUDFLARE_API_TOKEN: 'test-token',
  CLOUDFLARE_ACCOUNT_ID: 'test-account',
  R2_BUCKET_NAME: 'test-bucket'
};

async function runBenchmarks() {
  console.log('🚀 Starting Tides Storage Benchmark Suite\n');

  const implementations = [
    {
      name: 'Mock Storage (Baseline)',
      storage: new MockTideStorage()
    },
    // Uncomment when you have proper D1/R2 setup
    // {
    //   name: 'D1/R2 Hybrid Storage',
    //   storage: createStorage(mockEnv as any)
    // }
  ];

  try {
    const results = await compareStorageImplementations(implementations);
    analyzeBenchmarkResults(results);
    
    console.log('\n✅ Benchmark completed successfully!');
    console.log('\n📊 Use these results to compare D1/R2 performance against:');
    console.log('   - Supabase PostgreSQL');
    console.log('   - Pure R2 storage');
    console.log('   - Other storage solutions');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  runBenchmarks();
}

export { runBenchmarks };