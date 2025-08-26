/**
 * Storage Performance Benchmarking Utilities
 * 
 * This module provides tools to benchmark and compare different storage implementations
 * for empirical testing of the D1/R2 hybrid approach vs other storage solutions.
 */

import type { TideStorage, CreateTideInput, Tide } from '../../src/storage/index';

export interface BenchmarkResult {
  operation: string;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successfulOperations: number;
  failedOperations: number;
  throughput: number; // operations per second
}

export interface BenchmarkSuite {
  storageType: string;
  results: BenchmarkResult[];
  totalTime: number;
  summary: {
    totalOperations: number;
    successRate: number;
    averageThroughput: number;
  };
}

export class StorageBenchmark {
  private storage: TideStorage;
  private storageType: string;

  constructor(storage: TideStorage, storageType: string) {
    this.storage = storage;
    this.storageType = storageType;
  }

  async runFullBenchmarkSuite(): Promise<BenchmarkSuite> {
    console.log(`Starting benchmark suite for ${this.storageType}...`);
    
    const results: BenchmarkResult[] = [];
    const suiteStartTime = Date.now();

    // Test 1: Single tide creation
    results.push(await this.benchmarkSingleTideCreation());

    // Test 2: Batch tide creation
    results.push(await this.benchmarkBatchTideCreation(10));
    results.push(await this.benchmarkBatchTideCreation(50));

    // Test 3: Tide retrieval
    const testTides = await this.createTestTides(20);
    results.push(await this.benchmarkTideRetrieval(testTides));

    // Test 4: Tide listing with filters
    results.push(await this.benchmarkTideListing());

    // Test 5: Flow session operations
    results.push(await this.benchmarkFlowSessions(testTides.slice(0, 5)));

    // Test 6: Concurrent operations
    results.push(await this.benchmarkConcurrentOperations());

    const totalTime = Date.now() - suiteStartTime;
    const totalOperations = results.reduce((sum, r) => sum + r.successfulOperations, 0);
    const successRate = results.reduce((sum, r) => sum + r.successfulOperations, 0) / 
                       results.reduce((sum, r) => sum + r.successfulOperations + r.failedOperations, 0);
    const averageThroughput = totalOperations / (totalTime / 1000);

    return {
      storageType: this.storageType,
      results,
      totalTime,
      summary: {
        totalOperations,
        successRate,
        averageThroughput
      }
    };
  }

  private async benchmarkSingleTideCreation(): Promise<BenchmarkResult> {
    const operation = 'Single Tide Creation';
    const iterations = 20;
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < iterations; i++) {
      const input: CreateTideInput = {
        name: `Benchmark Tide ${i}`,
        flow_type: 'daily',
        description: 'Created for benchmarking purposes'
      };

      const startTime = Date.now();
      try {
        await this.storage.createTide(input);
        const duration = Date.now() - startTime;
        times.push(duration);
        successful++;
      } catch (error) {
        failed++;
        console.error(`Failed to create tide ${i}:`, error);
      }
    }

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async benchmarkBatchTideCreation(batchSize: number): Promise<BenchmarkResult> {
    const operation = `Batch Tide Creation (${batchSize})`;
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    // Test if storage supports batch operations
    const storage = this.storage as any;
    if (typeof storage.batchCreateTides === 'function') {
      const inputs: CreateTideInput[] = Array.from({ length: batchSize }, (_, i) => ({
        name: `Batch Tide ${i}`,
        flow_type: 'project',
        description: `Batch creation test ${i}`
      }));

      const startTime = Date.now();
      try {
        await storage.batchCreateTides(inputs);
        const duration = Date.now() - startTime;
        times.push(duration);
        successful = batchSize;
      } catch (error) {
        failed = batchSize;
        console.error('Batch creation failed:', error);
      }
    } else {
      // Fallback to individual creation
      const promises = Array.from({ length: batchSize }, async (_, i) => {
        const input: CreateTideInput = {
          name: `Batch Tide ${i}`,
          flow_type: 'project',
          description: `Batch creation test ${i}`
        };

        const startTime = Date.now();
        try {
          await this.storage.createTide(input);
          const duration = Date.now() - startTime;
          times.push(duration);
          successful++;
        } catch (error) {
          failed++;
        }
      });

      await Promise.all(promises);
    }

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async benchmarkTideRetrieval(testTides: Tide[]): Promise<BenchmarkResult> {
    const operation = 'Tide Retrieval';
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    for (const tide of testTides) {
      const startTime = Date.now();
      try {
        const retrieved = await this.storage.getTide(tide.id);
        const duration = Date.now() - startTime;
        times.push(duration);
        if (retrieved) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Failed to retrieve tide ${tide.id}:`, error);
      }
    }

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async benchmarkTideListing(): Promise<BenchmarkResult> {
    const operation = 'Tide Listing';
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    // Test different filter combinations
    const filterTests = [
      undefined, // No filter
      { active_only: true },
      { flow_type: 'daily' },
      { flow_type: 'project', active_only: true }
    ];

    for (const filter of filterTests) {
      const startTime = Date.now();
      try {
        await this.storage.listTides(filter);
        const duration = Date.now() - startTime;
        times.push(duration);
        successful++;
      } catch (error) {
        failed++;
        console.error('Failed to list tides with filter:', filter, error);
      }
    }

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async benchmarkFlowSessions(testTides: Tide[]): Promise<BenchmarkResult> {
    const operation = 'Flow Session Operations';
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    for (const tide of testTides) {
      // Add a flow session
      const startTime = Date.now();
      try {
        await this.storage.addFlowSession(tide.id, {
          intensity: 'moderate',
          duration: 25,
          started_at: new Date().toISOString(),
          work_context: 'Benchmark testing',
          energy_level: 'medium'
        });
        const duration = Date.now() - startTime;
        times.push(duration);
        successful++;
      } catch (error) {
        failed++;
        console.error(`Failed to add flow session to tide ${tide.id}:`, error);
      }
    }

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async benchmarkConcurrentOperations(): Promise<BenchmarkResult> {
    const operation = 'Concurrent Operations';
    const concurrentCount = 10;
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    const startTime = Date.now();
    const promises = Array.from({ length: concurrentCount }, async (_, i) => {
      try {
        const tide = await this.storage.createTide({
          name: `Concurrent Tide ${i}`,
          flow_type: 'daily',
          description: 'Concurrent creation test'
        });
        
        // Immediately add a flow session
        await this.storage.addFlowSession(tide.id, {
          intensity: 'gentle',
          duration: 15,
          started_at: new Date().toISOString(),
          work_context: 'Concurrent test'
        });
        
        successful++;
      } catch (error) {
        failed++;
        console.error(`Concurrent operation ${i} failed:`, error);
      }
    });

    await Promise.all(promises);
    const totalDuration = Date.now() - startTime;
    times.push(totalDuration);

    return this.calculateBenchmarkResult(operation, times, successful, failed);
  }

  private async createTestTides(count: number): Promise<Tide[]> {
    const tides: Tide[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const tide = await this.storage.createTide({
          name: `Test Tide ${i}`,
          flow_type: i % 2 === 0 ? 'daily' : 'project',
          description: `Test tide for benchmarking ${i}`
        });
        tides.push(tide);
      } catch (error) {
        console.error(`Failed to create test tide ${i}:`, error);
      }
    }

    return tides;
  }

  private calculateBenchmarkResult(
    operation: string,
    times: number[],
    successful: number,
    failed: number
  ): BenchmarkResult {
    if (times.length === 0) {
      return {
        operation,
        totalTime: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        successfulOperations: successful,
        failedOperations: failed,
        throughput: 0
      };
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = successful / (totalTime / 1000);

    return {
      operation,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      successfulOperations: successful,
      failedOperations: failed,
      throughput
    };
  }
}

// Utility function to compare multiple storage implementations
export async function compareStorageImplementations(
  implementations: Array<{ storage: TideStorage; name: string }>
): Promise<BenchmarkSuite[]> {
  const results: BenchmarkSuite[] = [];

  for (const impl of implementations) {
    console.log(`\n=== Benchmarking ${impl.name} ===`);
    const benchmark = new StorageBenchmark(impl.storage, impl.name);
    const suite = await benchmark.runFullBenchmarkSuite();
    results.push(suite);
    
    // Print summary
    console.log(`${impl.name} Summary:`);
    console.log(`- Total Operations: ${suite.summary.totalOperations}`);
    console.log(`- Success Rate: ${(suite.summary.successRate * 100).toFixed(2)}%`);
    console.log(`- Average Throughput: ${suite.summary.averageThroughput.toFixed(2)} ops/sec`);
    console.log(`- Total Time: ${suite.totalTime}ms`);
  }

  return results;
}

// Performance analysis utilities
export function analyzeBenchmarkResults(suites: BenchmarkSuite[]): void {
  console.log('\n=== BENCHMARK ANALYSIS ===\n');

  // Compare by operation type
  const operationTypes = suites[0]?.results.map(r => r.operation) || [];
  
  for (const operation of operationTypes) {
    console.log(`\n${operation}:`);
    
    suites.forEach(suite => {
      const result = suite.results.find(r => r.operation === operation);
      if (result) {
        console.log(`  ${suite.storageType}:`);
        console.log(`    Average: ${result.averageTime}ms`);
        console.log(`    Throughput: ${result.throughput.toFixed(2)} ops/sec`);
        console.log(`    Success Rate: ${(result.successfulOperations / (result.successfulOperations + result.failedOperations) * 100).toFixed(1)}%`);
      }
    });
  }

  // Overall comparison
  console.log('\n=== OVERALL COMPARISON ===');
  suites.forEach(suite => {
    console.log(`\n${suite.storageType}:`);
    console.log(`  Total Operations: ${suite.summary.totalOperations}`);
    console.log(`  Success Rate: ${(suite.summary.successRate * 100).toFixed(2)}%`);
    console.log(`  Average Throughput: ${suite.summary.averageThroughput.toFixed(2)} ops/sec`);
    console.log(`  Total Time: ${suite.totalTime}ms`);
  });

  // Recommendations
  const bestThroughput = suites.reduce((best, suite) => 
    suite.summary.averageThroughput > best.summary.averageThroughput ? suite : best
  );
  
  const bestReliability = suites.reduce((best, suite) => 
    suite.summary.successRate > best.summary.successRate ? suite : best
  );

  console.log('\n=== RECOMMENDATIONS ===');
  console.log(`Best Throughput: ${bestThroughput.storageType} (${bestThroughput.summary.averageThroughput.toFixed(2)} ops/sec)`);
  console.log(`Most Reliable: ${bestReliability.storageType} (${(bestReliability.summary.successRate * 100).toFixed(2)}% success rate)`);
}