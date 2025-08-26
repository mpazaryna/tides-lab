import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { X } from "lucide-react-native";
import { colors, spacing } from "../../design-system/tokens";
import type { DetectedTool } from "../../config/toolPhrases";
import { Text } from "../Text";

interface ToolSuggestionProps {
  suggestion: DetectedTool | null;
  onAccept: (tool: DetectedTool) => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const ToolSuggestion: React.FC<ToolSuggestionProps> = ({
  suggestion,
  onAccept,
  onDismiss,
  isVisible,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isVisible && suggestion) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, suggestion, fadeAnim, slideAnim, scaleAnim]);

  if (!suggestion || !isVisible) {
    return null;
  }

  const Icon = suggestion.metadata.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.suggestionCard}
        onPress={() => onAccept(suggestion)}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Icon size={20} color={colors.primary[500]} />
        </View>
        
        <View style={styles.textContainer}>
          <Text variant="bodySmall" weight="semibold" color="primary">
            {suggestion.metadata.name}
          </Text>
          <Text variant="caption" color="secondary">
            Tap to use • {Math.round(suggestion.confidence * 100)}% match
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={colors.neutral[400]} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Confidence indicator bar */}
      <View style={styles.confidenceBar}>
        <View
          style={[
            styles.confidenceFill,
            {
              width: `${suggestion.confidence * 100}%`,
              backgroundColor:
                suggestion.confidence > 0.8
                  ? colors.success
                  : suggestion.confidence > 0.6
                  ? colors.warning
                  : colors.neutral[300],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: spacing[4],
    right: spacing[4],
    zIndex: 100,
    elevation: 10,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing[3],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  dismissButton: {
    padding: spacing[1],
    marginLeft: spacing[2],
  },
  confidenceBar: {
    height: 2,
    backgroundColor: colors.neutral[100],
    borderRadius: 1,
    marginTop: -1,
    marginHorizontal: 1,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 1,
  },
});