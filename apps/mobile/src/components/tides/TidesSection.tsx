import React from "react";
import { 
  View, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from "react-native";
import { Waves } from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { colors, spacing } from "../../design-system/tokens";
import { TideCard } from "./TideCard";
import { loggingService } from "../../services/loggingService";
import type { Tide } from "../../types";

interface TidesSectionProps {
  isConnected: boolean;
  activeTides: Tide[];
  tidesLoading: boolean;
  tidesError: string | null;
  refreshing: boolean;
  refreshTides: () => Promise<void>;
}

export const TidesSection: React.FC<TidesSectionProps> = ({
  isConnected,
  activeTides,
  tidesLoading,
  tidesError,
  refreshing,
  refreshTides,
}) => {
  const handleTideCardPress = (tide: Tide) => {
    loggingService.info("TidesSection", "Tide card pressed", {
      tideId: tide.id,
      tideName: tide.name,
    });
    // TODO: Navigate to tide detail screen
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card variant="outlined" padding={4} style={styles.tidesSection}>
      <View style={styles.tidesSectionHeader}>
        <Text variant="h4" color="primary">
          Active Tides
        </Text>
        <TouchableOpacity onPress={refreshTides} disabled={refreshing}>
          <Text
            variant="bodySmall"
            color={refreshing ? "tertiary" : "primary"}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>

      {tidesError && (
        <Text variant="body" color="error" style={styles.tidesError}>
          {tidesError}
        </Text>
      )}

      {tidesLoading ? (
        <View style={styles.tidesLoading}>
          <Text variant="body" color="secondary">
            Loading tides...
          </Text>
        </View>
      ) : activeTides.length === 0 ? (
        <View style={styles.tidesEmpty}>
          <Waves size={48} color={colors.neutral[400]} />
          <Text
            variant="body"
            color="secondary"
            align="center"
            style={styles.tidesEmptyText}
          >
            No active tides yet
          </Text>
          <Text variant="bodySmall" color="tertiary" align="center">
            Create your first tide using the tools below
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tidesScrollView}
          contentContainerStyle={styles.tidesScrollContent}
        >
          {activeTides.map((tide) => (
            <TideCard
              key={tide.id}
              tide={tide}
              onPress={() => handleTideCardPress(tide)}
            />
          ))}
        </ScrollView>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  tidesSection: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  tidesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  tidesError: {
    marginBottom: spacing[3],
    textAlign: "center",
  },
  tidesLoading: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  tidesEmpty: {
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  tidesEmptyText: {
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  tidesScrollView: {
    flexGrow: 0,
  },
  tidesScrollContent: {
    paddingRight: spacing[4],
  },
});