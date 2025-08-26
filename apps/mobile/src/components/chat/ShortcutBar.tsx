import React, { useState, useCallback, memo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import {
  Brain,
  Waves,
  List,
  Zap,
  BarChart3,
  Settings,
  Eye,
  Target,
  Play,
  Link,
  Users,
  FileText,
  X,
} from "lucide-react-native";
import { Text, Card, Button, colors, spacing } from "../../design-system";
import { LoggingService } from "../../services/LoggingService";
import { NotificationService } from "../../services/NotificationService";

export interface Shortcut {
  id: string;
  label: string;
  type: "agent_command" | "mcp_direct";
  command: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  params?: Record<string, any>;
  category: "agent" | "tide" | "energy" | "analytics" | "custom";
  description?: string;
}

interface ShortcutBarProps {
  /** Array of shortcuts to display */
  shortcuts?: Shortcut[];
  /** Callback when a shortcut is pressed */
  onShortcutPress: (shortcut: Shortcut) => void;
  /** Whether to show the configuration button */
  showConfiguration?: boolean;
  /** Callback when shortcuts are reconfigured */
  onConfigurationChange?: (shortcuts: Shortcut[]) => void;
  /** Maximum number of shortcuts to display before scrolling */
  maxVisible?: number;
  /** Whether to show category labels */
  showCategories?: boolean;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  // Agent Commands
  {
    id: "agent_insights",
    label: "Get Insights",
    type: "agent_command",
    command: "get insights for my recent tides",
    icon: Brain,
    category: "agent",
    description: "Ask the agent for productivity insights",
  },
  {
    id: "agent_analyze",
    label: "Analyze",
    type: "agent_command",
    command: "analyze my current tide patterns",
    icon: Eye,
    category: "agent",
    description: "Get analysis of your tide patterns",
  },
  {
    id: "agent_recommend",
    label: "Recommend",
    type: "agent_command",
    command: "recommend actions based on my data",
    icon: Target,
    category: "agent",
    description: "Get personalized recommendations",
  },

  // Direct MCP Calls
  {
    id: "mcp_list_tides",
    label: "List Tides",
    type: "mcp_direct",
    command: "tide_list",
    icon: List,
    category: "tide",
    description: "Show all your tides",
  },
  {
    id: "mcp_create_tide",
    label: "Create Tide",
    type: "mcp_direct",
    command: "tide_create",
    icon: Waves,
    category: "tide",
    params: { name: "New Tide", description: "Quick tide", flowType: "daily" },
    description: "Create a new tide workflow",
  },
  {
    id: "mcp_get_report",
    label: "Get Report",
    type: "mcp_direct",
    command: "tide_get_report",
    icon: BarChart3,
    category: "analytics",
    description: "Generate tide analytics report",
  },
];

const AVAILABLE_SHORTCUTS: Shortcut[] = [
  ...DEFAULT_SHORTCUTS,
  // Additional shortcuts for configuration
  {
    id: "mcp_start_flow",
    label: "Start Flow",
    type: "mcp_direct",
    command: "tide_flow",
    icon: Play,
    category: "energy",
    description: "Begin a flow session",
  },
  {
    id: "mcp_add_energy",
    label: "Add Energy",
    type: "mcp_direct",
    command: "tide_add_energy",
    icon: Zap,
    category: "energy",
    description: "Track your energy levels",
  },
  {
    id: "mcp_link_task",
    label: "Link Task",
    type: "mcp_direct",
    command: "tide_link_task",
    icon: Link,
    category: "tide",
    description: "Connect tasks to tides",
  },
  {
    id: "mcp_get_participants",
    label: "Participants",
    type: "mcp_direct",
    command: "tides_get_participants",
    icon: Users,
    category: "analytics",
    description: "View tide participants",
  },
  {
    id: "mcp_task_links",
    label: "Task Links",
    type: "mcp_direct",
    command: "tide_list_task_links",
    icon: FileText,
    category: "analytics",
    description: "Show linked tasks",
  },
  {
    id: "agent_optimize",
    label: "Optimize",
    type: "agent_command",
    command: "optimize my workflow based on current data",
    icon: Target,
    category: "agent",
    description: "Get workflow optimization suggestions",
  },
];

const CATEGORY_LABELS = {
  agent: "Agent Commands",
  tide: "Tide Management",
  energy: "Energy & Flow",
  analytics: "Analytics",
  custom: "Custom",
};

const ShortcutBar: React.FC<ShortcutBarProps> = ({
  shortcuts = DEFAULT_SHORTCUTS.slice(0, 6), // Default to first 6 shortcuts
  onShortcutPress,
  showConfiguration = true,
  onConfigurationChange,
  maxVisible = 6,
  showCategories = false,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configShortcuts, setConfigShortcuts] = useState<Shortcut[]>(shortcuts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(
    new Set(AVAILABLE_SHORTCUTS.map((s) => s.category))
  );

  const handleShortcutPress = useCallback(
    (shortcut: Shortcut) => {
      LoggingService.info(
        "ShortcutBar",
        "Shortcut pressed",
        {
          shortcutId: shortcut.id,
          type: shortcut.type,
          command: shortcut.command,
        },
        "SHORTCUT_001"
      );

      onShortcutPress(shortcut);
    },
    [onShortcutPress]
  );

  const toggleShortcut = useCallback(
    (shortcut: Shortcut) => {
      setConfigShortcuts((prev) => {
        const exists = prev.some((s) => s.id === shortcut.id);
        const newShortcuts = exists
          ? prev.filter((s) => s.id !== shortcut.id)
          : [...prev, shortcut].slice(0, maxVisible);

        return newShortcuts;
      });
    },
    [maxVisible]
  );

  const saveConfiguration = useCallback(() => {
    onConfigurationChange?.(configShortcuts);
    setShowConfigModal(false);

    NotificationService.success(
      `${configShortcuts.length} shortcuts configured`,
      "Configuration"
    );

    LoggingService.info(
      "ShortcutBar",
      "Configuration saved",
      { shortcutCount: configShortcuts.length },
      "SHORTCUT_002"
    );
  }, [configShortcuts, onConfigurationChange]);

  const resetConfiguration = useCallback(() => {
    setConfigShortcuts(DEFAULT_SHORTCUTS.slice(0, maxVisible));
  }, [maxVisible]);

  const renderShortcut = (shortcut: Shortcut, index: number) => {
    const IconComponent = shortcut.icon;
    const isAgentCommand = shortcut.type === "agent_command";

    return (
      <TouchableOpacity
        key={shortcut.id}
        style={[styles.shortcutButton, isAgentCommand && styles.agentShortcut]}
        onPress={() => handleShortcutPress(shortcut)}
        activeOpacity={0.7}
      >
        {IconComponent && (
          <IconComponent
            size={20}
            color={isAgentCommand ? colors.secondary[500] : colors.primary[500]}
          />
        )}
        <Text
          variant="bodySmall"
          color={isAgentCommand ? "secondary" : "primary"}
          style={styles.shortcutLabel}
          numberOfLines={1}
        >
          {shortcut.label}
        </Text>
        {isAgentCommand && (
          <View style={styles.agentBadge}>
            <Text
              variant="bodySmall"
              color="white"
              style={styles.agentBadgeText}
            >
              AI
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderConfigurationModal = () => (
    <Modal
      visible={showConfigModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowConfigModal(false)}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text variant="h3" color="primary">
            Configure Shortcuts
          </Text>
          <TouchableOpacity
            onPress={() => setShowConfigModal(false)}
            style={styles.modalCloseButton}
          >
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === "all" && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text
              variant="bodySmall"
              color={selectedCategory === "all" ? "white" : "secondary"}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                variant="bodySmall"
                color={selectedCategory === category ? "white" : "secondary"}
              >
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ||
                  category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current Selection */}
        <Card
          variant="outlined"
          padding={3}
          style={styles.currentSelectionCard}
        >
          <Text
            variant="body"
            weight="medium"
            style={styles.currentSelectionTitle}
          >
            Current Selection ({configShortcuts.length}/{maxVisible})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.currentSelection}
          >
            {configShortcuts.map((shortcut, index) => (
              <TouchableOpacity
                key={shortcut.id}
                style={styles.currentShortcut}
                onPress={() => toggleShortcut(shortcut)}
              >
                {shortcut.icon && (
                  <shortcut.icon size={16} color={colors.primary[500]} />
                )}
                <Text variant="bodySmall" color="primary" numberOfLines={1}>
                  {shortcut.label}
                </Text>
                <View style={styles.removeButton}>
                  <X size={12} color={colors.error} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Available Shortcuts */}
        <ScrollView style={styles.modalContent}>
          {AVAILABLE_SHORTCUTS.filter(
            (shortcut) =>
              selectedCategory === "all" ||
              shortcut.category === selectedCategory
          ).map((shortcut) => {
            const isSelected = configShortcuts.some(
              (s) => s.id === shortcut.id
            );
            const isAgentCommand = shortcut.type === "agent_command";

            return (
              <TouchableOpacity
                key={shortcut.id}
                style={[
                  styles.availableShortcut,
                  isSelected && styles.availableShortcutSelected,
                  configShortcuts.length >= maxVisible &&
                    !isSelected &&
                    styles.availableShortcutDisabled,
                ]}
                onPress={() => toggleShortcut(shortcut)}
                disabled={configShortcuts.length >= maxVisible && !isSelected}
              >
                <View style={styles.availableShortcutLeft}>
                  {shortcut.icon && (
                    <shortcut.icon
                      size={20}
                      color={
                        isAgentCommand
                          ? colors.secondary[500]
                          : colors.primary[500]
                      }
                    />
                  )}
                  <View style={styles.availableShortcutText}>
                    <Text
                      variant="body"
                      color="primary"
                      weight={isSelected ? "medium" : "normal"}
                    >
                      {shortcut.label}
                      {isAgentCommand && (
                        <Text variant="bodySmall" color="secondary">
                          {" "}
                          (AI)
                        </Text>
                      )}
                    </Text>
                    {shortcut.description && (
                      <Text variant="bodySmall" color="tertiary">
                        {shortcut.description}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.selectionIndicator,
                    isSelected && styles.selectionIndicatorSelected,
                  ]}
                >
                  {isSelected && (
                    <Text variant="bodySmall" color="white">
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <Button
            variant="outline"
            onPress={resetConfiguration}
            style={styles.modalActionButton}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onPress={saveConfiguration}
            style={styles.modalActionButton}
          >
            Save Changes
          </Button>
        </View>
      </View>
    </Modal>
  );

  // Group shortcuts by category if showCategories is true
  const groupedShortcuts = showCategories
    ? shortcuts.reduce((groups, shortcut) => {
        const category = shortcut.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(shortcut);
        return groups;
      }, {} as Record<string, Shortcut[]>)
    : { all: shortcuts };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showCategories
          ? Object.entries(groupedShortcuts).map(
              ([category, categoryShortcuts]) => (
                <View key={category} style={styles.categorySection}>
                  <Text
                    variant="bodySmall"
                    color="secondary"
                    style={styles.categoryLabel}
                  >
                    {CATEGORY_LABELS[
                      category as keyof typeof CATEGORY_LABELS
                    ] || category}
                  </Text>
                  <View style={styles.categoryShortcuts}>
                    {categoryShortcuts.map(renderShortcut)}
                  </View>
                </View>
              )
            )
          : shortcuts.map(renderShortcut)}

        {showConfiguration && (
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => setShowConfigModal(true)}
            activeOpacity={0.7}
          >
            <Settings size={20} color={colors.text.secondary} />
            <Text
              variant="bodySmall"
              color="secondary"
              style={styles.shortcutLabel}
            >
              Configure
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {renderConfigurationModal()}
    </View>
  );
};

// ======================== Styles ========================

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[3],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  categorySection: {
    marginRight: spacing[4],
  },
  categoryLabel: {
    marginBottom: spacing[2],
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryShortcuts: {
    flexDirection: "row",
    gap: spacing[2],
  },
  shortcutButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    minWidth: 80,
    position: "relative",
  },
  agentShortcut: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[200],
  },
  shortcutLabel: {
    marginTop: spacing[1],
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
  },
  agentBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  agentBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  configButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 80,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalCloseButton: {
    padding: spacing[2],
  },
  categoryFilter: {
    paddingVertical: spacing[3],
  },
  categoryFilterContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  categoryButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral[100],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  currentSelectionCard: {
    margin: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  currentSelectionTitle: {
    marginBottom: spacing[2],
  },
  currentSelection: {
    flexDirection: "row",
  },
  currentShortcut: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    marginRight: spacing[2],
    position: "relative",
  },
  removeButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  availableShortcut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginVertical: spacing[1],
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  availableShortcutSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  availableShortcutDisabled: {
    opacity: 0.5,
  },
  availableShortcutLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  availableShortcutText: {
    marginLeft: spacing[3],
    flex: 1,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
  },
  selectionIndicatorSelected: {
    backgroundColor: colors.primary[500],
  },
  modalActions: {
    flexDirection: "row",
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  modalActionButton: {
    flex: 1,
  },
});

export default memo(ShortcutBar);
