import React from "react";
import { 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  StyleSheet 
} from "react-native";
import {
  Plus,
  Waves,
  CheckCircle,
  Brain,
  Eye,
  Target,
  Zap,
  Link,
  FileText,
  BarChart3,
  Users,
} from "lucide-react-native";
import { Text } from "../Text";
import { colors, spacing } from "../../design-system/tokens";

interface ToolMenuProps {
  showToolMenu: boolean;
  menuHeightAnim: Animated.Value;
  handleToolSelect: (toolName: string, customParameters?: Record<string, any>) => Promise<void>;
  handleAgentCommand: (command: string) => Promise<void>;
  refreshTides: () => Promise<void>;
  toggleToolMenu: () => void;
  getToolAvailability: (toolName: string) => { available: boolean; reason: string };
}

interface ToolButtonProps {
  toolName: string;
  icon: any;
  title: string;
  handleToolSelect: (toolName: string) => Promise<void>;
  getToolAvailability: (toolName: string) => { available: boolean; reason: string };
}

const ToolButton: React.FC<ToolButtonProps> = ({
  toolName,
  icon: Icon,
  title,
  handleToolSelect,
  getToolAvailability,
}) => {
  const availability = getToolAvailability(toolName);
  const isDisabled = !availability.available;

  return (
    <TouchableOpacity
      style={[styles.toolMenuItem, isDisabled && styles.toolMenuItemDisabled]}
      onPress={() => handleToolSelect(toolName)}
      disabled={isDisabled}
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
  handleAgentCommand,
  refreshTides,
  toggleToolMenu,
  getToolAvailability,
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
            outputRange: [0, 700], // Max height of 700px
          }),
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={styles.toolMenuScroll}
      >
        {/* Core Tide Management */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            TIDE MANAGEMENT
          </Text>

          <ToolButton
            toolName="createTide"
            icon={Plus}
            title="Create Tide"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />

          <TouchableOpacity
            style={styles.toolMenuItem}
            onPress={() => {
              // List tides by refreshing the tides display
              refreshTides();
              toggleToolMenu();
            }}
          >
            <View style={styles.toolMenuItemIcon}>
              <Waves size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.toolMenuItemContent}>
              <Text
                variant="body"
                color="primary"
                style={styles.toolMenuItemTitle}
              >
                Refresh Tides
              </Text>
            </View>
          </TouchableOpacity>

          <ToolButton
            toolName="startTideFlow"
            icon={CheckCircle}
            title="Start Flow"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Agent Commands Section */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            AGENT COMMANDS
          </Text>

          <TouchableOpacity
            style={styles.toolMenuItem}
            onPress={() => handleAgentCommand("get insights")}
          >
            <View style={styles.toolMenuItemIcon}>
              <Brain size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.toolMenuItemContent}>
              <Text
                variant="body"
                color="primary"
                style={styles.toolMenuItemTitle}
              >
                Get Insights
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolMenuItem}
            onPress={() => handleAgentCommand("analyze my tides")}
          >
            <View style={styles.toolMenuItemIcon}>
              <Eye size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.toolMenuItemContent}>
              <Text
                variant="body"
                color="primary"
                style={styles.toolMenuItemTitle}
              >
                Analyze Tides
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolMenuItem}
            onPress={() => handleAgentCommand("recommend actions")}
          >
            <View style={styles.toolMenuItemIcon}>
              <Target size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.toolMenuItemContent}>
              <Text
                variant="body"
                color="primary"
                style={styles.toolMenuItemTitle}
              >
                Get Recommendations
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Energy & Tasks Section */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            ENERGY & TASKS
          </Text>

          <ToolButton
            toolName="addEnergyToTide"
            icon={Zap}
            title="Add Energy"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
          <ToolButton
            toolName="linkTaskToTide"
            icon={Link}
            title="Link Task"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
          <ToolButton
            toolName="getTaskLinks"
            icon={FileText}
            title="View Task Links"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
        </View>

        {/* Analytics Section */}
        <View style={styles.menuSection}>
          <Text
            variant="caption"
            color="secondary"
            style={styles.sectionHeader}
          >
            ANALYTICS
          </Text>

          <ToolButton
            toolName="getTideReport"
            icon={BarChart3}
            title="Get Report"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
          />
          <ToolButton
            toolName="getTideParticipants"
            icon={Users}
            title="View Participants"
            handleToolSelect={handleToolSelect}
            getToolAvailability={getToolAvailability}
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
  },
  toolMenuScroll: {
    flex: 1,
  },
  toolMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    height: 44,
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