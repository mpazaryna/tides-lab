// Notification/Toast component for user feedback and alerts

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { colors, spacing, borderRadius, shadows, zIndex } from '../design-system/tokens';

export interface NotificationProps {
  /** Type of notification */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Title of the notification */
  title?: string;
  /** Message content */
  message: string;
  /** Whether notification is visible */
  visible: boolean;
  /** Duration in milliseconds before auto-hide */
  duration?: number;
  /** Callback when notification is dismissed */
  onDismiss: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Position of the notification */
  position?: 'top' | 'bottom';
  /** Custom action button */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Test ID for testing */
  testID?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  message,
  visible,
  duration = 4000,
  onDismiss,
  showCloseButton = true,
  position = 'top',
  action,
  testID = 'notification',
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -200 : 200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const typeConfig = {
    success: {
      backgroundColor: colors.success,
      icon: '✓',
      iconColor: colors.text.inverse,
      textColor: colors.text.inverse,
    },
    error: {
      backgroundColor: colors.error,
      icon: '✕',
      iconColor: colors.text.inverse,
      textColor: colors.text.inverse,
    },
    warning: {
      backgroundColor: colors.warning,
      icon: '⚠',
      iconColor: colors.neutral[900],
      textColor: colors.neutral[900],
    },
    info: {
      backgroundColor: colors.info,
      icon: 'ℹ',
      iconColor: colors.text.inverse,
      textColor: colors.text.inverse,
    },
  };

  const config = typeConfig[type];

  const handleDismiss = React.useCallback(() => {
    // Hide animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -200 : 200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, position, opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, handleDismiss, translateY, opacity]);

  const handleActionPress = () => {
    if (action) {
      action.onPress();
      handleDismiss();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      testID={testID}
    >
      <Card
        style={[
          styles.notification,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text
              variant="h3"
              style={[styles.icon, { color: config.iconColor }]}
              testID={`${testID}-icon`}
            >
              {config.icon}
            </Text>
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            {title && (
              <Text
                variant="h3"
                weight="semibold"
                style={[styles.title, { color: config.textColor }]}
                testID={`${testID}-title`}
              >
                {title}
              </Text>
            )}
            <Text
              variant="body"
              style={[styles.message, { color: config.textColor }]}
              testID={`${testID}-message`}
            >
              {message}
            </Text>
          </View>

          {/* Action Button */}
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActionPress}
              testID={`${testID}-action`}
            >
              <Text
                variant="body"
                weight="semibold"
                style={[styles.actionText, { color: config.textColor }]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          )}

          {/* Close Button */}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              testID={`${testID}-close`}
            >
              <Text
                variant="body"
                style={[styles.closeIcon, { color: config.textColor }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </Animated.View>
  );
};

/** Toast notification that appears and disappears automatically */
export const Toast: React.FC<Omit<NotificationProps, 'showCloseButton'>> = (props) => (
  <Notification {...props} showCloseButton={false} />
);

/** Success notification preset */
export const SuccessNotification: React.FC<Omit<NotificationProps, 'type'>> = (props) => (
  <Notification {...props} type="success" />
);

/** Error notification preset */
export const ErrorNotification: React.FC<Omit<NotificationProps, 'type'>> = (props) => (
  <Notification {...props} type="error" />
);

/** Warning notification preset */
export const WarningNotification: React.FC<Omit<NotificationProps, 'type'>> = (props) => (
  <Notification {...props} type="warning" />
);

/** Info notification preset */
export const InfoNotification: React.FC<Omit<NotificationProps, 'type'>> = (props) => (
  <Notification {...props} type="info" />
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: zIndex.toast,
  },

  topPosition: {
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
  },

  bottomPosition: {
    bottom: Platform.OS === 'ios' ? 40 : 20,
  },

  notification: {
    ...shadows.md,
    borderRadius: borderRadius.md,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
  },

  iconContainer: {
    marginRight: spacing[3],
  },

  icon: {
    fontSize: 20,
  },

  textContainer: {
    flex: 1,
    marginRight: spacing[2],
  },

  title: {
    marginBottom: spacing[1],
  },

  message: {
    lineHeight: 20,
  },

  actionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: spacing[2],
  },

  actionText: {
    textDecorationLine: 'underline',
  },

  closeButton: {
    padding: spacing[1],
  },

  closeIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
});

export default Notification;