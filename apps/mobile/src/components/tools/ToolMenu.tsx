import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from "react-native";
import {
  CheckCircle,
  Zap,
  Link,
  FileText,
  BarChart3,
  Users,
  ArrowUpDown,
  Calendar,
  Copy,
} from "lucide-react-native";
import { Text } from "../Text";
import { colors, spacing } from "../../design-system/tokens";

interface ToolMenuProps {
  showToolMenu: boolean;
  menuHeightAnim: Animated.Value;
  handleToolSelect: (
    toolName: string,
    customParameters?: Record<string, any>
  ) => Promise<void>;
  handleAgentCommand: (command: string) => Promise<void>;
  toggleToolMenu: () => void;
  scrollable?: boolean;
  getToolAvailability: (toolName: string) => {
    available: boolean;
    reason: string;
  };
  onCopyConversation: () => void;
}

interface ToolButtonProps {
  toolName?: string;
  icon: any;
  title: string;
  handleToolSelect?: (toolName: string) => Promise<void>;
  getToolAvailability?: (toolName: string) => {
    available: boolean;
    reason: string;
  };
  onPress?: () => void;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  toolName,
  icon: Icon,
  title,
  handleToolSelect,
  getToolAvailability,
  onPress,
  disabled = false,
}) => {
  const availability =
    toolName && getToolAvailability
      ? getToolAvailability(toolName)
      : { available: true, reason: "" };
  const isDisabled = Boolean(disabled) || (toolName && !availability.available);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (handleToolSelect && toolName) {
      handleToolSelect(toolName);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.toolMenuItem, isDisabled && styles.toolMenuItemDisabled]}
      onPress={handlePress}
    >
      <View style={styles.toolMenuItemIcon}>
        <Icon
          size={18}
          color={isDisabled ? colors.neutral[300] : colors.primary[500]}
        />
      </View>
      <View style={styles.toolMenuItemContent}>
        <Text
          variant="body"
          color={isDisabled ? "tertiary" : "primary"}
          style={styles.toolMenuItemTitle}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const ToolMenu: React.FC<ToolMenuProps> = ({
  showToolMenu,
  menuHeightAnim,
  handleToolSelect,
  handleAgentCommand: _handleAgentCommand,
  toggleToolMenu: _toggleToolMenu,
  scrollable = true,
  getToolAvailability,
  onCopyConversation,
}) => {
  if (!showToolMenu) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.toolMenu,
        {
          height: menuHeightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300], // Max height of 700px
          }),
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={styles.toolMenuScroll}
        scrollEnabled={scrollable}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {/* Flow Sessions */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            FLOW SESSIONS
          </Text>

          <ToolButton
            toolName="tide_smart_flow"
            icon={CheckCircle}
            title="Start Smart Flow"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Context Management */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            CONTEXT MANAGEMENT
          </Text>

          <ToolButton
            toolName="tide_switch_context"
            icon={ArrowUpDown}
            title="Switch Context"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <ToolButton
            toolName="tide_get_todays_summary"
            icon={Calendar}
            title="Today's Summary"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Energy & Tasks */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            ENERGY & TASKS
          </Text>

          <ToolButton
            toolName="tide_add_energy"
            icon={Zap}
            title="Add Energy"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <ToolButton
            toolName="tide_link_task"
            icon={Link}
            title="Link Task"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <ToolButton
            toolName="tide_list_task_links"
            icon={FileText}
            title="View Task Links"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Analytics & Data */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            ANALYTICS & DATA
          </Text>

          <ToolButton
            toolName="tide_get_report"
            icon={BarChart3}
            title="Get Report"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <ToolButton
            toolName="tide_get_raw_json"
            icon={FileText}
            title="Get Raw Data"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <ToolButton
            toolName="tides_get_participants"
            icon={Users}
            title="View Participants"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Utilities */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            UTILITIES
          </Text>

          <ToolButton
            icon={Copy}
            title="Copy Conversation"
            onPress={onCopyConversation}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toolMenu: {
    backgroundColor: colors.background.secondary,
    width: "100%",
    overflow: "hidden", // Important for smooth height animation
    borderTopWidth: 0.5,
    borderTopColor: colors.neutral[200],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -0.5,
    },
    shadowRadius: 0.5,
    shadowOpacity: 0.03,
    maxHeight: 500,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 58.5,
  },
  toolMenuScroll: {
    flex: 1,
  },
  toolMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  toolMenuItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2],
  },
  toolMenuItemContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  toolMenuItemTitle: {},
  toolMenuItemDisabled: {
    opacity: 0.5,
  },
  menuSection: {
    marginBottom: spacing[3],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
