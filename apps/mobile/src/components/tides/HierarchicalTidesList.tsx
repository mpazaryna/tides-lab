import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { ChevronDown, ChevronRight, Layers } from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { colors, spacing } from "../../design-system/tokens";
import type { Tide } from "../../types";

interface HierarchicalNode {
  tide: Tide;
  children: HierarchicalNode[];
  level: number;
  expanded?: boolean;
}

interface HierarchicalTidesListProps {
  tides: Tide[];
  onTideSelect?: (tide: Tide) => void;
  showDateRanges?: boolean;
}

export const HierarchicalTidesList: React.FC<HierarchicalTidesListProps> = ({
  tides,
  onTideSelect,
  showDateRanges = true,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchical structure from flat list
  const buildHierarchy = (tides: Tide[]): HierarchicalNode[] => {
    const tideMap = new Map<string, Tide>();
    const rootNodes: HierarchicalNode[] = [];
    const nodeMap = new Map<string, HierarchicalNode>();

    // Create map of all tides
    tides.forEach((tide) => {
      tideMap.set(tide.id, tide);
      nodeMap.set(tide.id, {
        tide,
        children: [],
        level: 0,
        expanded: expandedNodes.has(tide.id),
      });
    });

    // Build parent-child relationships
    tides.forEach((tide) => {
      const node = nodeMap.get(tide.id)!;

      if (tide.parent_tide_id && nodeMap.has(tide.parent_tide_id)) {
        const parentNode = nodeMap.get(tide.parent_tide_id)!;
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    // Sort nodes by creation date and flow type
    const sortNodes = (nodes: HierarchicalNode[]) => {
      nodes.sort((a, b) => {
        // Sort by flow type priority (daily, weekly, monthly, project, seasonal)
        const typeOrder = ["daily", "weekly", "monthly", "project", "seasonal"];
        const aIndex = typeOrder.indexOf(a.tide.flow_type);
        const bIndex = typeOrder.indexOf(b.tide.flow_type);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        // Then by creation date (newest first)
        return (
          new Date(b.tide.created_at).getTime() -
          new Date(a.tide.created_at).getTime()
        );
      });

      nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(rootNodes);
    return rootNodes;
  };

  // Flatten hierarchy for FlatList
  const flattenHierarchy = (nodes: HierarchicalNode[]): HierarchicalNode[] => {
    const result: HierarchicalNode[] = [];

    const addNode = (node: HierarchicalNode) => {
      result.push(node);
      if (node.expanded && node.children.length > 0) {
        node.children.forEach(addNode);
      }
    };

    nodes.forEach(addNode);
    return result;
  };

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const hierarchicalNodes = buildHierarchy(tides);
  const flattenedNodes = flattenHierarchy(hierarchicalNodes);

  const getContextColor = (flowType: string): string => {
    switch (flowType) {
      case "daily":
        return colors.primary[500];
      case "weekly":
        return colors.secondary[500];
      case "monthly":
        return colors.info;
      case "project":
        return colors.warning;
      case "seasonal":
        return colors.success;
      default:
        return colors.neutral[500];
    }
  };

  const formatDateRange = (tide: Tide): string | null => {
    if (tide.date_start && tide.date_end) {
      const start = new Date(tide.date_start);
      const end = new Date(tide.date_end);
      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString();
      } else {
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
    } else if (tide.date_start) {
      return new Date(tide.date_start).toLocaleDateString();
    }
    return null;
  };

  const renderTideNode = ({ item: node }: { item: HierarchicalNode }) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.tide.id);
    const contextColor = getContextColor(node.tide.flow_type);
    const dateRange = showDateRanges ? formatDateRange(node.tide) : null;

    return (
      <View style={[styles.nodeContainer, { marginLeft: node.level * 20 }]}>
        <TouchableOpacity
          style={[styles.tideRow, { borderLeftColor: contextColor }]}
          onPress={() => onTideSelect?.(node.tide)}
          onLongPress={() => hasChildren && toggleExpand(node.tide.id)}
        >
          {/* Hierarchical indicator */}
          <View style={styles.hierarchyIndicator}>
            {hasChildren ? (
              <TouchableOpacity
                onPress={() => toggleExpand(node.tide.id)}
                style={styles.expandButton}
              >
                {isExpanded ? (
                  <ChevronDown size={16} color={colors.neutral[600]} />
                ) : (
                  <ChevronRight size={16} color={colors.neutral[600]} />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.expandButton}>
                {node.level > 0 && (
                  <View
                    style={[
                      styles.childIndicator,
                      { backgroundColor: contextColor },
                    ]}
                  />
                )}
              </View>
            )}
          </View>

          {/* Tide info */}
          <View style={styles.tideInfo}>
            <View style={styles.tideHeader}>
              <Text
                variant="body"
                style={[styles.tideName, { color: contextColor }]}
                numberOfLines={1}
              >
                {node.tide.name}
              </Text>
              <View style={styles.tideMetadata}>
                {node.tide.auto_created && (
                  <View style={styles.autoTag}>
                    <Text variant="caption" style={styles.autoTagText}>
                      AUTO
                    </Text>
                  </View>
                )}
                <Text variant="caption" style={styles.flowType}>
                  {node.tide.flow_type.toUpperCase()}
                </Text>
              </View>
            </View>

            {node.tide.description && (
              <Text
                variant="caption"
                style={styles.description}
                numberOfLines={2}
              >
                {node.tide.description}
              </Text>
            )}

            <View style={styles.tideStats}>
              <Text variant="caption" style={styles.statText}>
                {node.tide.flow_count || 0} flows
              </Text>
              {dateRange && (
                <Text variant="caption" style={styles.statText}>
                  {dateRange}
                </Text>
              )}
              <Text variant="caption" style={styles.statText}>
                {node.tide.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (tides.length === 0) {
    return (
      <Card variant="outlined" style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Layers size={48} color={colors.neutral[400]} />
          <Text
            variant="body"
            color="secondary"
            align="center"
            style={styles.emptyText}
          >
            No hierarchical tides yet
          </Text>
          <Text variant="caption" color="tertiary" align="center">
            Create daily, weekly, or monthly tides to see the hierarchy
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="outlined" style={styles.container}>
      <View style={styles.header}>
        <Text variant="h4" style={styles.title}>
          Hierarchical Tides
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          {tides.length} tides • Tap to expand children
        </Text>
      </View>

      <FlatList
        data={flattenedNodes}
        keyExtractor={(item) => item.tide.id}
        renderItem={renderTideNode}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    maxHeight: 500,
  },
  header: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.neutral[600],
  },
  list: {
    padding: spacing[3],
  },

  emptyContainer: {
    margin: spacing[4],
    padding: spacing[8],
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },

  nodeContainer: {
    marginVertical: 2,
  },
  tideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: spacing[4],
    borderLeftWidth: 4,
    marginBottom: spacing[2],
  },

  hierarchyIndicator: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  expandButton: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  childIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  tideInfo: {
    flex: 1,
  },
  tideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  tideName: {
    flex: 1,
    fontWeight: "600",
    marginRight: spacing[3],
  },
  tideMetadata: {
    flexDirection: "row",
    alignItems: "center",
  },
  autoTag: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  autoTagText: {
    color: colors.neutral[50],
    fontSize: 10,
    fontWeight: "700",
  },
  flowType: {
    color: colors.neutral[600],
    fontSize: 10,
    fontWeight: "600",
  },

  description: {
    color: colors.neutral[600],
    marginBottom: spacing[2],
    lineHeight: 14,
  },

  tideStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    color: colors.neutral[500],
    fontSize: 11,
  },
});
