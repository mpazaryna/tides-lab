/**
 * Preferences Store Service - Manages user preferences in Durable Object storage
 */

import type { UserPreferences } from '../types';

export class PreferencesStore {
  private storage: DurableObjectStorage;

  constructor(storage: DurableObjectStorage) {
    this.storage = storage;
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const key = `user_preferences:${userId}`;
      const preferences = await this.storage.get(key) as UserPreferences;
      
      if (!preferences) {
        return null;
      }

      // Validate and return with defaults
      return this.validateAndNormalizePreferences(preferences);

    } catch (error) {
      console.error(`[PreferencesStore] Failed to get preferences for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<boolean> {
    try {
      const key = `user_preferences:${userId}`;
      const normalizedPreferences = this.validateAndNormalizePreferences(preferences);
      
      await this.storage.put(key, normalizedPreferences);
      
      console.log(`[PreferencesStore] Updated preferences for ${userId}`);
      return true;

    } catch (error) {
      console.error(`[PreferencesStore] Failed to update preferences for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      const key = `user_preferences:${userId}`;
      await this.storage.delete(key);
      
      console.log(`[PreferencesStore] Deleted preferences for ${userId}`);
      return true;

    } catch (error) {
      console.error(`[PreferencesStore] Failed to delete preferences for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get default preferences for new users
   */
  getDefaultPreferences(): UserPreferences {
    return {
      notificationFrequency: 'daily',
      analysisDepth: 'detailed',
      autoImplement: false,
      confidenceThreshold: 0.7,
      energyGoals: ['maintain_focus', 'optimize_breaks']
    };
  }

  /**
   * Validate and normalize preferences with defaults
   */
  private validateAndNormalizePreferences(preferences: UserPreferences): UserPreferences {
    const defaults = this.getDefaultPreferences();
    
    return {
      preferredTimeBlocks: preferences.preferredTimeBlocks || defaults.preferredTimeBlocks,
      energyGoals: Array.isArray(preferences.energyGoals) ? preferences.energyGoals : defaults.energyGoals,
      notificationFrequency: this.isValidFrequency(preferences.notificationFrequency) 
        ? preferences.notificationFrequency 
        : defaults.notificationFrequency,
      analysisDepth: this.isValidDepth(preferences.analysisDepth) 
        ? preferences.analysisDepth 
        : defaults.analysisDepth,
      autoImplement: typeof preferences.autoImplement === 'boolean' 
        ? preferences.autoImplement 
        : defaults.autoImplement,
      confidenceThreshold: this.isValidConfidence(preferences.confidenceThreshold)
        ? preferences.confidenceThreshold
        : defaults.confidenceThreshold
    };
  }

  /**
   * Validate notification frequency
   */
  private isValidFrequency(frequency: any): frequency is 'hourly' | 'daily' | 'weekly' {
    return ['hourly', 'daily', 'weekly'].includes(frequency);
  }

  /**
   * Validate analysis depth
   */
  private isValidDepth(depth: any): depth is 'basic' | 'detailed' | 'comprehensive' {
    return ['basic', 'detailed', 'comprehensive'].includes(depth);
  }

  /**
   * Validate confidence threshold
   */
  private isValidConfidence(threshold: any): threshold is number {
    return typeof threshold === 'number' && threshold >= 0 && threshold <= 1;
  }
}