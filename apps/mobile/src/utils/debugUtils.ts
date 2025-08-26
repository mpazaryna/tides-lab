interface DebugTestDependencies {
  getCurrentServerUrl: () => string;
  currentEnvironment: string;
  isConnected: boolean;
  environments: Record<string, { name: string; url: string }>;
  switchEnvironment: (env: any) => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
}

/**
 * Run basic debug tests for server URL functionality
 */
export const runBasicDebugTests = ({
  getCurrentServerUrl,
  currentEnvironment,
  isConnected,
  environments,
}: Pick<DebugTestDependencies, 'getCurrentServerUrl' | 'currentEnvironment' | 'isConnected' | 'environments'>): string[] => {
  const results: string[] = [];

  // Test 1: Basic URL retrieval
  results.push("=== Test 1: Basic getCurrentServerUrl ===");
  const currentUrl = getCurrentServerUrl();
  results.push(`✓ Current URL: ${currentUrl}`);
  results.push(`✓ Current Environment: ${currentEnvironment}`);

  // Test 2: URL consistency check
  results.push("\n=== Test 2: URL Consistency ===");
  const url1 = getCurrentServerUrl();
  const url2 = getCurrentServerUrl();
  const url3 = getCurrentServerUrl();
  results.push(`✓ Call 1: ${url1}`);
  results.push(`✓ Call 2: ${url2}`);
  results.push(`✓ Call 3: ${url3}`);
  results.push(
    `✓ Consistent: ${url1 === url2 && url2 === url3 ? "YES" : "NO"}`
  );

  // Test 3: Connection state
  results.push("\n=== Test 3: Connection State ===");
  results.push(`✓ Is Connected: ${isConnected}`);
  results.push(`✓ URL Available: ${currentUrl ? "YES" : "NO"}`);

  // Test 4: Environment details
  results.push("\n=== Test 4: Environment Details ===");
  const envCount = Object.keys(environments).length;
  results.push(`✓ Available Environments: ${envCount}`);
  Object.values(environments).forEach((env) => {
    results.push(`  - ${env.name}: ${env.url}`);
  });

  return results;
};

/**
 * Test URL validation and format requirements
 */
export const testUrlValidation = (getCurrentServerUrl: () => string): string[] => {
  const results: string[] = [];
  
  results.push("Test: URL validation");
  const url = getCurrentServerUrl();
  results.push(`✓ URL is not null: ${url !== null}`);
  results.push(`✓ URL is not undefined: ${url !== undefined}`);
  results.push(`✓ URL is not empty: ${url !== ""}`);
  results.push(`✓ URL starts with https://: ${url.startsWith("https://")}`);
  results.push(`✓ URL contains workers.dev: ${url.includes("workers.dev")}`);
  
  return results;
};

/**
 * Test rapid successive calls for consistency
 */
export const testRapidCalls = (getCurrentServerUrl: () => string): string[] => {
  const results: string[] = [];
  
  results.push("Test: Rapid successive calls (100x)");
  const rapidUrls = new Set();
  for (let i = 0; i < 100; i++) {
    rapidUrls.add(getCurrentServerUrl());
  }
  results.push(`✓ Unique URLs returned: ${rapidUrls.size}`);
  results.push(`✓ Consistent: ${rapidUrls.size === 1 ? "YES" : "NO"}`);
  
  return results;
};

/**
 * Test environment switching functionality
 */
export const testEnvironmentSwitching = async ({
  getCurrentServerUrl,
  currentEnvironment,
  environments,
  switchEnvironment,
}: Pick<DebugTestDependencies, 'getCurrentServerUrl' | 'currentEnvironment' | 'environments' | 'switchEnvironment'>): Promise<string[]> => {
  const results: string[] = [];
  
  results.push("Test: Environment switching");
  const originalEnv = currentEnvironment;
  const originalUrl = getCurrentServerUrl();
  results.push(`✓ Original environment: ${originalEnv}`);

  try {
    // Try switching to a different environment
    const envKeys = Object.keys(environments);
    const differentEnv = envKeys.find((key) => key !== originalEnv);

    if (differentEnv) {
      results.push(`✓ Switching to: ${differentEnv}`);
      await switchEnvironment(differentEnv as any);

      const newUrl = getCurrentServerUrl();
      results.push(`✓ New URL after switch: ${newUrl}`);
      results.push(`✓ URLs are different: ${originalUrl !== newUrl ? "YES" : "NO"}`);

      // Switch back
      await switchEnvironment(originalEnv as any);
      const restoredUrl = getCurrentServerUrl();
      results.push(`✓ Restored URL: ${restoredUrl}`);
      results.push(
        `✓ Back to original: ${restoredUrl === originalUrl ? "YES" : "NO"}`
      );
    }
  } catch (switchError) {
    results.push(`✗ Error during switch: ${switchError}`);
  }
  
  return results;
};

/**
 * Test invalid URL update attempts
 */
export const testInvalidUrlUpdates = async (updateServerUrl: (url: string) => Promise<void>): Promise<string[]> => {
  const results: string[] = [];
  
  results.push("Test: Invalid URL update");
  
  try {
    await updateServerUrl("");
    results.push("✗ Empty URL accepted (should fail)");
  } catch {
    results.push("✓ Empty URL rejected");
  }

  try {
    await updateServerUrl("not-a-url");
    results.push("✗ Invalid URL accepted (should fail)");
  } catch {
    results.push("✓ Invalid URL rejected");
  }
  
  return results;
};

/**
 * Test performance with multiple calls
 */
export const testPerformance = (getCurrentServerUrl: () => string): string[] => {
  const results: string[] = [];
  
  results.push("Test: Performance (1000 calls)");
  const startTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    getCurrentServerUrl();
  }
  const endTime = Date.now();
  const duration = endTime - startTime;
  results.push(`✓ 1000 calls completed in ${duration}ms`);
  results.push(`✓ Average per call: ${(duration / 1000).toFixed(2)}ms`);
  
  return results;
};

/**
 * Run all edge case tests
 */
export const runEdgeCaseTests = async (dependencies: DebugTestDependencies): Promise<string[]> => {
  const results: string[] = [];

  results.push("=== Edge Case Tests ===\n");

  // Edge Case 1: Rapid calls
  results.push(...testRapidCalls(dependencies.getCurrentServerUrl));

  // Edge Case 2: URL validation
  results.push("\n");
  results.push(...testUrlValidation(dependencies.getCurrentServerUrl));

  // Edge Case 3: Environment switching
  results.push("\n");
  const switchResults = await testEnvironmentSwitching(dependencies);
  results.push(...switchResults);

  // Edge Case 4: Invalid URL updates
  results.push("\n");
  const invalidUrlResults = await testInvalidUrlUpdates(dependencies.updateServerUrl);
  results.push(...invalidUrlResults);

  // Edge Case 5: Performance test
  results.push("\n");
  results.push(...testPerformance(dependencies.getCurrentServerUrl));

  return results;
};