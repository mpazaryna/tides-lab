/**
 * R2 Storage utilities for Tides Agent
 * Simple environment-specific storage using TIDES_R2 bucket
 */

import type { Env, TideData } from './types.js';

export class StorageService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    console.log(`[StorageService] Initialized for environment: ${env.ENVIRONMENT || 'development'}`);
  }

  /**
   * Build standardized R2 key for tide data
   */
  private buildTideKey(userId: string, tidesId: string): string {
    return `users/${userId}/tides/${tidesId}.json`;
  }

  /**
   * Extract tide IDs from R2 object keys
   */
  private extractTideIdsFromKeys(objects: Array<{ key: string }>, userId: string): string[] {
    return objects.map(obj => {
      const parts = obj.key.split('/');
      const filename = parts[parts.length - 1];
      
      if (!filename || !filename.endsWith('.json')) {
        return '';
      }
      
      if (parts.length >= 3 && parts[1] !== userId) {
        return '';
      }
      
      return filename.replace('.json', '');
    }).filter(id => id !== '');
  }

  /**
   * Get tide data from R2 storage
   */
  async getTideData(userId: string, tidesId: string): Promise<TideData | null> {
    try {
      // First try the standard path
      const standardKey = `users/${userId}/tides/${tidesId}.json`;
      console.log(`[StorageService] Fetching tide data: ${standardKey}`);
      
      let object = await this.env.TIDES_R2.get(standardKey);
      
      // If not found at standard path, try the mock data location
      if (!object) {
        const mockKey = 'mock-tide-data.json';
        console.log(`[StorageService] Standard path not found, trying mock data: ${mockKey}`);
        object = await this.env.TIDES_R2.get(mockKey);
      }
      
      if (!object) {
        console.log(`[StorageService] Tide not found at either location`);
        return null;
      }

      const tideData = await object.json<TideData>();
      console.log(`[StorageService] Tide data retrieved: ${tideData.name}`);
      
      return tideData;

    } catch (error) {
      console.error(`[StorageService] Failed to fetch tide data:`, error);
      return null;
    }
  }

  /**
   * Store tide data in R2
   */
  async storeTideData(userId: string, tidesId: string, data: TideData): Promise<boolean> {
    try {
      const key = this.buildTideKey(userId, tidesId);
      console.log(`[StorageService] Storing tide data: ${key}`);
      
      await this.env.TIDES_R2.put(key, JSON.stringify(data, null, 2), {
        httpMetadata: {
          contentType: 'application/json'
        }
      });

      console.log(`[StorageService] Tide data stored successfully: ${key}`);
      return true;

    } catch (error) {
      console.error(`[StorageService] Failed to store tide data:`, error);
      return false;
    }
  }

  /**
   * List all tides for a user
   */
  async listUserTides(userId: string): Promise<string[]> {
    try {
      const prefix = `users/${userId}/tides/`;
      console.log(`[StorageService] Listing tides for user: ${userId}`);
      
      const objects = await this.env.TIDES_R2.list({ prefix });
      
      const tideIds = this.extractTideIdsFromKeys(objects.objects, userId);

      console.log(`[StorageService] Found ${tideIds.length} tides for user: ${userId}`);
      return tideIds;

    } catch (error) {
      console.error(`[StorageService] Failed to list user tides:`, error);
      return [];
    }
  }

  /**
   * Delete tide data from R2
   */
  async deleteTideData(userId: string, tidesId: string): Promise<boolean> {
    try {
      const key = this.buildTideKey(userId, tidesId);
      console.log(`[StorageService] Deleting tide data: ${key}`);
      
      await this.env.TIDES_R2.delete(key);
      
      console.log(`[StorageService] Tide data deleted successfully: ${key}`);
      return true;

    } catch (error) {
      console.error(`[StorageService] Failed to delete tide data:`, error);
      return false;
    }
  }

  /**
   * Check if tide exists
   */
  async tideExists(userId: string, tidesId: string): Promise<boolean> {
    try {
      const key = this.buildTideKey(userId, tidesId);
      const object = await this.env.TIDES_R2.head(key);
      return object !== null;

    } catch (error) {
      console.error(`[StorageService] Failed to check tide existence:`, error);
      return false;
    }
  }

  /**
   * Get tide data from a specific server bucket
   */
  async getTideDataFromServer(userId: string, tidesId: string, serverBucket: ServerBucketName): Promise<TideData | null> {
    try {
      // Validate server bucket name
      if (!SERVER_BUCKETS.includes(serverBucket)) {
        throw new Error(`Invalid server bucket: ${serverBucket}`);
      }

      // Get the bucket reference
      const bucket = this.env[serverBucket];
      if (!bucket) {
        console.log(`[StorageService] Server bucket ${serverBucket} not available`);
        return null;
      }

      const key = this.buildTideKey(userId, tidesId);
      console.log(`[StorageService] Fetching tide data from ${serverBucket}: ${key}`);
      
      const object = await bucket.get(key);
      
      if (!object) {
        console.log(`[StorageService] Tide not found in ${serverBucket}: ${key}`);
        return null;
      }

      const tideData = await object.json<TideData>();
      console.log(`[StorageService] Tide data retrieved from ${serverBucket}: ${tideData.name}`);
      
      return tideData;

    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid server bucket')) {
        throw error; // Re-throw validation errors
      }
      console.error(`[StorageService] Failed to fetch tide data from ${serverBucket}:`, error);
      return null;
    }
  }

  /**
   * Get tide data from any available source (agent bucket first, then server buckets)
   */
  async getTideDataFromAnySource(userId: string, tidesId: string): Promise<TideData | null> {
    try {
      // First try the agent bucket (priority)
      const agentData = await this.getTideData(userId, tidesId);
      if (agentData) {
        console.log(`[StorageService] Found tide data in agent bucket: ${tidesId}`);
        return agentData;
      }

      // Try each server bucket in order
      for (const serverBucket of SERVER_BUCKETS) {
        try {
          const serverData = await this.getTideDataFromServer(userId, tidesId, serverBucket);
          if (serverData) {
            console.log(`[StorageService] Found tide data in ${serverBucket}: ${tidesId}`);
            return serverData;
          }
        } catch (error) {
          console.error(`[StorageService] Error accessing ${serverBucket}, continuing to next:`, error);
          continue;
        }
      }

      console.log(`[StorageService] Tide not found in any source: ${tidesId}`);
      return null;

    } catch (error) {
      console.error(`[StorageService] Failed to fetch tide data from any source:`, error);
      return null;
    }
  }

  /**
   * List all tides for a user from all available sources
   */
  async listUserTidesFromAllSources(userId: string): Promise<string[]> {
    const allTideIds = new Set<string>();

    try {
      // Get tides from agent bucket
      try {
        const agentTides = await this.listUserTides(userId);
        agentTides.forEach(id => allTideIds.add(id));
        console.log(`[StorageService] Found ${agentTides.length} tides in agent bucket`);
      } catch (error) {
        console.error(`[StorageService] Error listing tides from agent bucket:`, error);
      }

      // Get tides from each server bucket
      for (const serverBucketName of SERVER_BUCKETS) {
        try {
          const bucket = this.env[serverBucketName];
          if (!bucket) {
            console.log(`[StorageService] Server bucket ${serverBucketName} not available`);
            continue;
          }

          const prefix = `users/${userId}/tides/`;
          const objects = await bucket.list({ prefix });
          
          const tideIds = this.extractTideIdsFromKeys(objects.objects, userId);
          tideIds.forEach(id => allTideIds.add(id));
          console.log(`[StorageService] Found ${tideIds.length} tides in ${serverBucketName}`);

        } catch (error) {
          console.error(`[StorageService] Error listing tides from ${serverBucketName}:`, error);
        }
      }

      const result = Array.from(allTideIds);
      console.log(`[StorageService] Total unique tides found: ${result.length}`);
      return result;

    } catch (error) {
      console.error(`[StorageService] Failed to list user tides from all sources:`, error);
      return [];
    }
  }

  /**
   * Get information about available buckets
   */
  async getBucketInfo(): Promise<{ agent: string; servers: readonly ServerBucketName[] }> {
    return {
      agent: 'TIDES_R2',
      servers: SERVER_BUCKETS
    };
  }
}