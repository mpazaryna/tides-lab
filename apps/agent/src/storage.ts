/**
 * R2 Storage utilities for Tides Agent
 */

import type { Env, TideData } from './types.js';

export class StorageService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
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
      const key = `users/${userId}/tides/${tidesId}.json`;
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
      
      const tideIds = objects.objects.map(obj => {
        // Extract tide ID from key: users/{userId}/tides/{tideId}.json
        const parts = obj.key.split('/');
        const filename = parts[parts.length - 1];
        
        // Only process files that end with .json and belong to the correct user
        if (!filename || !filename.endsWith('.json')) {
          return '';
        }
        
        // Verify the path belongs to the correct user (defensive programming)
        if (parts.length >= 3 && parts[1] !== userId) {
          return '';
        }
        
        return filename.replace('.json', '');
      }).filter(id => id !== '');

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
      const key = `users/${userId}/tides/${tidesId}.json`;
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
      const key = `users/${userId}/tides/${tidesId}.json`;
      const object = await this.env.TIDES_R2.head(key);
      return object !== null;

    } catch (error) {
      console.error(`[StorageService] Failed to check tide existence:`, error);
      return false;
    }
  }
}