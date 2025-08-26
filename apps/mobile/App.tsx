// GREEN

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ServerEnvironmentProvider } from './src/context/ServerEnvironmentContext';
import { AuthProvider } from './src/context/AuthContext';
import { MCPProvider } from './src/context/MCPContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/components/providers/NotificationProvider';
import RootNavigator from './src/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <ServerEnvironmentProvider>
      <AuthProvider>
        <MCPProvider>
          <ChatProvider>
            <NotificationProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </ChatProvider>
        </MCPProvider>
      </AuthProvider>
    </ServerEnvironmentProvider>
  );
};

export default App;
