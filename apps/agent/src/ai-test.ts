/**
 * Isolated AI Model Testing - Direct Worker Handler
 * Test endpoint: /ai-test
 */

import { runWithTools } from '@cloudflare/ai-utils';
import type { Env } from './types.js';

export class AITester {
  constructor(private env: Env) {}

  async testBasicAI(): Promise<any> {
    console.log('[AITester] Starting basic AI test...');
    
    try {
      const startTime = Date.now();
      
      // Test 1: Simple direct AI call (no runWithTools)
      console.log('[AITester] Testing direct AI call...');
      const directResult = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
          { role: 'user', content: 'Say hello in exactly 5 words.' }
        ],
        max_tokens: 50
      });

      const directTime = Date.now() - startTime;
      console.log(`[AITester] Direct AI call completed in ${directTime}ms`);
      
      return {
        success: true,
        test_type: 'direct_ai',
        processing_time_ms: directTime,
        response: directResult.response || directResult,
        model: '@cf/meta/llama-3.1-8b-instruct'
      };

    } catch (error) {
      console.error('[AITester] AI test failed:', error);
      return {
        success: false,
        test_type: 'direct_ai',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }

  async testRunWithTools(): Promise<any> {
    console.log('[AITester] Testing runWithTools...');
    
    try {
      const startTime = Date.now();
      
      // Test 2: Using runWithTools (what we were using before)
      const toolsResult = await runWithTools(this.env.AI, {
        model: '@cf/meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
          { role: 'user', content: 'Say hello in exactly 5 words.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      });

      const toolsTime = Date.now() - startTime;
      console.log(`[AITester] runWithTools completed in ${toolsTime}ms`);
      
      return {
        success: true,
        test_type: 'run_with_tools',
        processing_time_ms: toolsTime,
        response: toolsResult?.response || toolsResult,
        model: '@cf/meta/llama-3.1-8b-instruct'
      };

    } catch (error) {
      console.error('[AITester] runWithTools test failed:', error);
      return {
        success: false,
        test_type: 'run_with_tools',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }

  async testStreamingAI(): Promise<any> {
    console.log('[AITester] Testing streaming AI...');
    
    try {
      const startTime = Date.now();
      
      // Test 3: Streaming approach (recommended)
      const stream = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
          { role: 'user', content: 'Say hello in exactly 5 words.' }
        ],
        max_tokens: 50,
        stream: true
      });

      let fullResponse = '';
      const reader = stream.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.response) {
                  fullResponse += data.response;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const streamTime = Date.now() - startTime;
      console.log(`[AITester] Streaming AI completed in ${streamTime}ms`);
      
      return {
        success: true,
        test_type: 'streaming_ai',
        processing_time_ms: streamTime,
        response: fullResponse,
        model: '@cf/meta/llama-3.1-8b-instruct'
      };

    } catch (error) {
      console.error('[AITester] Streaming test failed:', error);
      return {
        success: false,
        test_type: 'streaming_ai',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }

  async runAllTests(): Promise<any> {
    console.log('[AITester] Running comprehensive AI tests...');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: this.env.ENVIRONMENT,
      tests: [] as any[]
    };

    // Run tests sequentially to avoid resource conflicts
    results.tests.push(await this.testBasicAI());
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second gap
    
    results.tests.push(await this.testRunWithTools());
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second gap
    
    results.tests.push(await this.testStreamingAI());

    // Summary
    const successful = results.tests.filter(t => t.success).length;
    const total = results.tests.length;
    
    return {
      ...results,
      summary: {
        total_tests: total,
        successful: successful,
        failed: total - successful,
        success_rate: `${Math.round((successful / total) * 100)}%`
      }
    };
  }
}