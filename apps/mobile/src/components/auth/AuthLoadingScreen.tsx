// Authentication loading screen component

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingScreen, Text, Stack } from '../../design-system';
import { useAuthStatus } from '../../hooks';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "Authenticating...",
}) => {
  const { error } = useAuthStatus();

  if (error) {
    return (
      <View style={styles.container}>
        <Stack space={4} align="center">
          <Text variant="h3" color="error" align="center">
            Authentication Error
          </Text>
          <Text variant="body" color="secondary" align="center">
            {error}
          </Text>
        </Stack>
      </View>
    );
  }

  return <LoadingScreen message={message} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default AuthLoadingScreen;