// Loading component for consistent loading states across the app

import React from 'react';
import {
  View,
  ActivityIndicator,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { Text } from './Text';
import { colors, spacing, typography } from '../tokens';

export interface LoadingProps {
  /** Size of the loading indicator */
  size?: 'small' | 'large' | number;
  /** Color of the loading indicator */
  color?: string;
  /** Optional loading message */
  message?: string;
  /** Whether to show as overlay (covers full screen) */
  overlay?: boolean;
  /** Whether to show with background */
  withBackground?: boolean;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = colors.primary[500],
  message,
  overlay = false,
  withBackground = false,
  style,
  testID = 'loading-component',
}) => {
  const containerStyle = [
    overlay ? styles.overlay : styles.container,
    withBackground && styles.withBackground,
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <ActivityIndicator
        size={size}
        color={color}
        testID={`${testID}-indicator`}
      />
      {message && (
        <Text
          variant="body"
          color={colors.text.secondary}
          style={styles.message}
          testID={`${testID}-message`}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

/** Preset loading components for common use cases */
export const LoadingOverlay: React.FC<Omit<LoadingProps, 'overlay'>> = (props) => (
  <Loading {...props} overlay withBackground />
);

export const LoadingInline: React.FC<Omit<LoadingProps, 'overlay'>> = (props) => (
  <Loading {...props} overlay={false} />
);

export const LoadingScreen: React.FC<Omit<LoadingProps, 'overlay' | 'withBackground'>> = (props) => (
  <Loading {...props} overlay withBackground message={props.message || 'Loading...'} />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  withBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  message: {
    marginTop: spacing[3],
    textAlign: 'center',
    ...typography.textStyles.body,
  },
});

export default Loading;