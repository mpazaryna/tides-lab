/**
 * Notification Service
 * 
 * Provides centralized notification management to replace Alert usage.
 * Supports toast notifications, persistent notifications, and queue management.
 */

// Use a simple event system instead of Node.js EventEmitter for React Native compatibility
interface EventHandler {
  (data: any): void;
}

class SimpleEventEmitter {
  private events: { [key: string]: EventHandler[] } = {};

  on(event: string, handler: EventHandler): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  emit(event: string, data?: any): void {
    if (!this.events[event]) return;
    this.events[event].forEach(handler => handler(data));
  }
}
import { LoggingService } from './LoggingService';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  testID?: string;
}

export interface NotificationManagerState {
  notifications: NotificationData[];
  queue: NotificationData[];
  maxVisible: number;
}

/**
 * Centralized notification management service
 * Replaces React Native Alert with custom notification system
 */
class NotificationServiceClass extends SimpleEventEmitter {
  private static instance: NotificationServiceClass;
  private logger = LoggingService;
  private state: NotificationManagerState = {
    notifications: [],
    queue: [],
    maxVisible: 3,
  };

  private constructor() {
    super();
    this.logger.debug('NotificationService', 'Service initialized');
  }

  public static getInstance(): NotificationServiceClass {
    if (!NotificationServiceClass.instance) {
      NotificationServiceClass.instance = new NotificationServiceClass();
    }
    return NotificationServiceClass.instance;
  }

  /**
   * Show a notification
   */
  public show(options: Omit<NotificationData, 'id'>): string {
    const id = this.generateId();
    const notification: NotificationData = {
      id,
      duration: 4000,
      position: 'top',
      persistent: false,
      ...options,
      type: options.type || 'info',
    };

    this.logger.info('NotificationService', 'Showing notification', {
      id,
      type: notification.type,
      message: notification.message,
    });

    // Add to queue or display immediately
    if (this.state.notifications.length >= this.state.maxVisible) {
      this.state.queue.push(notification);
      this.logger.debug('NotificationService', 'Notification queued', { id });
    } else {
      this.addToVisible(notification);
    }

    return id;
  }

  /**
   * Show success notification
   */
  public success(message: string, title?: string, options?: Partial<NotificationData>): string {
    return this.show({
      type: 'success',
      message,
      title,
      duration: 3000,
      ...options,
    });
  }

  /**
   * Show error notification
   */
  public error(message: string, title?: string, options?: Partial<NotificationData>): string {
    return this.show({
      type: 'error',
      message,
      title,
      duration: 5000,
      persistent: true,
      ...options,
    });
  }

  /**
   * Show warning notification
   */
  public warning(message: string, title?: string, options?: Partial<NotificationData>): string {
    return this.show({
      type: 'warning',
      message,
      title,
      duration: 4000,
      ...options,
    });
  }

  /**
   * Show info notification
   */
  public info(message: string, title?: string, options?: Partial<NotificationData>): string {
    return this.show({
      type: 'info',
      message,
      title,
      duration: 4000,
      ...options,
    });
  }

  /**
   * Hide a specific notification
   */
  public hide(id: string): void {
    this.logger.debug('NotificationService', 'Hiding notification', { id });

    this.state.notifications = this.state.notifications.filter(
      (notification) => notification.id !== id
    );

    // Show next queued notification
    this.processQueue();

    this.emit('notificationsChanged', this.state.notifications);
  }

  /**
   * Hide all notifications
   */
  public hideAll(): void {
    this.logger.info('NotificationService', 'Hiding all notifications');
    
    this.state.notifications = [];
    this.state.queue = [];
    
    this.emit('notificationsChanged', this.state.notifications);
  }

  /**
   * Get all visible notifications
   */
  public getNotifications(): NotificationData[] {
    return [...this.state.notifications];
  }

  /**
   * Subscribe to notification changes
   */
  public subscribe(callback: (notifications: NotificationData[]) => void): () => void {
    this.on('notificationsChanged', callback);
    
    // Return unsubscribe function
    return () => {
      this.off('notificationsChanged', callback);
    };
  }

  /**
   * Alert-compatible interface for easy migration
   * @deprecated Use show() methods instead
   */
  public alert(
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    _options?: { cancelable?: boolean }
  ): void {
    this.logger.warn('NotificationService', 'Using deprecated alert method');

    // Convert Alert format to notification format
    const hasDestructive = buttons?.some(button => button.style === 'destructive');
    const type = hasDestructive ? 'error' : 'info';

    // Show the notification
    this.show({
      type,
      title,
      message: message || '',
      persistent: true,
      action: buttons?.[0] ? {
        label: buttons[0].text,
        onPress: buttons[0].onPress || (() => {}),
      } : undefined,
    });

    // If there are multiple buttons, log a warning
    if (buttons && buttons.length > 1) {
      this.logger.warn('NotificationService', 'Multiple alert buttons not fully supported', {
        buttonCount: buttons.length,
      });
    }
  }

  // Private methods

  private addToVisible(notification: NotificationData): void {
    this.state.notifications.push(notification);
    this.emit('notificationsChanged', this.state.notifications);
  }

  private processQueue(): void {
    if (this.state.queue.length > 0 && this.state.notifications.length < this.state.maxVisible) {
      const nextNotification = this.state.queue.shift();
      if (nextNotification) {
        this.addToVisible(nextNotification);
        this.logger.debug('NotificationService', 'Processed queued notification', {
          id: nextNotification.id,
        });
      }
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

// Singleton instance export
export const NotificationService = NotificationServiceClass.getInstance();

// Default export for convenience
export default NotificationService;