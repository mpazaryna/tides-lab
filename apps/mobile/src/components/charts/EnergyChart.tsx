import React from "react";
import { View, StyleSheet } from "react-native";
import { LineGraph } from "react-native-graph";
import { colors, spacing } from "../../design-system/tokens";
import { Text } from "../Text";
import { useEnergyData } from "../../hooks/useEnergyData";
import { useLocationInfo } from "../../hooks/useLocationInfo";

interface EnergyChartProps {
  tideId?: string;
  height?: number;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({
  tideId,
  height = 250,
}) => {
  const { points, error } = useEnergyData(tideId);
  const { locationInfo } = useLocationInfo();
  const yValues = points.map((p) => p.value);
  const minY = Math.max(1, Math.min(...yValues) - 1);
  const maxY = Math.min(10, Math.max(...yValues) + 1);

  // Calculate sunrise and sunset positions (0-23 hour scale mapped to 0-100%)
  const getSunPosition = (sunTime: Date | undefined) => {
    if (!sunTime) return 0;
    const hour = sunTime.getHours() + sunTime.getMinutes() / 60;
    return (hour / 24) * 100; // Convert to percentage
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartContainer}>
        {/* Sunrise and Sunset markers */}

        {locationInfo && locationInfo.sunset && locationInfo.sunrise && (
          <View
            style={[
              styles.sunLine,
              styles.sunsetMarker,
              {
                width: `${
                  getSunPosition(locationInfo.sunset) -
                  getSunPosition(locationInfo.sunrise)
                }%`,
                left: `${getSunPosition(locationInfo.sunrise)}%`,
              },
            ]}
          />
        )}

        {/* Chart or placeholder */}
        {error || !points.length ? (
          <View style={styles.emptyChart} />
        ) : (
          <LineGraph
            points={points}
            animated
            color={colors.primary[500]}
            style={styles.chart}
            range={{ y: { min: minY, max: maxY } }}
            enablePanGesture={false}
          />
        )}
      </View>
      <View style={styles.numberBottom}>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">3</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />

          <Text variant="bodySmall">6</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">9</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">12</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">3</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">6</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">9</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="bodySmall">{""}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  chartContainer: {
    height: 80,
    display: "flex",
    width: "100%",
    alignItems: "flex-start",
    backgroundColor: colors.primary[200],
    justifyContent: "flex-start",
  },
  flowCount: {
    alignSelf: "flex-end",
  },
  chart: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  numberBottom: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    paddingBottom: spacing[3],
  },
  numberCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  marker: {
    width: 1,
    height: 4,
    backgroundColor: colors.neutral[400],
  },
  sunLine: {
    position: "absolute",
    height: 80,
    backgroundColor: colors.warning[100],
    zIndex: 1,
  },
  sunriseMarker: {
    backgroundColor: colors.warning[300],
  },
  sunsetMarker: {
    backgroundColor: colors.primary[100],
  },
  sunLabel: {
    position: "absolute",
    top: -20,
    left: -10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sunLabelText: {
    fontSize: 14,
  },
  emptyChart: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
