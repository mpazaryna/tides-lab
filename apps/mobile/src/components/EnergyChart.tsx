import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Clipboard,
  View,
} from "react-native";
import React, { useMemo, useEffect } from "react";
import { useTimeContext } from "../context/TimeContext";
import {
  Canvas,
  Path,
  Skia,
  Circle,
  Text as SkiaText,
  Group,
} from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear, curveCardinal } from "d3";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../design-system";
import { ContextToggle } from "./ContextToggle";

// ✅ TUTORIAL COMPARISON: Missing scalePoint import for proper x-axis scaling
// Current implementation uses scaleLinear for both axes, but tutorial uses scalePoint for x-axis

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  timestamp: string;
  originalLevel: string | number;
  isGenerated?: boolean; // Optional flag for generated points
}

type TideContext = "daily" | "weekly" | "monthly";

type Props = {
  data: ChartDataPoint[]; // ✅ REQUIREMENT 2: Sample data structure
  context?: TideContext;
  chartHeight: number; // ✅ REQUIREMENT 1: Defined size of chart and canvas (height)
  chartMargin: number; // ✅ REQUIREMENT 1: Defined size of chart and canvas (margin)
  chartWidth: number; // ✅ REQUIREMENT 1: Defined size of chart and canvas (width)
};

const EnergyChart = ({ data, chartHeight, chartMargin, chartWidth }: Props) => {
  // Validate chart dimensions for scalability
  if (chartWidth <= 0 || chartHeight <= 0) {
    console.warn("EnergyChart: Invalid chart dimensions", {
      chartWidth,
      chartHeight,
    });
    return null;
  }

  if (data.length === 0) {
    return null; // Gracefully handle empty data
  }
  const { currentContext, dateOffset } = useTimeContext();

  // Calculate time range based on current context and date offset
  const getTimeRange = () => {
    const now = new Date();
    const offsetDate = new Date(now);

    if (currentContext === "daily") {
      offsetDate.setDate(now.getDate() - dateOffset);
      const start = new Date(offsetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(offsetDate);
      end.setHours(23, 59, 59, 999);
      return [start.getTime(), end.getTime()];
    } else if (currentContext === "weekly") {
      const weekStart = new Date(offsetDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek - dateOffset * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return [weekStart.getTime(), weekEnd.getTime()];
    } else if (currentContext === "monthly") {
      const monthStart = new Date(
        offsetDate.getFullYear(),
        offsetDate.getMonth() - dateOffset,
        1
      );
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(
        offsetDate.getFullYear(),
        offsetDate.getMonth() - dateOffset + 1,
        0 // Day 0 of next month = last day of current month
      );
      monthEnd.setHours(23, 59, 59, 999);

      return [monthStart.getTime(), monthEnd.getTime()];
    } else {
      // For project context, show all data
      return data.length > 0
        ? [Math.min(...data.map((d) => d.x)), Math.max(...data.map((d) => d.x))]
        : [0, 1];
    }
  };

  const [startTime, endTime] = getTimeRange();

  const animationLine = useSharedValue(0);

  // Calculate animation progress based on current time and context
  useEffect(() => {
    // Reset animation to prevent "already working" error
    animationLine.value = 0;

    // Small delay to prevent animation conflicts
    const timer = setTimeout(() => {
      // Animate all contexts - they all get the same smooth drawing animation
      animationLine.value = withTiming(1, { duration: 600 });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentContext, dateOffset, startTime, endTime]);

  // Filter data to show only points within the time range for non-project contexts
  const filteredData =
    currentContext === "project"
      ? data
      : data.filter((d) => d.x >= startTime && d.x <= endTime);

  // Process data for different contexts
  const processedData = useMemo(() => {
    if (currentContext === "daily" && filteredData.length > 0) {
      // For daily context: add a starting point at midnight
      const dayStart = new Date(startTime);

      // For current day animation, filter out future data points
      let dataToUse = filteredData;
      if (dateOffset === 0) {
        const now = new Date();
        dataToUse = filteredData.filter((point) => point.x <= now.getTime());
      }

      // Use the first data point's energy level or a default of 6 (medium)
      const startingEnergyLevel = dataToUse.length > 0 ? dataToUse[0].y : 6;

      const startingPoint: ChartDataPoint = {
        x: dayStart.getTime(),
        y: startingEnergyLevel,
        label: "Day start",
        timestamp: dayStart.toISOString(),
        originalLevel: startingEnergyLevel,
        isGenerated: true, // Flag to identify this as a generated point
      };

      // For current day, add current time endpoint if needed
      if (dateOffset === 0 && dataToUse.length > 0) {
        const now = new Date();
        const lastDataPoint = dataToUse[dataToUse.length - 1];

        // Add current time point with last known energy level
        const currentTimePoint: ChartDataPoint = {
          x: now.getTime(),
          y: lastDataPoint.y, // Use last energy level
          label: "Current time",
          timestamp: now.toISOString(),
          originalLevel: lastDataPoint.y,
          isGenerated: true,
        };

        dataToUse = [...dataToUse, currentTimePoint];
      }

      // Combine starting point with actual data
      const combinedData = [startingPoint, ...dataToUse];

      // Sort by time to ensure proper line drawing
      return combinedData.sort((a, b) => a.x - b.x);
    }

    if (currentContext !== "monthly" || filteredData.length === 0) {
      return filteredData;
    }

    // Group data by date (ignore time within day)
    const dailyData = new Map<string, ChartDataPoint[]>();

    filteredData.forEach((point) => {
      const dateKey = new Date(point.x).toDateString();
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(point);
    });

    // Calculate daily averages
    const dailyAverages: ChartDataPoint[] = [];
    for (const [dateKey, dayPoints] of dailyData.entries()) {
      const avgEnergy =
        dayPoints.reduce((sum, point) => sum + point.y, 0) / dayPoints.length;
      // Use noon of each day for positioning
      const dayDate = new Date(dateKey);
      dayDate.setHours(12, 0, 0, 0);

      dailyAverages.push({
        x: dayDate.getTime(),
        y: avgEnergy,
        label: `Daily avg: ${avgEnergy.toFixed(1)}`,
        timestamp: dayDate.toISOString(),
        originalLevel: avgEnergy.toFixed(1),
      });
    }

    // Sort by date
    dailyAverages.sort((a, b) => a.x - b.x);

    // Apply 3-day rolling average
    const rollingAverages: ChartDataPoint[] = [];
    for (let i = 0; i < dailyAverages.length; i++) {
      const windowStart = Math.max(0, i - 1); // 1 day before
      const windowEnd = Math.min(dailyAverages.length - 1, i + 1); // 1 day after

      let sum = 0;
      let count = 0;

      for (let j = windowStart; j <= windowEnd; j++) {
        sum += dailyAverages[j].y;
        count++;
      }

      const rollingAvg = sum / count;
      rollingAverages.push({
        x: dailyAverages[i].x,
        y: rollingAvg,
        label: `3-day avg: ${rollingAvg.toFixed(1)}`,
        timestamp: dailyAverages[i].timestamp,
        originalLevel: rollingAvg.toFixed(1),
      });
    }

    return rollingAverages;
  }, [currentContext, filteredData]);

  // Chart scaling domains and ranges (memoized to prevent re-renders)
  // ✅ For daily context: use full 24-hour range to position data at actual times
  const xDomain = useMemo(() => {
    if (currentContext === "daily") {
      // Always use full day range for proper time positioning
      return [startTime, endTime]; // 00:00 to 23:59 of the selected day
    } else {
      // For weekly/monthly: use min/max of actual data
      return processedData.length > 0
        ? [
            Math.min(...processedData.map((d) => d.x)),
            Math.max(...processedData.map((d) => d.x)),
          ]
        : [startTime, endTime];
    }
  }, [currentContext, processedData, startTime, endTime]);

  // ✅ REQUIREMENT 4 & 9: Y-domain fixed to 0-10 for consistent energy level scaling
  const yDomain = [0, 10]; // Always use full energy scale range

  // ✅ REQUIREMENT 3: D3 scales for mapping data to pixels
  // ❌ REQUIREMENT 5 & 7: Should use scalePoint for x-axis (discrete time points), currently using scaleLinear
  const xScale = useMemo(
    () => scaleLinear().domain(xDomain).range([0, chartWidth]), // ✅ REQUIREMENT 6: Range for x-axis (pixel space) - start at beginning
    [xDomain, chartWidth]
  );

  // ✅ REQUIREMENT 11: Y-scale created using scaleLinear mapping values from yDomain to yRange
  const yScale = useMemo(
    () => scaleLinear().domain(yDomain).range([chartHeight, 0]), // ✅ REQUIREMENT 10: Range for y-axis from chartHeight to 0 (inverted) - use full height
    [chartHeight] // yDomain is now constant [0, 10]
  );

  // Generate current time line (up to present)
  const curvedLine = useMemo(() => {
    if (processedData.length === 0) return null;

    return line<ChartDataPoint>()
      .x((d) => xScale(d.x)) // Following reference: .x(d => x(d.label)!)
      .y((d) => yScale(d.y)) // Following reference: .y(d => y(d.value))
      .curve(curveCardinal.tension(0.5))(processedData); // More responsive to data points than curveBasis
  }, [processedData, xScale, yScale]);

  // Generate future line data (from current time to end of day) - for daily context only
  const futureLineData = useMemo(() => {
    if (
      currentContext !== "daily" ||
      dateOffset !== 0 ||
      processedData.length === 0
    ) {
      return [];
    }

    // Get the current time point (last point from current data)
    const currentTimePoint = processedData[processedData.length - 1];
    if (!currentTimePoint) return [];

    // Create end-of-day point using last RECORDED data point's energy level
    const endOfDay = new Date(endTime);
    const endOfDayPoint: ChartDataPoint = {
      x: endOfDay.getTime(),
      y: currentTimePoint.y, // Use the current time point's energy level (last recorded)
      label: "End of day",
      timestamp: endOfDay.toISOString(),
      originalLevel: currentTimePoint.y,
      isGenerated: true,
    };

    // Simple future line: just current time point + end of day point
    // This creates a straight line from current time to end of day at last recorded energy level
    return [currentTimePoint, endOfDayPoint];
  }, [currentContext, dateOffset, filteredData, processedData, endTime]);

  const futureCurvedLine = useMemo(() => {
    if (futureLineData.length === 0) return null;

    return line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0.5))(futureLineData);
  }, [futureLineData, xScale, yScale]);

  // Convert D3 SVG string to Skia path (following tutorial pattern)
  const linePath = useMemo(() => {
    if (!curvedLine) return null;
    try {
      return Skia.Path.MakeFromSVGString(curvedLine);
    } catch (error) {
      console.warn("Failed to create Skia path from SVG string:", error);
      return null;
    }
  }, [curvedLine]);

  // Convert future line to Skia path
  const futureLinePath = useMemo(() => {
    if (!futureCurvedLine) return null;
    try {
      return Skia.Path.MakeFromSVGString(futureCurvedLine);
    } catch (error) {
      console.warn("Failed to create future Skia path from SVG string:", error);
      return null;
    }
  }, [futureCurvedLine]);

  const copyDebugInfo = () => {
    const debugInfo = `
ENERGY CHART DEBUG INFO
======================
Context: ${currentContext} ${dateOffset > 0 ? `(-${dateOffset})` : "(current)"}
Energy Points: ${processedData.length} of ${data.length} ${
      currentContext === "monthly" ? "(3-day rolling avg)" : ""
    }
X Min/Max: ${new Date(xDomain[0]).toLocaleDateString()} - ${new Date(
      xDomain[1]
    ).toLocaleDateString()}
Y Min/Max: [${yDomain[0]} - ${yDomain[1]}]
X Range: [0px - ${chartWidth}px]
Y Range: [${chartHeight}px - 0px]
CurvedLine: ${curvedLine ? "✅ Generated" : "❌ Failed"}
LinePath: ${linePath ? "✅ Created" : "❌ Failed"}
Processed Data: ${processedData.length} points
Chart Dimensions: ${chartWidth}x${chartHeight}, margin: ${chartMargin}
Current Time: ${new Date().toLocaleTimeString()}
Start Time: ${new Date(startTime).toLocaleTimeString()}
End Time: ${new Date(endTime).toLocaleTimeString()}
Time Progress: ${
      currentContext === "daily" && dateOffset === 0
        ? `${(
            ((new Date().getTime() - startTime) / (endTime - startTime)) *
            100
          ).toFixed(1)}%`
        : "100%"
    }
Animation Value: ${animationLine.value.toFixed(3)}

PROCESSED DATA POINTS:
${processedData
  .map(
    (d) =>
      `- ${new Date(d.x).toLocaleString()}: Level ${d.y.toFixed(1)} (${
        d.originalLevel
      })`
  )
  .join("\n")}

RAW DATA:
${data
  .map(
    (d) =>
      `- ${new Date(d.x).toLocaleString()}: Level ${d.y} (${d.originalLevel})`
  )
  .join("\n")}
    `.trim();

    Clipboard.setString(debugInfo);
    Alert.alert(
      "Debug Info Copied!",
      "All debug information copied to clipboard"
    );
  };

  return (
    <View
      style={{
        position: "relative",
      }}
    >
      {/* Context Toggle */}
      <View style={styles.contextToggleWrapper}>
        <ContextToggle variant="full" showLabels={true} />
      </View>
      
      <Canvas
        style={{
          height: chartHeight,
          width: chartWidth,
          backgroundColor: colors.inputPlaceholder,
        }}
      >
        {/* Current time line - full opacity */}
        {linePath && (
          <Path
            path={linePath}
            style={"stroke"}
            strokeWidth={2}
            color={"white"}
            strokeCap={"round"}
            start={0}
            end={animationLine}
          />
        )}

        {/* Future projection line - 10% opacity */}
        {futureLinePath && (
          <Path
            path={futureLinePath}
            style={"stroke"}
            strokeWidth={2}
            color={"rgba(255,255,255,0.1)"}
            strokeCap={"round"}
            start={0}
            end={1}
          />
        )}

        {/* Current time indicator for daily context */}
        {currentContext === "daily" &&
          dateOffset === 0 &&
          (() => {
            const now = new Date();
            const currentTimeX = xScale(now.getTime());
            return currentTimeX >= 0 && currentTimeX <= chartWidth ? (
              <Group>
                {/* Current time line */}
                <Path
                  path={`M${currentTimeX},0 L${currentTimeX},${chartHeight}`}
                  style={"stroke"}
                  strokeWidth={1}
                  color={"rgba(255,255,255,0.5)"}
                  strokeDashArray={[4, 4]}
                />
              </Group>
            ) : null;
          })()}

        {/* Data point markers for all contexts (excluding generated points) */}
        {processedData
          .filter((point) => !point.isGenerated)
          .map((point, index) => {
            const x = xScale(point.x);
            const y = yScale(point.y);

            return (
              <Group key={`point-${index}`}>
                {/* Data point circle */}
                <Circle cx={x} cy={y} r={2.5} color={"white"} style={"fill"} />
              </Group>
            );
          })}
      </Canvas>
      <View style={styles.notchWrapper}>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>3</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>6</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>9</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>12</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>3</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>6</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
          <Text style={styles.notchNumber}>9</Text>
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
        <View style={styles.notchItem}>
          <View style={styles.notch} />
        </View>
      </View>

      {/* Tooltips showing energy levels and native timestamps (excluding generated points) */}
      {processedData
        .filter((point) => !point.isGenerated)
        .map((point, index) => {
          const x = xScale(point.x);
          const y = yScale(point.y);

          // Format time/date in user's native timezone based on context
          const localDate = new Date(point.x);
          const energyLevel = Math.round(point.y).toString();
          let timeText = "";

          if (currentContext === "daily") {
            // Show time for daily context: "7:00 AM"
            timeText = localDate.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          } else if (currentContext === "weekly") {
            // Show day and time for weekly context: "Mon 7:00 AM"
            timeText = localDate.toLocaleString([], {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          } else if (currentContext === "monthly") {
            // Show date for monthly context (3-day avg): "Aug 31"
            timeText = localDate.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
          } else {
            // Project context: show full date and time
            timeText = localDate.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          }

          return (
            <View
              key={`tooltip-${index}`}
              style={{
                position: "absolute",
                width: 46,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                left: x - 23,
                top: y - 30,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,.6)",
                  fontSize: 8,
                  textAlign: "center",
                }}
              >
                {timeText}
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 13,
                  fontWeight: "bold",
                }}
              >
                {energyLevel}
              </Text>
            </View>
          );
        })}
    </View>
  );
};

export default EnergyChart;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  contextToggleWrapper: {
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: "center",
  },
  notchWrapper: {
    display: "flex",
    flexDirection: "row",
  },
  notchItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2.5,
    flex: 1,
  },
  notch: {
    height: 3,
    width: 0.5,
    backgroundColor: "rgba(255,255,255,.2)",
  },
  notchNumber: {
    color: "rgba(255,255,255,.4)",
  },
});
