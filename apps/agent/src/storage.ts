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
   * Get tide data from R2 storage (environment-specific bucket)
   */
  async getTideData(userId: string, tidesId: string): Promise<TideData | null> {
    try {
      const key = this.buildTideKey(userId, tidesId);
      console.log(`[StorageService] Getting tide data: ${key}`);
      
      const object = await this.env.TIDES_R2.get(key);
      if (!object) {
        console.log(`[StorageService] Tide not found: ${key}`);
        return null;
      }

      const tideData = await object.json() as TideData;
      console.log(`[StorageService] Retrieved tide data: ${tideData.name}`);
      return tideData;

    } catch (error) {
      console.error(`[StorageService] Failed to get tide data:`, error);
      return null;
    }
  }

  /**
   * Environment-aware tide data access (same as getTideData)
   */
  async getTideDataFromAnySource(userId: string, tidesId: string): Promise<TideData | null> {
    return this.getTideData(userId, tidesId);
  }

  /**
   * Save tide data to R2 storage
   */
  async saveTideData(userId: string, tidesId: string, data: TideData): Promise<boolean> {
    try {
      const key = this.buildTideKey(userId, tidesId);
      console.log(`[StorageService] Saving tide data: ${key}`);
      
      await this.env.TIDES_R2.put(key, JSON.stringify(data, null, 2), {
        httpMetadata: {
          contentType: 'application/json',
        },
      });
      
      console.log(`[StorageService] Tide data saved successfully: ${key}`);
      return true;

    } catch (error) {
      console.error(`[StorageService] Failed to save tide data:`, error);
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
   * Environment-aware user tides listing (same as listUserTides)
   */
  async listUserTidesFromAllSources(userId: string): Promise<string[]> {
    return this.listUserTides(userId);
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
   * Get bucket information
   */
  async getBucketInfo(): Promise<{ environment: string; bucket: string }> {
    return {
      environment: this.env.ENVIRONMENT || 'development',
      bucket: this.env.R2_BUCKET_NAME || 'tides-r2-bucket'
    };
  }
}