/**
 * NotificationProvider Component
 * 
 * Provides notification rendering throughout the app.
 * Integrates with NotificationService to display toast notifications.
 */

import React, { useEffect, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Notification } from '../../design-system';
import { NotificationService, NotificationData } from '../../services/NotificationService';
import { LoggingService } from '../../services/LoggingService';

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider component that renders notifications from NotificationService
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const logger = LoggingService;

  useEffect(() => {
    logger.debug('NotificationProvider', 'Provider mounted');

    // Subscribe to notification changes
    const unsubscribe = NotificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      logger.debug('NotificationProvider', 'Notifications updated', {
        count: updatedNotifications.length,
      });
    });

    // Initialize with current notifications
    setNotifications(NotificationService.getNotifications());

    // Cleanup subscription on unmount
    return () => {
      logger.debug('NotificationProvider', 'Provider unmounting');
      unsubscribe();
    };
  }, [logger]);

  const handleDismiss = (id: string) => {
    logger.debug('NotificationProvider', 'Dismissing notification', { id });
    NotificationService.hide(id);
  };

  return (
    <View style={styles.container}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification) => {
        const {
          id,
          type,
          title,
          message,
          duration,
          position,
          persistent,
          action,
          testID,
        } = notification;

        return (
          <Notification
            key={id}
            type={type}
            title={title}
            message={message}
            visible={true}
            duration={persistent ? 0 : duration}
            position={position}
            action={action}
            testID={testID || `notification-${id}`}
            onDismiss={() => handleDismiss(id)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NotificationProvider;