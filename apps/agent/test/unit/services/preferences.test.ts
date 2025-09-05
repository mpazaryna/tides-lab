/**
 * Unit Tests for PreferencesService
 */

import { PreferencesService } from '../../../src/services/preferences';
import type { Env, PreferencesRequest } from '../../../src/types';

describe('PreferencesService', () => {
  let preferencesService: PreferencesService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as any,
      TIDES_R2: {} as any,
      TIDES_AUTH_KV: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      } as any,
      AI: {} as any,
      COORDINATOR: {} as any,
      CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      R2_BUCKET_NAME: 'test-bucket',
      ENVIRONMENT: 'test'
    };

    preferencesService = new PreferencesService(mockEnv);
  });

  describe('getPreferences', () => {
    test('should return default preferences for new user', async () => {
      const result = await preferencesService.getPreferences('test-user');

      expect(result).toBeDefined();
      expect(result.work_hours).toBeDefined();
      expect(result.work_hours?.start).toBe('09:00');
      expect(result.work_hours?.end).toBe('17:00');
      expect(result.break_duration).toBe(15);
      expect(result.focus_time_blocks).toBe(90);
      expect(result.notification_preferences).toBeDefined();
      expect(result.notification_preferences?.insights).toBe(true);
      expect(result.notification_preferences?.optimization).toBe(true);
      expect(result.notification_preferences?.reminders).toBe(true);
    });

    test('should handle KV lookup errors gracefully', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockRejectedValue(new Error('KV error'));

      await expect(preferencesService.getPreferences('test-user'))
        .rejects.toThrow('Failed to retrieve user preferences');
    });
  });

  describe('updatePreferences', () => {
    test('should update work hours preferences', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          work_hours: {
            start: '08:30',
            end: '16:30'
          }
        }
      };

      const result = await preferencesService.updatePreferences(request, 'test-user');

      expect(result.work_hours?.start).toBe('08:30');
      expect(result.work_hours?.end).toBe('16:30');
      expect(result.break_duration).toBe(15); // Should maintain default
      expect(result.focus_time_blocks).toBe(90); // Should maintain default
    });

    test('should update break duration preferences', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          break_duration: 20
        }
      };

      const result = await preferencesService.updatePreferences(request, 'test-user');

      expect(result.break_duration).toBe(20);
      expect(result.work_hours?.start).toBe('09:00'); // Should maintain default
    });

    test('should update focus time blocks preferences', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          focus_time_blocks: 120
        }
      };

      const result = await preferencesService.updatePreferences(request, 'test-user');

      expect(result.focus_time_blocks).toBe(120);
    });

    test('should update notification preferences', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          notification_preferences: {
            insights: false,
            optimization: true,
            reminders: false
          }
        }
      };

      const result = await preferencesService.updatePreferences(request, 'test-user');

      expect(result.notification_preferences?.insights).toBe(false);
      expect(result.notification_preferences?.optimization).toBe(true);
      expect(result.notification_preferences?.reminders).toBe(false);
    });

    test('should update multiple preferences at once', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          work_hours: { start: '07:30', end: '15:30' },
          break_duration: 25,
          focus_time_blocks: 180,
          notification_preferences: {
            insights: true,
            optimization: false,
            reminders: true
          }
        }
      };

      const result = await preferencesService.updatePreferences(request, 'test-user');

      expect(result.work_hours?.start).toBe('07:30');
      expect(result.work_hours?.end).toBe('15:30');
      expect(result.break_duration).toBe(25);
      expect(result.focus_time_blocks).toBe(180);
      expect(result.notification_preferences?.insights).toBe(true);
      expect(result.notification_preferences?.optimization).toBe(false);
      expect(result.notification_preferences?.reminders).toBe(true);
    });

    test('should reject request without preferences data', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123'
      };

      await expect(preferencesService.updatePreferences(request, 'test-user'))
        .rejects.toThrow('Preferences data is required for update');
    });

    test('should validate work hours format', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          work_hours: {
            start: 'invalid-time',
            end: '17:00'
          }
        }
      };

      await expect(preferencesService.updatePreferences(request, 'test-user'))
        .rejects.toThrow('Work hours must be in HH:MM format');
    });

    test('should validate work hours order', async () => {
      const request: PreferencesRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        preferences: {
          work_hours: {
            start: '18:00',
            end: '09:00'
          }
        }
      };

      await expect(preferencesService.updatePreferences(request, 'test-user'))
        .rejects.toThrow('Work start time must be before end time');
    });

    test('should validate break duration range', async () => {
      const invalidDurations = [4, 61, 0, -5];

      for (const duration of invalidDurations) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            break_duration: duration
          }
        };

        await expect(preferencesService.updatePreferences(request, 'test-user'))
          .rejects.toThrow('Break duration must be between 5 and 60 minutes');
      }
    });

    test('should validate focus time blocks range', async () => {
      const invalidBlocks = [14, 241, 0, -10];

      for (const blocks of invalidBlocks) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            focus_time_blocks: blocks
          }
        };

        await expect(preferencesService.updatePreferences(request, 'test-user'))
          .rejects.toThrow('Focus time blocks must be between 15 and 240 minutes');
      }
    });

    test('should accept valid break durations', async () => {
      const validDurations = [5, 15, 30, 60];

      for (const duration of validDurations) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            break_duration: duration
          }
        };

        const result = await preferencesService.updatePreferences(request, 'test-user');
        expect(result.break_duration).toBe(duration);
      }
    });

    test('should accept valid focus time blocks', async () => {
      const validBlocks = [15, 60, 90, 120, 240];

      for (const blocks of validBlocks) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            focus_time_blocks: blocks
          }
        };

        const result = await preferencesService.updatePreferences(request, 'test-user');
        expect(result.focus_time_blocks).toBe(blocks);
      }
    });
  });

  describe('resetPreferences', () => {
    test('should reset to default preferences', async () => {
      const result = await preferencesService.resetPreferences('test-user');

      expect(result.work_hours?.start).toBe('09:00');
      expect(result.work_hours?.end).toBe('17:00');
      expect(result.break_duration).toBe(15);
      expect(result.focus_time_blocks).toBe(90);
      expect(result.notification_preferences?.insights).toBe(true);
      expect(result.notification_preferences?.optimization).toBe(true);
      expect(result.notification_preferences?.reminders).toBe(true);
    });

    test('should handle reset errors', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.put.mockRejectedValue(new Error('KV error'));

      await expect(preferencesService.resetPreferences('test-user'))
        .rejects.toThrow('Failed to reset preferences');
    });
  });

  describe('getPreferenceRecommendations', () => {
    test('should generate preference recommendations', async () => {
      const result = await preferencesService.getPreferenceRecommendations('test-user', 'test-tide-123');

      expect(result).toBeDefined();
      expect(result.recommended_work_hours).toBeDefined();
      expect(result.recommended_work_hours.start).toMatch(/^\d{2}:\d{2}$/);
      expect(result.recommended_work_hours.end).toMatch(/^\d{2}:\d{2}$/);
      expect(result.recommended_break_duration).toBeGreaterThanOrEqual(5);
      expect(result.recommended_break_duration).toBeLessThanOrEqual(60);
      expect(result.recommended_focus_blocks).toBeGreaterThanOrEqual(15);
      expect(result.recommended_focus_blocks).toBeLessThanOrEqual(240);
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);

      result.reasoning.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(20);
      });
    });
  });

  describe('time format validation', () => {
    test('should validate time format correctly', async () => {
      const validTimes = ['09:00', '23:59', '00:00', '12:30'];
      const invalidTimes = ['25:00', '12:60', '9:00', 'invalid', ''];

      for (const time of validTimes) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            work_hours: {
              start: time,
              end: '17:00'
            }
          }
        };

        const result = await preferencesService.updatePreferences(request, 'test-user');
        expect(result.work_hours?.start).toBe(time);
      }

      for (const time of invalidTimes) {
        const request: PreferencesRequest = {
          api_key: 'test-api-key',
          tides_id: 'test-tide-123',
          preferences: {
            work_hours: {
              start: time,
              end: '17:00'
            }
          }
        };

        await expect(preferencesService.updatePreferences(request, 'test-user'))
          .rejects.toThrow('Work hours must be in HH:MM format');
      }
    });
  });
});