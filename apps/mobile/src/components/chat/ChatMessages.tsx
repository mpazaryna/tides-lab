import React, { forwardRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Stack } from "../Stack";
import { MessageBubble } from "./MessageBubble";
import { spacing } from "../../design-system/tokens";
import type { ChatMessage } from "../../types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export const ChatMessages = forwardRef<ScrollView, ChatMessagesProps>(
  ({ messages }, ref) => {
    return (
      <ScrollView
        ref={ref}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack spacing={2}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.type === "user"}
            />
          ))}
        </Stack>
      </ScrollView>
    );
  }
);

ChatMessages.displayName = "ChatMessages";

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingRight: 11,
    // borderWidth: 1,
    // borderColor: "blue",
  },
  messagesContent: {
    paddingBottom: spacing[4],
    flexGrow: 1,
    justifyContent: "flex-end",
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
