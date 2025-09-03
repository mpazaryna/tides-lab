import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  Text,
  ScrollView,
} from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowUp,
  Plus,
  HelpCircle,
  Zap,
  CheckCircle,
  Calendar,
  Link,
  BarChart3,
} from "lucide-react-native";
import { colors, spacing, typography } from "../../design-system/tokens";
import { Text as CustomText } from "../Text";
import { ToolSuggestion } from "./ToolSuggestion";

import type { DetectedTool } from "../../config/toolPhrases";
import {
  detectToolSuggestions,
  isExactToolTitle,
  type DetectedToolSuggestion,
} from "../../utils/toolDetection";
import { TOOLS_CONFIG } from "../../config/toolsConfig";

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
  onHeightChange?: (height: number) => void;
  onFocusChange?: (focused: boolean) => void;
  templateToInject?: string; // Template from tool menu
  onTemplateInjected?: () => void; // Callback when template is injected
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
  onHeightChange,
  onFocusChange,
  templateToInject,
  onTemplateInjected,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [currentHeight, setCurrentHeight] = useState<number>(0);

  // Tool highlighting state - shows overlay when exact tool title is detected
  const [highlightedTool, setHighlightedTool] = useState<string | null>(null);

  // Tool suggestions state - shows dropdown when keywords are detected
  const [toolSuggestions, setToolSuggestions] = useState<
    DetectedToolSuggestion[]
  >([]);
  const [_showSuggestions, setShowSuggestions] = useState(false);

  // Unified overlay animation
  const overlayTranslateYAnim = useRef(new Animated.Value(100)).current; // Start translated down
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const [overlayType, setOverlayType] = useState<
    "suggestions" | "instructions" | null
  >(null);

  // const insets = useSafeAreaInsets();

  // Icon mapping for tool categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Flow Sessions":
        return CheckCircle;
      case "Context Management":
        return Calendar;
      case "Energy & Tasks":
        return Zap;
      case "Analytics & Data":
        return BarChart3;
      default:
        return Link;
    }
  };

  // Unified overlay animation control
  const showOverlay = (type: "suggestions" | "instructions") => {
    setOverlayType(type);
    Animated.parallel([
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayTranslateYAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideOverlay = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(overlayTranslateYAnim, {
        toValue: 100,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOverlayType(null);
    });
  }, [overlayOpacityAnim, overlayTranslateYAnim]);

  // Enhanced input change handler with unified tool detection
  const handleInputChange = (text: string) => {
    setInputMessage(text);

    // Check if input starts with exact tool title for overlay highlighting
    const exactToolTitle = isExactToolTitle(text);
    if (exactToolTitle) {
      // User has typed exact tool title - show instructions overlay
      setHighlightedTool(exactToolTitle);
      setShowSuggestions(false);
      setToolSuggestions([]);
      showOverlay("instructions");
    } else {
      // No exact tool title - detect suggestions based on keywords
      setHighlightedTool(null);
      const suggestions = detectToolSuggestions(text);
      setToolSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);

      if (suggestions.length > 0) {
        showOverlay("suggestions");
      } else {
        hideOverlay();
      }
    }
  };

  // Render formatted input text with tool highlighting overlay
  const renderFormattedText = () => {
    if (!inputMessage || !highlightedTool) {
      return inputMessage;
    }

    // Tool title should be at the beginning of input
    const toolTitleLength = highlightedTool.length;
    const restOfText = inputMessage.substring(toolTitleLength);

    return (
      <Text style={styles.formattedInputText}>
        <Text
          style={[styles.toolHighlight, { color: colors.inlineForeground }]}
        >
          {highlightedTool}
        </Text>
        <Text style={styles.normalText}>{restOfText}</Text>
      </Text>
    );
  };

  // Handle tool suggestion selection
  const handleToolSelect = (suggestion: DetectedToolSuggestion) => {
    // Set input to just the tool title (no markers)
    setInputMessage(suggestion.title);
    // Set highlighted tool for overlay and switch to instructions
    setHighlightedTool(suggestion.title);
    setShowSuggestions(false);
    setToolSuggestions([]);
    showOverlay("instructions");

    // Focus input after selection and position cursor after tool title
    setTimeout(() => {
      inputRef.current?.focus();
      // Position cursor after the tool title
      const cursorPosition = suggestion.title.length;
      inputRef.current?.setSelection(cursorPosition, cursorPosition);
    }, 100);
  };

  // Get tool configuration for the highlighted tool
  const getHighlightedToolConfig = () => {
    if (!highlightedTool) return null;

    // Find the tool config by matching title (case-insensitive)
    const toolEntry = Object.entries(TOOLS_CONFIG).find(
      ([_, config]) =>
        config.title.toLowerCase() === highlightedTool.toLowerCase()
    );

    return toolEntry ? toolEntry[1] : null;
  };

  // Render tool suggestions overlay
  const renderToolSuggestions = () => {
    if (!toolSuggestions.length) return null;

    return (
      <View style={styles.overlayContent}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScrollContent}
          style={styles.suggestionsScrollView}
        >
          {toolSuggestions.map((suggestion, index) => {
            const Icon = getCategoryIcon(suggestion.category);

            return (
              <TouchableOpacity
                key={`${suggestion.toolId}-${index}`}
                style={styles.suggestionCard}
                onPress={() => handleToolSelect(suggestion)}
                activeOpacity={1}
              >
                <View
                  style={[
                    styles.suggestionIconContainer,
                    { backgroundColor: colors.inlineBackground },
                  ]}
                >
                  <Icon size={18} color={colors.inlineForeground} />
                </View>

                <CustomText
                  variant="body"
                  weight="normal"
                  color={colors.titleColor}
                  numberOfLines={1}
                >
                  {suggestion.title}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render tool instructions overlay
  const renderToolInstructions = () => {
    const toolConfig = getHighlightedToolConfig();
    if (!toolConfig) return null;

    // const Icon = getCategoryIcon(toolConfig.category);
    const hasRequiredParams = toolConfig.requiredParams.length > 0;
    const hasOptionalParams = toolConfig.optionalParams.length > 0;

    return (
      <View style={styles.instructionsContainer}>
        {/* <View style={styles.instructionsIconContainer}>
          <Icon size={18} color={colors.inlineForeground} />
        </View> */}
        <CustomText style={styles.instructionsText}>
          <CustomText
            variant="bodySmall"
            weight="normal"
            color={colors.inlineForeground}
            backgroundColor={colors.inlineBackground}
          >
            {toolConfig.title}
          </CustomText>

          {hasRequiredParams && (
            <CustomText>
              {toolConfig.requiredParams.map((param, index) => {
                const highlightColor = colors.inputPlaceholder;
                return (
                  <CustomText
                    key={`req-${index}`}
                    variant="bodySmall"
                    weight="normal"
                    color={highlightColor}
                  >
                    {index === 0 ? " " : ", "}
                    {param.description}
                  </CustomText>
                );
              })}
            </CustomText>
          )}

          {hasOptionalParams && (
            <CustomText>
              {toolConfig.optionalParams.map((param, index) => {
                const highlightColor = colors.inputPlaceholder;

                return (
                  <CustomText
                    key={`opt-${index}`}
                    variant="bodySmall"
                    weight="normal"
                    color={highlightColor}
                  >
                    {hasRequiredParams || index > 0 ? ", " : " "}
                    {param.description}
                  </CustomText>
                );
              })}
            </CustomText>
          )}

          {!hasRequiredParams && !hasOptionalParams && (
            <View style={styles.noParamsContainer}>
              <HelpCircle size={24} color={colors.inputPlaceholder} />
              <CustomText
                variant="body"
                color="tertiary"
                style={styles.noParamsText}
              >
                This tool doesn't require any parameters. Just type the tool
                name and press enter.
              </CustomText>
            </View>
          )}
        </CustomText>
      </View>
    );
  };

  // Handle template injection from tool menu
  useEffect(() => {
    if (templateToInject) {
      setInputMessage(templateToInject);
      onTemplateInjected?.();

      // Templates from tool menu use "/" format, not tool titles
      // So we don't apply tool highlighting for templates
      setHighlightedTool(null);
      setShowSuggestions(false);
      setToolSuggestions([]);
      hideOverlay();

      // Focus input and move cursor to first parameter placeholder
      setTimeout(() => {
        inputRef.current?.focus();
        // Move cursor to first "___" placeholder
        const firstPlaceholder = templateToInject.indexOf("___");
        if (firstPlaceholder !== -1) {
          inputRef.current?.setSelection(
            firstPlaceholder,
            firstPlaceholder + 3
          );
        }
      }, 100);
    }
  }, [templateToInject, setInputMessage, onTemplateInjected, hideOverlay]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height !== currentHeight) {
      setCurrentHeight(height);
      onHeightChange?.(height);
    }
  };

  return (
    <View style={[styles.inputContainer]} onLayout={handleLayout}>
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

      {overlayType && (
        <Animated.View
          style={[
            styles.unifiedOverlay,
            {
              opacity: overlayOpacityAnim,
              transform: [
                {
                  translateY: overlayTranslateYAnim,
                },
              ],
            },
          ]}
        >
          {overlayType === "suggestions" && renderToolSuggestions()}
        </Animated.View>
      )}

      {overlayType === "instructions" && renderToolInstructions()}

      <View style={[styles.mainRow, overlayType && styles.mainRowNoShadow]}>
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
              color={toolButtonActive ? colors.titleColor : colors.tableIcon}
            />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.messageInput,
              highlightedTool && styles.messageInputWithHighlight,
            ]}
            placeholder="Share your energy"
            placeholderTextColor={colors.inputPlaceholder}
            value={inputMessage}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSendMessage}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          {highlightedTool && (
            <View style={styles.textOverlay} pointerEvents="none">
              {renderFormattedText()}
            </View>
          )}
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
    backgroundColor: colors.containerBackground,
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
    backgroundColor: colors.containerBackground,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopColor: colors.containerBorder,
    borderTopWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 20,
    shadowOpacity: 0.035,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    borderWidth: 0.5,
    borderColor: colors.containerBorder,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 20,
    shadowOpacity: 0.035,
    backgroundColor: "white",
    borderRadius: 18,
    maxHeight: 100,
  },
  messageInput: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 48,
    fontSize: typography.fontSize.base,
    color: colors.titleColor,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: typography.fontSize.base * typography.lineHeight.pro,
  },
  toolButton: {
    height: 34,
    width: 34,
    backgroundColor: colors.containerBorderSoft,
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
    backgroundColor: colors.titleColor,
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
    backgroundColor: colors.buttonDisabled,
  },
  messageInputWithHighlight: {
    color: "transparent", // Make text transparent when highlighting is active
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 48, // Account for send button

    paddingLeft: 12,
    paddingTop: 8.5,
    paddingBottom: 8,
    justifyContent: "flex-start",
    pointerEvents: "none",
  },
  formattedInputText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.pro,
    color: colors.titleColor,
  },
  toolHighlight: {
    backgroundColor: colors.inlineBackground, // Light purple background
  },
  normalText: {
    color: colors.titleColor,
  },
  // Unified overlay styles
  unifiedOverlay: {
    width: "100%",
    backgroundColor: colors.containerBackground,
    borderTopColor: colors.containerBorder,
    borderTopWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 20,
    shadowOpacity: 0.035,
    zIndex: 0,
    overflow: "hidden",
    maxHeight: 58,
    height: 58,
    gap: 1,
  },
  overlayContent: {
    flex: 1,
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  overlayDismissButton: {
    padding: spacing[1],
  },
  // Tool suggestions styles
  suggestionsScrollView: {},
  suggestionsScrollContent: {},
  suggestionCard: {
    backgroundColor: colors.containerBackground,
    borderRadius: 0,
    padding: 11,
    paddingHorizontal: 16,
    paddingLeft: 12,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: colors.containerBorder,
    marginRight: -0.5,
  },

  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inlineBackground,
  },

  // Tool instructions styles
  instructionsContainer: {
    position: "absolute",
    flex: 1,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",

    borderWidth: 0.5,
    backgroundColor: colors.containerBackground,
    borderRadius: 12,
    padding: spacing[4],
    borderColor: colors.containerBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 20,
    shadowOpacity: 0.035,
    elevation: 2,
    marginHorizontal: spacing[4],
    bottom: 66,
  },
  instructionsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inlineBackground,
  },
  instructionsText: {
    flex: 1,
  },
  noParamsContainer: {
    alignItems: "center",
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  noParamsText: {
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
  mainRowNoShadow: {
    shadowOpacity: 0,
  },
});
