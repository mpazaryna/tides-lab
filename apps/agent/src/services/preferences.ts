/**
 * Preferences Service - Mock Implementation
 * Manages user preferences and settings
 */

import type { Env, PreferencesRequest, UserPreferences } from '../types.js';

export class PreferencesService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Get user preferences from KV storage
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    console.log(`[PreferencesService] Retrieving preferences for user: ${userId}`);
    
    try {
      // Try to get preferences from KV storage
      const preferencesData = await this.env.TIDES_AUTH_KV.get(`preferences:${userId}`);
      
      if (preferencesData) {
        const storedPreferences = JSON.parse(preferencesData) as UserPreferences;
        console.log(`[PreferencesService] Found stored preferences for user: ${userId}`);
        return storedPreferences;
      }
      
      // Return defaults if no stored preferences
      const defaultPreferences: UserPreferences = {
        work_hours: {
          start: "09:00",
          end: "17:00"
        },
        break_duration: 15, // minutes
        focus_time_blocks: 90, // minutes
        notification_preferences: {
          insights: true,
          optimization: true,
          reminders: true
        }
      };

      console.log(`[PreferencesService] No stored preferences found, returning defaults for user: ${userId}`);
      return defaultPreferences;

    } catch (error) {
      console.error(`[PreferencesService] Failed to retrieve preferences:`, error);
      throw new Error('Failed to retrieve user preferences');
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(request: PreferencesRequest, userId: string): Promise<UserPreferences> {
    console.log(`[PreferencesService] Updating preferences for user: ${userId}`);
    
    if (!request.preferences) {
      throw new Error('Preferences data is required for update');
    }

    try {
      // Get current preferences
      const currentPreferences = await this.getPreferences(userId);
      
      // Merge with new preferences
      const updatedPreferences: UserPreferences = {
        ...currentPreferences,
        ...request.preferences
      };

      // Validate preferences
      const validationError = this.validatePreferences(updatedPreferences);
      if (validationError) {
        throw new Error(validationError);
      }

      // Store updated preferences in KV storage
      await this.env.TIDES_AUTH_KV.put(`preferences:${userId}`, JSON.stringify(updatedPreferences));

      console.log(`[PreferencesService] Preferences updated for user: ${userId}`);
      console.log(`[PreferencesService] Work hours: ${updatedPreferences.work_hours?.start} - ${updatedPreferences.work_hours?.end}`);
      
      return updatedPreferences;

    } catch (error) {
      console.error(`[PreferencesService] Failed to update preferences:`, error);
      throw error;
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(userId: string): Promise<UserPreferences> {
    console.log(`[PreferencesService] Resetting preferences to defaults for user: ${userId}`);
    
    const defaultPreferences: UserPreferences = {
      work_hours: {
        start: "09:00",
        end: "17:00"
      },
      break_duration: 15,
      focus_time_blocks: 90,
      notification_preferences: {
        insights: true,
        optimization: true,
        reminders: true
      }
    };

    try {
      // TODO: Replace with real KV storage
      // await this.env.TIDES_AUTH_KV.put(`preferences:${userId}`, JSON.stringify(defaultPreferences));

      console.log(`[PreferencesService] Preferences reset to defaults for user: ${userId}`);
      return defaultPreferences;

    } catch (error) {
      console.error(`[PreferencesService] Failed to reset preferences:`, error);
      throw new Error('Failed to reset preferences');
    }
  }

  /**
   * Get preference recommendations based on usage patterns
   */
  async getPreferenceRecommendations(userId: string, tidesId: string): Promise<{
    recommended_work_hours: { start: string; end: string };
    recommended_break_duration: number;
    recommended_focus_blocks: number;
    reasoning: string[];
  }> {
    console.log(`[PreferencesService] Generating preference recommendations for user: ${userId}`);
    
    // TODO: Analyze user's productivity patterns to generate real recommendations
    // For now, return mock recommendations
    
    const recommendations = {
      recommended_work_hours: {
        start: "08:30",
        end: "16:30"
      },
      recommended_break_duration: 20,
      recommended_focus_blocks: 120,
      reasoning: [
        "Your productivity data shows peak performance 30 minutes earlier than current settings",
        "Longer breaks (20 min vs 15 min) correlate with sustained afternoon productivity in your patterns",
        "Extended focus blocks (2 hours) align with your natural concentration cycles",
        "Earlier end time allows for better work-life balance while maintaining productivity"
      ]
    };

    console.log(`[PreferencesService] Generated recommendations for user: ${userId}`);
    return recommendations;
  }

  /**
   * Validate preferences data
   */
  private validatePreferences(preferences: UserPreferences): string | null {
    // Validate work hours
    if (preferences.work_hours) {
      const start = preferences.work_hours.start;
      const end = preferences.work_hours.end;
      
      if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
        return 'Work hours must be in HH:MM format';
      }
      
      if (start >= end) {
        return 'Work start time must be before end time';
      }
    }

    // Validate break duration
    if (preferences.break_duration !== undefined) {
      if (preferences.break_duration < 5 || preferences.break_duration > 60) {
        return 'Break duration must be between 5 and 60 minutes';
      }
    }

    // Validate focus time blocks
    if (preferences.focus_time_blocks !== undefined) {
      if (preferences.focus_time_blocks < 15 || preferences.focus_time_blocks > 240) {
        return 'Focus time blocks must be between 15 and 240 minutes';
      }
    }

    return null;
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}