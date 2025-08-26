/**
 * NotificationService Tests
 * 
 * Test suite for notification management service
 */

import { NotificationService } from '../../src/services/NotificationService';

// Mock LoggingService
jest.mock('../../src/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear all notifications before each test
    NotificationService.hideAll();
    jest.clearAllMocks();
  });

  describe('Basic Notification Management', () => {
    it('should show a notification', () => {
      const id = NotificationService.show({
        type: 'info',
        message: 'Test notification',
      });

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^notification_\d+_/);

      const notifications = NotificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('Test notification');
      expect(notifications[0].type).toBe('info');
    });

    it('should hide a specific notification', () => {
      const id = NotificationService.show({
        type: 'info',
        message: 'Test notification',
      });

      expect(NotificationService.getNotifications()).toHaveLength(1);

      NotificationService.hide(id);
      expect(NotificationService.getNotifications()).toHaveLength(0);
    });

    it('should hide all notifications', () => {
      NotificationService.show({ type: 'info', message: 'First' });
      NotificationService.show({ type: 'warning', message: 'Second' });
      
      expect(NotificationService.getNotifications()).toHaveLength(2);

      NotificationService.hideAll();
      expect(NotificationService.getNotifications()).toHaveLength(0);
    });
  });

  describe('Notification Types', () => {
    it('should create success notifications', () => {
      NotificationService.success('Success message', 'Success Title');
      
      const notifications = NotificationService.getNotifications();
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Success message');
      expect(notifications[0].title).toBe('Success Title');
      expect(notifications[0].duration).toBe(3000);
    });

    it('should create error notifications', () => {
      NotificationService.error('Error message', 'Error Title');
      
      const notifications = NotificationService.getNotifications();
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toBe('Error message');
      expect(notifications[0].title).toBe('Error Title');
      expect(notifications[0].duration).toBe(5000);
      expect(notifications[0].persistent).toBe(true);
    });

    it('should create warning notifications', () => {
      NotificationService.warning('Warning message', 'Warning Title');
      
      const notifications = NotificationService.getNotifications();
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toBe('Warning message');
      expect(notifications[0].title).toBe('Warning Title');
      expect(notifications[0].duration).toBe(4000);
    });

    it('should create info notifications', () => {
      NotificationService.info('Info message', 'Info Title');
      
      const notifications = NotificationService.getNotifications();
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Info message');
      expect(notifications[0].title).toBe('Info Title');
      expect(notifications[0].duration).toBe(4000);
    });
  });

  describe('Notification Queuing', () => {
    it('should queue notifications when max visible reached', () => {
      // Show notifications up to the limit (3)
      NotificationService.show({ type: 'info', message: 'First' });
      NotificationService.show({ type: 'info', message: 'Second' });
      NotificationService.show({ type: 'info', message: 'Third' });
      
      expect(NotificationService.getNotifications()).toHaveLength(3);

      // This should be queued
      NotificationService.show({ type: 'info', message: 'Fourth' });
      expect(NotificationService.getNotifications()).toHaveLength(3);
    });

    it('should process queue when notification is dismissed', (done) => {
      // Fill up visible notifications
      const id1 = NotificationService.show({ type: 'info', message: 'First' });
      NotificationService.show({ type: 'info', message: 'Second' });
      NotificationService.show({ type: 'info', message: 'Third' });
      
      // Queue another notification
      NotificationService.show({ type: 'info', message: 'Queued' });

      // Subscribe to changes to verify queue processing
      const unsubscribe = NotificationService.subscribe((notifications) => {
        if (notifications.length === 3 && notifications.some(n => n.message === 'Queued')) {
          expect(notifications.find(n => n.message === 'Queued')).toBeDefined();
          unsubscribe();
          done();
        }
      });

      // Hide one notification to trigger queue processing
      NotificationService.hide(id1);
    });
  });

  describe('Event Subscription', () => {
    it('should notify subscribers of notification changes', (done) => {
      const unsubscribe = NotificationService.subscribe((notifications) => {
        expect(notifications).toHaveLength(1);
        expect(notifications[0].message).toBe('Subscription test');
        unsubscribe();
        done();
      });

      NotificationService.show({
        type: 'info',
        message: 'Subscription test',
      });
    });

    it('should allow unsubscribing from events', () => {
      const mockCallback = jest.fn();
      const unsubscribe = NotificationService.subscribe(mockCallback);
      
      // First notification should trigger callback
      NotificationService.show({ type: 'info', message: 'First' });
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Unsubscribe and verify no more callbacks
      unsubscribe();
      NotificationService.show({ type: 'info', message: 'Second' });
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert Compatibility', () => {
    it('should handle alert method for backward compatibility', () => {
      NotificationService.alert('Alert Title', 'Alert message');
      
      const notifications = NotificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Alert Title');
      expect(notifications[0].message).toBe('Alert message');
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].persistent).toBe(true);
    });

    it('should handle destructive alert buttons', () => {
      NotificationService.alert('Alert Title', 'Alert message', [
        { text: 'Delete', style: 'destructive' },
      ]);
      
      const notifications = NotificationService.getNotifications();
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].action?.label).toBe('Delete');
    });

    it('should warn about multiple buttons in alert', () => {
      const { LoggingService } = require('../../src/services/LoggingService');
      
      NotificationService.alert('Alert Title', 'Alert message', [
        { text: 'OK' },
        { text: 'Cancel' },
      ]);
      
      expect(LoggingService.warn).toHaveBeenCalledWith(
        'NotificationService',
        'Multiple alert buttons not fully supported',
        { buttonCount: 2 }
      );
    });
  });

  describe('Notification Options', () => {
    it('should handle custom notification options', () => {
      const actionMock = jest.fn();
      
      NotificationService.show({
        type: 'success',
        title: 'Custom Title',
        message: 'Custom message',
        duration: 1000,
        position: 'bottom',
        persistent: true,
        action: {
          label: 'Action',
          onPress: actionMock,
        },
        testID: 'custom-notification',
      });

      const notifications = NotificationService.getNotifications();
      const notification = notifications[0];
      
      expect(notification.title).toBe('Custom Title');
      expect(notification.duration).toBe(1000);
      expect(notification.position).toBe('bottom');
      expect(notification.persistent).toBe(true);
      expect(notification.action?.label).toBe('Action');
      expect(notification.testID).toBe('custom-notification');
    });

    it('should apply default values for optional properties', () => {
      NotificationService.show({
        message: 'Basic notification',
      });

      const notifications = NotificationService.getNotifications();
      const notification = notifications[0];
      
      expect(notification.type).toBe('info');
      expect(notification.duration).toBe(4000);
      expect(notification.position).toBe('top');
      expect(notification.persistent).toBe(false);
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs for notifications', () => {
      const id1 = NotificationService.show({ message: 'First' });
      const id2 = NotificationService.show({ message: 'Second' });
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^notification_\d+_/);
      expect(id2).toMatch(/^notification_\d+_/);
    });
  });

  describe('Error Handling', () => {
    it('should handle hide() with non-existent ID gracefully', () => {
      expect(() => {
        NotificationService.hide('non-existent-id');
      }).not.toThrow();
      
      expect(NotificationService.getNotifications()).toHaveLength(0);
    });

    it('should handle empty notifications list operations', () => {
      expect(NotificationService.getNotifications()).toHaveLength(0);
      
      expect(() => {
        NotificationService.hideAll();
      }).not.toThrow();
      
      expect(NotificationService.getNotifications()).toHaveLength(0);
    });
  });
});