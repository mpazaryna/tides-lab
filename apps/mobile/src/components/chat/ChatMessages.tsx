import React, { useCallback, forwardRef } from "react";
import { 
  View, 
  ScrollView, 
  FlatList, 
  RefreshControl, 
  StyleSheet 
} from "react-native";
import { Text } from "../Text";
import { Stack } from "../Stack";
import { MessageBubble } from "./MessageBubble";
import { colors, spacing } from "../../design-system/tokens";
import type { ChatMessage } from "../../types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  refreshing: boolean;
  refreshTides: () => Promise<void>;
}

export const ChatMessages = forwardRef<ScrollView, ChatMessagesProps>(({
  messages,
  refreshing,
  refreshTides,
}, ref) => {
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble
        key={item.id}
        message={item}
        isOwnMessage={item.type === "user"}
      />
    ),
    []
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="h4" color="secondary" align="center">
        Welcome to Chat!
      </Text>
      <Text
        variant="body"
        color="tertiary"
        align="center"
        style={styles.emptyStateDescription}
      >
        Ask questions, execute tools, or get insights from the
        TideProductivityAgent.
      </Text>
      <Stack spacing={2} style={styles.helpCommands}>
        <Text variant="bodySmall" color="secondary">
          Commands you can try:
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • Type a question naturally
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • /agent [question] - Ask the agent
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • /tool [toolName] param=value - Execute a tool
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • Use Quick Tools below for easy access
        </Text>
        <Text
          variant="bodySmall"
          color="primary"
          style={styles.debugCommandsTitle}
        >
          Debug Commands:
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • /debug - Run getCurrentServerUrl tests
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • /debug edge - Run edge case tests
        </Text>
        <Text variant="bodySmall" color="tertiary">
          • /debug hide - Hide debug panel
        </Text>
      </Stack>
    </View>
  );

  return (
    <ScrollView
      ref={ref}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshTides}
          tintColor={colors.primary[500]}
        />
      }
    >
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
});

ChatMessages.displayName = 'ChatMessages';

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    padding: spacing[5],
  },
  messagesContent: {
    paddingBottom: spacing[4],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
  },
  emptyStateDescription: {
    marginTop: spacing[3],
    marginBottom: spacing[6],
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
  helpCommands: {
    alignItems: "center",
  },
  debugCommandsTitle: {
    marginTop: 8,
  },
});