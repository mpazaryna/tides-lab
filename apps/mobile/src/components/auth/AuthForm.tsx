// Enhanced authentication form component with proper design system integration

import React, { useState, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Button, Input, Stack, Card, Text } from "../../design-system";
import { useAuthActions } from "../../hooks";
import { NotificationService } from "../../services/NotificationService";

interface AuthFormProps {
  mode?: 'signIn' | 'signUp';
  onModeChange?: (mode: 'signIn' | 'signUp') => void;
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = React.memo(({
  mode = 'signIn',
  onModeChange,
  onSuccess,
}) => {
  const { signIn, signUp, isSigningIn, isSigningUp, actionError, clearActionError } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLoading = isSigningIn || isSigningUp;
  const isSignInMode = mode === 'signIn';

  const handleSubmit = useCallback(async () => {
    // Clear any previous errors
    clearActionError();

    try {
      if (isSignInMode) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      
      // Clear form on success
      setEmail("");
      setPassword("");
      
      onSuccess?.();
    } catch (error) {
      // Error is already handled by useAuthActions hook
      NotificationService.error(
        actionError || (error instanceof Error ? error.message : "An error occurred"),
        isSignInMode ? "Sign In Error" : "Sign Up Error"
      );
    }
  }, [isSignInMode, email, password, signIn, signUp, clearActionError, onSuccess, actionError]);

  const handleModeToggle = useCallback(() => {
    clearActionError();
    onModeChange?.(isSignInMode ? 'signUp' : 'signIn');
  }, [clearActionError, onModeChange, isSignInMode]);

  return (
    <Card style={styles.formCard}>
      <Stack space={4}>
        <Text variant="h2" align="center">
          {isSignInMode ? 'Welcome Back' : 'Create Account'}
        </Text>
        
        <Text variant="body" align="center" color="secondary">
          {isSignInMode 
            ? 'Sign in to continue managing your tides'
            : 'Join Tides to start tracking your energy flows'
          }
        </Text>

        <Stack space={3}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isLoading}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignInMode ? "current-password" : "new-password"}
            textContentType={isSignInMode ? "password" : "newPassword"}
            editable={!isLoading}
          />
        </Stack>

        {actionError && (
          <Text variant="bodySmall" color="error" align="center">
            {actionError}
          </Text>
        )}

        <Stack space={2}>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!email || !password || isLoading}
          >
            {isSignInMode ? 'Sign In' : 'Create Account'}
          </Button>

          <Button
            variant="ghost"
            onPress={handleModeToggle}
            disabled={isLoading}
          >
            {isSignInMode 
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"
            }
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
});

const styles = StyleSheet.create({
  formCard: {
    padding: 24,
  },
});

export default AuthForm;