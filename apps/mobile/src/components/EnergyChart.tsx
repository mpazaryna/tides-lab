import { StyleSheet, Text, TouchableOpacity, Alert, Clipboard } from "react-native";
import React, { useMemo, useEffect } from "react";
import { useTimeContext } from "../context/TimeContext";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear } from "d3";
import { useSharedValue, withTiming } from "react-native-reanimated";

// ✅ TUTORIAL COMPARISON: Missing scalePoint import for proper x-axis scaling
// Current implementation uses scaleLinear for both axes, but tutorial uses scalePoint for x-axis

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  timestamp: string;
  originalLevel: string | number;
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
      const monthEnd = new Date(
        offsetDate.getFullYear(),
        offsetDate.getMonth() - dateOffset + 1,
        0,
        23,
        59,
        59,
        999
      );
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
      if (currentContext === "daily") {
        // For daily context: animate based on current time of day
        const now = new Date();
        
        // Get current time as hours (0-24)
        const currentHours = now.getHours() + now.getMinutes() / 60;
        const progressPercent = Math.min(currentHours / 24, 1); // 0 to 1 based on time of day, capped at 1
        
        // If viewing current day, animate to current time
        // If viewing past/future days, show full line
        const targetProgress = dateOffset === 0 ? progressPercent : 1;
        
        animationLine.value = withTiming(targetProgress, { duration: 1000 });
      } else {
        // For weekly/monthly context: show full line
        animationLine.value = withTiming(1, { duration: 1000 });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentContext, dateOffset]);

  // Filter data to show only points within the time range for non-project contexts
  const filteredData =
    currentContext === "project"
      ? data
      : data.filter((d) => d.x >= startTime && d.x <= endTime);

  // Chart scaling domains and ranges (memoized to prevent re-renders)
  // ❌ REQUIREMENT 5 & 7: Should use scalePoint for x-axis, not scaleLinear
  const xDomain = useMemo(
    () =>
      filteredData.length > 0
        ? [
            Math.min(...filteredData.map((d) => d.x)), // ✅ REQUIREMENT 8: Found minimum data values
            Math.max(...filteredData.map((d) => d.x)), // ✅ REQUIREMENT 8: Found maximum data values
          ]
        : [startTime, endTime], // Timestamp range
    [filteredData, startTime, endTime]
  );

  // ✅ REQUIREMENT 4 & 9: Y-domain for chart from mapping data values (energy level min/max always 0-10)
  const yDomain = useMemo(
    () =>
      filteredData.length > 0
        ? [
            Math.min(...filteredData.map((d) => d.y)), // ✅ REQUIREMENT 8: Found minimum data values
            Math.max(...filteredData.map((d) => d.y)), // ✅ REQUIREMENT 8: Found maximum data values
          ]
        : [1, 10], // ✅ REQUIREMENT 8: Energy level min/max is always 0-10 (using 1-10 as default)
    [filteredData]
  );

  // ✅ REQUIREMENT 3: D3 scales for mapping data to pixels
  // ❌ REQUIREMENT 5 & 7: Should use scalePoint for x-axis (discrete time points), currently using scaleLinear
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain(xDomain)
        .range([chartMargin, chartWidth - chartMargin]), // ✅ REQUIREMENT 6: Range for x-axis (pixel space)
    [xDomain, chartMargin, chartWidth]
  );

  // ✅ REQUIREMENT 11: Y-scale created using scaleLinear mapping values from yDomain to yRange
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain(yDomain)
        .range([chartHeight - chartMargin, chartMargin]), // ✅ REQUIREMENT 10: Range for y-axis from chartHeight to 0 (inverted)
    [yDomain, chartHeight, chartMargin]
  );

  // Generate curved line following GitHub reference pattern
  const curvedLine = useMemo(() => {
    if (filteredData.length === 0) return null;

    return line<ChartDataPoint>()
      .x((d) => xScale(d.x)) // Following reference: .x(d => x(d.label)!)
      .y((d) => yScale(d.y)) // Following reference: .y(d => y(d.value))
      .curve(curveBasis)(filteredData); // Following reference: .curve(curveBasis)(data)
  }, [filteredData, xScale, yScale]);

  // Convert D3 SVG string to Skia path (following tutorial pattern)
  const linePath = useMemo(() => {
    if (!curvedLine) return null;
    return Skia.Path.MakeFromSVGString(curvedLine);
  }, [curvedLine]);

  const copyDebugInfo = () => {
    const debugInfo = `
ENERGY CHART DEBUG INFO
======================
Context: ${currentContext} ${dateOffset > 0 ? `(-${dateOffset})` : "(current)"}
Energy Points: ${filteredData.length} of ${data.length}
X Min/Max: ${new Date(xDomain[0]).toLocaleDateString()} - ${new Date(xDomain[1]).toLocaleDateString()}
Y Min/Max: [${yDomain[0]} - ${yDomain[1]}]
X Range: [${chartMargin}px - ${chartWidth - chartMargin}px]
Y Range: [${chartHeight - chartMargin}px - ${chartMargin}px]
CurvedLine: ${curvedLine ? "✅ Generated" : "❌ Failed"}
LinePath: ${linePath ? "✅ Created" : "❌ Failed"}
Filtered Data: ${filteredData.length} points
Chart Dimensions: ${chartWidth}x${chartHeight}, margin: ${chartMargin}
Animation Progress: ${currentContext === "daily" && dateOffset === 0 ? `${((new Date().getHours() + new Date().getMinutes() / 60) / 24 * 100).toFixed(1)}%` : "100%"}

FILTERED DATA POINTS:
${filteredData.map(d => `- ${new Date(d.x).toLocaleString()}: Level ${d.y} (${d.originalLevel})`).join('\n')}

RAW DATA:
${data.map(d => `- ${new Date(d.x).toLocaleString()}: Level ${d.y} (${d.originalLevel})`).join('\n')}
    `.trim();
    
    Clipboard.setString(debugInfo);
    Alert.alert("Debug Info Copied!", "All debug information copied to clipboard");
  };

  return (
    <>
      <TouchableOpacity onPress={copyDebugInfo} style={{backgroundColor: 'orange', padding: 10, margin: 5, borderRadius: 5}}>
        <Text style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>📋 COPY DEBUG INFO</Text>
      </TouchableOpacity>
      <Text>
        Context: {currentContext}{" "}
        {dateOffset > 0 ? `(-${dateOffset})` : "(current)"}
      </Text>
      <Text>
        Energy Points: {filteredData.length} of {data.length}
      </Text>
      <Text>
        X Min/Max: {new Date(xDomain[0]).toLocaleDateString()} -{" "}
        {new Date(xDomain[1]).toLocaleDateString()}
      </Text>
      <Text>
        Y Min/Max: [{yDomain[0]} - {yDomain[1]}]
      </Text>
      <Text>
        X Range: [{chartMargin}px - {chartWidth - chartMargin}px]
      </Text>
      <Text>
        Y Range: [{chartHeight - chartMargin}px - {chartMargin}px]
      </Text>
      {filteredData.length > 0 && (
        <Text>
          Scale Demo: First point at {xScale(filteredData[0].x).toFixed(0)}px,{" "}
          {yScale(filteredData[0].y).toFixed(0)}px
        </Text>
      )}
      {filteredData.length > 0 && (
        <Text>
          Latest: {filteredData[filteredData.length - 1].originalLevel} at{" "}
          {new Date(
            filteredData[filteredData.length - 1].x
          ).toLocaleTimeString()}
        </Text>
      )}
      {curvedLine && (
        <Text>CurvedLine Generated: {curvedLine.length} characters</Text>
      )}
      {linePath && <Text>LinePath Created: Skia path ready for rendering</Text>}
      {!linePath && curvedLine && <Text>ERROR: CurvedLine exists but LinePath failed</Text>}
      {!curvedLine && <Text>ERROR: No curvedLine generated</Text>}
      <Text>
        DEBUG: curvedLine={curvedLine ? "✅" : "❌"} | linePath={linePath ? "✅" : "❌"} | filteredData={filteredData.length}
      </Text>
      <Text>
        Animation Progress: {
          currentContext === "daily" && dateOffset === 0 
            ? `${((new Date().getHours() + new Date().getMinutes() / 60) / 24 * 100).toFixed(1)}% (${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')})`
            : "100% (Full line)"
        }
      </Text>
      <Canvas
        style={{
          height: chartHeight,
          width: chartWidth,
          backgroundColor: "#f0f0f0", // Light background to see canvas bounds
          borderWidth: 2,
          borderColor: "red", // Red border to debug canvas positioning
        }}
      >
        {linePath && (
          <Path
            path={linePath}
            style={"stroke"}
            strokeWidth={6} // Thicker line to make it more visible
            color={"blue"} // Blue color to make it stand out
            strokeCap={"round"}
            start={0}
            end={animationLine}
          />
        )}
      </Canvas>
    </>
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
});
