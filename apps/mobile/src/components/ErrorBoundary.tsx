// ErrorBoundary component for catching and handling React errors gracefully

import React, { Component, ReactNode, ErrorInfo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { Card } from "./Card";
import { Stack } from "./Stack";
import { colors, spacing, borderRadius } from "../design-system/tokens";
import { loggingService } from "../services/loggingService";

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component to render on error */
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void
  ) => ReactNode;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Test ID for testing */
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with structured logging
    loggingService.error("ErrorBoundary", "React error boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    loggingService.info(
      "ErrorBoundary",
      "User requested error boundary retry",
      { retryCount: this.state.retryCount + 1 }
    );

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  renderDefaultFallback() {
    const { error } = this.state;
    const {
      errorMessage,
      showRetry = true,
      testID = "error-boundary",
    } = this.props;

    return (
      <View style={styles.container} testID={testID}>
        <Card style={styles.errorCard}>
          <Stack spacing={4} align="center">
            {/* Error Icon */}
            <View style={styles.errorIcon}>
              <Text variant="h1" color={colors.error}>
                ⚠️
              </Text>
            </View>

            {/* Error Title */}
            <Text
              variant="h2"
              weight="semibold"
              color={colors.text.primary}
              align="center"
              testID={`${testID}-title`}
            >
              Something went wrong
            </Text>

            {/* Error Message */}
            <Text
              variant="body"
              color={colors.text.secondary}
              align="center"
              style={styles.errorMessage}
              testID={`${testID}-message`}
            >
              {errorMessage ||
                "We encountered an unexpected error. Please try again or contact support if the problem persists."}
            </Text>

            {/* Error Details (development only) */}
            {__DEV__ && error && (
              <View style={styles.errorDetails}>
                <Text
                  variant="mono"
                  color={colors.text.tertiary}
                  testID={`${testID}-details`}
                >
                  {error.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {showRetry && (
              <Button
                variant="primary"
                onPress={this.handleRetry}
                testID={`${testID}-retry-button`}
              >
                Try Again
              </Button>
            )}
          </Stack>
        </Card>
      </View>
    );
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback && errorInfo) {
        return fallback(error, errorInfo, this.handleRetry);
      }

      // Render default fallback
      return this.renderDefaultFallback();
    }

    // Render children normally when no error
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
    backgroundColor: colors.background.primary,
  },

  errorCard: {
    maxWidth: 400,
    width: "100%",
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + "10", // 10% opacity
    alignItems: "center",
    justifyContent: "center",
  },

  errorMessage: {
    lineHeight: 24,
  },

  errorDetails: {
    backgroundColor: colors.neutral[100],
    padding: spacing[3],
    borderRadius: borderRadius.sm,
    width: "100%",
    marginTop: spacing[2],
  },
});

/** Higher-order component to wrap components with ErrorBoundary */
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const ComponentWithErrorBoundary = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
