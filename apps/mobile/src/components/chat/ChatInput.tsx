import React, { useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUp, Plus } from "lucide-react-native";
import { colors, spacing, typography } from "../../design-system/tokens";
import { ToolSuggestion } from "./ToolSuggestion";
import type { DetectedTool } from "../../config/toolPhrases";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  isLoading: boolean;
  toolButtonActive: boolean;
  rotationAnim: Animated.Value;
  toggleToolMenu: () => void;
  toolSuggestion?: DetectedTool | null;
  showSuggestion?: boolean;
  onAcceptSuggestion?: () => void;
  onDismissSuggestion?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
  toolButtonActive,
  rotationAnim,
  toggleToolMenu,
  toolSuggestion,
  showSuggestion = false,
  onAcceptSuggestion,
  onDismissSuggestion,
}) => {
  const inputRef = useRef<TextInput>(null);
  // const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.inputContainer,
        // { paddingBottom: insets.bottom, height: 65 + insets.bottom },
      ]}
    >
      {/* Tool Suggestion */}
      {showSuggestion &&
        toolSuggestion &&
        onAcceptSuggestion &&
        onDismissSuggestion && (
          <View style={styles.suggestionContainer}>
            <ToolSuggestion
              suggestion={toolSuggestion}
              onAccept={onAcceptSuggestion}
              onDismiss={onDismissSuggestion}
              isVisible={showSuggestion}
            />
          </View>
        )}

      <View style={styles.mainRow}>
        <TouchableOpacity style={styles.toolButton} onPress={toggleToolMenu}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                  }),
                },
              ],
            }}
          >
            <Plus
              size={22}
              color={
                toolButtonActive ? colors.primary[500] : colors.neutral[400]
              }
            />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.messageInput}
            placeholder="Ask anything"
            placeholderTextColor={colors.text.tertiary}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputMessage.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <View
              style={[
                styles.sendButtonColor,
                !inputMessage.trim() && styles.sendButtonColorDisabled,
              ]}
            >
              <ArrowUp size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: colors.background.secondary,
    display: "flex",
    // borderWidth: 1,
    // borderColor: "red",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    position: "relative",
  },
  suggestionContainer: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  mainRow: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: colors.background.secondary,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopColor: colors.neutral[200],
    shadowColor: "#000",
    borderTopWidth: 0.5,
    shadowOffset: {
      width: 0,
      height: -0.5,
    },
    shadowRadius: 0.5,
    shadowOpacity: 0.03,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    borderWidth: 0.5,
    borderColor: colors.neutral[300],
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowRadius: 1.5,
    shadowOpacity: 0.03,
    backgroundColor: "white",
    borderRadius: 18,
    maxHeight: 100,
  },
  messageInput: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 48,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: typography.fontSize.base * typography.lineHeight.pro,
  },
  toolButton: {
    height: 34,
    width: 34,
    backgroundColor: colors.neutral[200],
    borderRadius: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    margin: 0,
    borderRadius: 1000,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  sendButtonColor: {
    backgroundColor: colors.primary[500],
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    width: 28,
    height: 28,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonColorDisabled: {
    backgroundColor: colors.neutral[400],
  },
});
