import { StyleSheet, Alert, Clipboard, View } from "react-native";
import React, { useMemo, useEffect } from "react";
import { useTimeContext } from "../context/TimeContext";
import { useLocationData } from "../hooks/useLocationData";
import * as SunCalc from "suncalc";
import {
  Canvas,
  Path,
  Skia,
  Circle,
  Group,
  Shadow,
} from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear, curveCardinal } from "d3";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { colors, Text } from "../design-system";

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
  const { locationInfo } = useLocationData();

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

  // Calculate sunrise/sunset for the current date being displayed
  const getSunTimes = useMemo(() => {
    if (!locationInfo.latitude || !locationInfo.longitude) return null;

    const targetDate = new Date();
    if (currentContext === "daily") {
      targetDate.setDate(targetDate.getDate() - dateOffset);
    } else if (currentContext === "weekly") {
      // For weekly, we'll calculate for each day in the week
      return null; // Handle separately for weekly
    } else {
      return null; // No sun markers for monthly/project
    }

    return SunCalc.getTimes(
      targetDate,
      locationInfo.latitude,
      locationInfo.longitude
    );
  }, [locationInfo, currentContext, dateOffset]);

  const animationLine = useSharedValue(0);

  // Calculate animation progress based on current time and context
  useEffect(() => {
    // Reset animation to prevent "already working" error
    animationLine.value = 0;

    // Small delay to prevent animation conflicts
    const timer = setTimeout(() => {
      // Animate all contexts - they all get the same smooth drawing animation
      animationLine.value = withTiming(1, { duration: 600 });
    }, 0);

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

    if (currentContext === "weekly" && filteredData.length > 0) {
      // For weekly context: group by day of week (hard-coded positions)
      const weeklyData = new Map<number, ChartDataPoint[]>();

      // Initialize all 7 days of the week
      for (let i = 0; i < 7; i++) {
        weeklyData.set(i, []);
      }

      filteredData.forEach((point) => {
        const dayOfWeek = new Date(point.x).getDay(); // 0 = Sunday, 1 = Monday, etc.
        weeklyData.get(dayOfWeek)!.push(point);
      });

      // Only create points for days that have actual data
      const weeklyAverages: ChartDataPoint[] = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayPoints = weeklyData.get(dayOfWeek)!;

        // Only add points for days with actual data
        if (dayPoints.length > 0) {
          // Has data - show actual average
          const avgEnergy =
            dayPoints.reduce((sum, point) => sum + point.y, 0) /
            dayPoints.length;

          // Use actual day timestamp (noon of that day) for proper alignment with current time
          const weekStart = new Date(startTime);
          const dayTimestamp = new Date(weekStart);
          dayTimestamp.setDate(weekStart.getDate() + dayOfWeek);
          dayTimestamp.setHours(12, 0, 0, 0); // Noon of that day

          weeklyAverages.push({
            x: dayTimestamp.getTime(),
            y: avgEnergy,
            label: `${dayNames[dayOfWeek]} avg: ${avgEnergy.toFixed(1)}`,
            timestamp: dayTimestamp.toISOString(),
            originalLevel: avgEnergy.toFixed(1),
          });
        }
        // Skip days with no data - don't add any point
      }

      console.log("Weekly averages by day:", weeklyAverages.length, "points");

      // Add invisible edge points for continuous line if Sunday/Saturday missing
      if (weeklyAverages.length > 0) {
        const hasSunday = weeklyAverages.some((point) =>
          point.label.startsWith("Sun")
        );
        const hasSaturday = weeklyAverages.some((point) =>
          point.label.startsWith("Sat")
        );

        // Add invisible Sunday point if missing (use first available day's energy)
        if (!hasSunday) {
          const firstPoint = weeklyAverages[0];
          const weekStart = new Date(startTime);
          const sundayTimestamp = new Date(weekStart);
          sundayTimestamp.setDate(weekStart.getDate() + 0); // Sunday (day 0)
          sundayTimestamp.setHours(12, 0, 0, 0);

          weeklyAverages.unshift({
            x: sundayTimestamp.getTime(),
            y: firstPoint.y,
            label: `Sun edge: ${firstPoint.y.toFixed(1)}`,
            timestamp: sundayTimestamp.toISOString(),
            originalLevel: firstPoint.y.toFixed(1),
            isGenerated: true, // Invisible edge point
          });
        }

        // Add invisible Saturday point if missing (use last available day's energy)
        if (!hasSaturday) {
          const lastPoint = weeklyAverages[weeklyAverages.length - 1];
          const weekStart = new Date(startTime);
          const saturdayTimestamp = new Date(weekStart);
          saturdayTimestamp.setDate(weekStart.getDate() + 6); // Saturday (day 6)
          saturdayTimestamp.setHours(12, 0, 0, 0);

          weeklyAverages.push({
            x: saturdayTimestamp.getTime(),
            y: lastPoint.y,
            label: `Sat edge: ${lastPoint.y.toFixed(1)}`,
            timestamp: saturdayTimestamp.toISOString(),
            originalLevel: lastPoint.y.toFixed(1),
            isGenerated: true, // Invisible edge point
          });
        }

        // Sort by position to ensure proper line drawing
        weeklyAverages.sort((a, b) => a.x - b.x);
      }

      // For current week (dateOffset === 0), add current time endpoint
      if (dateOffset === 0 && weeklyAverages.length > 0) {
        const now = new Date();
        const lastDataPoint = weeklyAverages[weeklyAverages.length - 1];

        const currentTimePoint: ChartDataPoint = {
          x: now.getTime(),
          y: lastDataPoint.y,
          label: "Current time",
          timestamp: now.toISOString(),
          originalLevel: lastDataPoint.y,
          isGenerated: true,
        };
        weeklyAverages.push(currentTimePoint);
      }

      return weeklyAverages;
    }

    if (currentContext !== "monthly" || filteredData.length === 0) {
      return filteredData;
    }

    // For monthly context: calculate 3-day rolling average for each day that has data
    console.log(
      "Monthly context - filteredData:",
      filteredData.length,
      "points"
    );

    // Group data by date first
    const dailyData = new Map<string, ChartDataPoint[]>();

    filteredData.forEach((point) => {
      const dateKey = new Date(point.x).toDateString();
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(point);
    });

    console.log("Monthly daily groups:", Array.from(dailyData.keys()));

    // Calculate daily averages for days with data
    const dailyAverages = new Map<number, number>(); // dayOfMonth -> average energy
    for (const [dateKey, dayPoints] of dailyData.entries()) {
      const avgEnergy =
        dayPoints.reduce((sum, point) => sum + point.y, 0) / dayPoints.length;
      const dayOfMonth = new Date(dateKey).getDate();
      dailyAverages.set(dayOfMonth, avgEnergy);
      console.log(
        `Day ${dayOfMonth}: ${avgEnergy.toFixed(1)} (from ${
          dayPoints.length
        } points)`
      );
    }

    // Calculate total days in month for positioning
    const monthStart = new Date(startTime);
    const monthEnd = new Date(endTime);
    const totalDays = Math.ceil(
      (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Apply 3-day rolling average and position according to actual timestamps
    const monthlyPoints: ChartDataPoint[] = [];
    const now = new Date();

    for (const [dayOfMonth, dailyAvg] of dailyAverages.entries()) {
      // For current month, only include days up to today
      const dayTimestamp = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        dayOfMonth,
        12,
        0,
        0
      );
      if (dateOffset === 0 && dayTimestamp.getTime() > now.getTime()) {
        continue; // Skip future days in current month
      }

      // Calculate 3-day rolling average (day-1, day, day+1)
      let sum = 0;
      let count = 0;

      for (let offset = -1; offset <= 1; offset++) {
        const checkDay = dayOfMonth + offset;
        if (dailyAverages.has(checkDay)) {
          sum += dailyAverages.get(checkDay)!;
          count++;
        }
      }

      const rollingAvg = count > 0 ? sum / count : dailyAvg;

      monthlyPoints.push({
        x: dayTimestamp.getTime(),
        y: rollingAvg,
        label: `Day ${dayOfMonth}: ${rollingAvg.toFixed(1)}`,
        timestamp: dayTimestamp.toISOString(),
        originalLevel: rollingAvg.toFixed(1),
      });
    }

    // Add month start point for continuous line (like daily midnight start)
    if (monthlyPoints.length > 0) {
      const firstDataPoint = monthlyPoints[0];
      const monthStartPoint: ChartDataPoint = {
        x: startTime,
        y: firstDataPoint.y,
        label: "Month start",
        timestamp: new Date(startTime).toISOString(),
        originalLevel: firstDataPoint.y,
        isGenerated: true,
      };
      monthlyPoints.unshift(monthStartPoint);

      // For current month (dateOffset === 0), add current time endpoint
      if (dateOffset === 0) {
        const now = new Date();
        const lastDataPoint = monthlyPoints[monthlyPoints.length - 1];

        const currentTimePoint: ChartDataPoint = {
          x: now.getTime(),
          y: lastDataPoint.y,
          label: "Current time",
          timestamp: now.toISOString(),
          originalLevel: lastDataPoint.y,
          isGenerated: true,
        };
        monthlyPoints.push(currentTimePoint);
      }
    }

    console.log("Monthly rolling averages:", monthlyPoints.length, "points");
    return monthlyPoints.sort((a, b) => a.x - b.x);
  }, [currentContext, filteredData]);

  // Chart scaling domains and ranges (memoized to prevent re-renders)
  // ✅ For daily context: use full 24-hour range to position data at actual times
  const xDomain = useMemo(() => {
    if (currentContext === "daily") {
      // Always use full day range for proper time positioning
      return [startTime, endTime]; // 00:00 to 23:59 of the selected day
    } else if (currentContext === "weekly") {
      // Always use full week range for proper day positioning
      return [startTime, endTime]; // Full week regardless of which days have data
    } else if (currentContext === "monthly") {
      // Always use full month range for proper day positioning
      return [startTime, endTime]; // Full month regardless of which days have data
    } else {
      // For project: use min/max of actual data
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

  // Generate full background line (left to right across entire chart)
  const fullBackgroundLine = useMemo(() => {
    if (processedData.length === 0) return null;

    // For background line, exclude current time endpoints to avoid the "turn around" effect
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );

    // Create extended data that spans full chart width
    const extendedData = [...backgroundData];

    // Add starting point at left edge - natural extension from first point
    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y, // Use first point's energy for natural lead-in
        isGenerated: true,
      });
    }

    // Add ending point at right edge - natural extension from last point
    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y, // Use last point's energy for natural lead-out
        isGenerated: true,
      });
    }

    return line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(extendedData);
  }, [processedData, xScale, yScale, xDomain]);

  // Generate filled area below the background line
  const backgroundFillPath = useMemo(() => {
    if (processedData.length === 0) return null;

    // For background line, exclude current time endpoints to avoid the "turn around" effect
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );

    // Create extended data that spans full chart width
    const extendedData = [...backgroundData];

    // Add starting point at left edge
    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y,
        isGenerated: true,
      });
    }

    // Add ending point at right edge
    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y,
        isGenerated: true,
      });
    }

    // Create the line path first
    const linePath = line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(extendedData);

    if (!linePath) return null;

    // Convert to fill by adding bottom edge points
    const fillPathString = `${linePath} L${xScale(
      xDomain[1]
    )},${chartHeight} L${xScale(xDomain[0])},${chartHeight} Z`;

    try {
      return Skia.Path.MakeFromSVGString(fillPathString);
    } catch (error) {
      console.warn("Failed to create background fill path:", error);
      return null;
    }
  }, [processedData, xScale, yScale, xDomain, chartHeight]);

  // Generate daylight filled area below the background line (daily context only)
  const daylightFillPath = useMemo(() => {
    if (
      currentContext !== "daily" ||
      processedData.length === 0 ||
      !getSunTimes?.sunrise ||
      !getSunTimes?.sunset
    ) {
      return null;
    }

    const sunriseTime = getSunTimes.sunrise.getTime();
    const sunsetTime = getSunTimes.sunset.getTime();

    // Calculate 7px buffer zones in time units
    const bufferTimeMs = (7 / chartWidth) * (xDomain[1] - xDomain[0]);
    const sunriseBufferEnd = sunriseTime + bufferTimeMs;
    const sunsetBufferStart = sunsetTime - bufferTimeMs;

    // Use the same background data processing
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );

    const extendedData = [...backgroundData];

    // Add starting point at left edge
    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y,
        isGenerated: true,
      });
    }

    // Add ending point at right edge
    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y,
        isGenerated: true,
      });
    }

    // Find or interpolate the energy level at sunrise and sunset times
    const findEnergyAtTime = (targetTime: number) => {
      // Find the closest points before and after the target time
      const beforePoint = extendedData.filter((p) => p.x <= targetTime).pop();
      const afterPoint = extendedData.find((p) => p.x >= targetTime);

      if (beforePoint && afterPoint && beforePoint.x !== afterPoint.x) {
        // Linear interpolation
        const ratio =
          (targetTime - beforePoint.x) / (afterPoint.x - beforePoint.x);
        return beforePoint.y + ratio * (afterPoint.y - beforePoint.y);
      } else if (beforePoint) {
        return beforePoint.y;
      } else if (afterPoint) {
        return afterPoint.y;
      }
      return 5; // Default middle energy level
    };

    // Create daylight data with 7px buffer zones
    const sunriseBufferY = findEnergyAtTime(sunriseBufferEnd);
    const sunsetBufferY = findEnergyAtTime(sunsetBufferStart);

    // Daylight area (shrunk by 7px buffer on each side)
    let daylightData = [
      {
        x: sunriseBufferEnd,
        y: sunriseBufferY,
        label: "sunrise buffer end",
        timestamp: "",
        originalLevel: sunriseBufferY,
      },
    ];

    // Add actual data points within daylight hours (excluding buffer zones)
    const innerPoints = extendedData.filter(
      (point) => point.x > sunriseBufferEnd && point.x < sunsetBufferStart
    );
    daylightData.push(...innerPoints);

    // Add sunset buffer boundary point
    daylightData.push({
      x: sunsetBufferStart,
      y: sunsetBufferY,
      label: "sunset buffer start",
      timestamp: "",
      originalLevel: sunsetBufferY,
    });

    if (daylightData.length < 2) {
      return null; // Need at least sunrise and sunset points
    }

    // Create the daylight line path
    const daylightLinePath = line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(daylightData);

    if (!daylightLinePath) return null;

    // Create the fill path: line path + bottom edge (shrunk daylight area)
    const fillPathString = `${daylightLinePath} L${xScale(
      sunsetBufferStart
    )},${chartHeight} L${xScale(sunriseBufferEnd)},${chartHeight} Z`;

    try {
      return Skia.Path.MakeFromSVGString(fillPathString);
    } catch (error) {
      console.warn("Failed to create daylight fill path:", error);
      return null;
    }
  }, [processedData, xScale, yScale, currentContext, getSunTimes, chartHeight]);

  // Generate sunrise buffer zone fill path (7px transition area)
  const sunriseBufferFillPath = useMemo(() => {
    if (
      currentContext !== "daily" ||
      processedData.length === 0 ||
      !getSunTimes?.sunrise
    ) {
      return null;
    }

    const sunriseTime = getSunTimes.sunrise.getTime();
    const bufferTimeMs = (7 / chartWidth) * (xDomain[1] - xDomain[0]);
    const sunriseBufferEnd = sunriseTime + bufferTimeMs;

    // Find energy levels at buffer boundaries using same helper as daylight
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );
    const extendedData = [...backgroundData];

    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y,
        isGenerated: true,
      });
    }

    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y,
        isGenerated: true,
      });
    }

    const findEnergyAtTime = (targetTime: number) => {
      const beforePoint = extendedData.filter((p) => p.x <= targetTime).pop();
      const afterPoint = extendedData.find((p) => p.x >= targetTime);

      if (beforePoint && afterPoint && beforePoint.x !== afterPoint.x) {
        const ratio =
          (targetTime - beforePoint.x) / (afterPoint.x - beforePoint.x);
        return beforePoint.y + ratio * (afterPoint.y - beforePoint.y);
      } else if (beforePoint) {
        return beforePoint.y;
      } else if (afterPoint) {
        return afterPoint.y;
      }
      return 5;
    };

    const sunriseY = findEnergyAtTime(sunriseTime);
    const sunriseBufferY = findEnergyAtTime(sunriseBufferEnd);

    // Create buffer zone data
    const bufferData = [
      { x: sunriseTime, y: sunriseY },
      { x: sunriseBufferEnd, y: sunriseBufferY },
    ];

    // Create the buffer line path
    const bufferLinePath = line<any>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(bufferData);

    if (!bufferLinePath) return null;

    // Create fill path for sunrise buffer
    const fillPathString = `${bufferLinePath} L${xScale(
      sunriseBufferEnd
    )},${chartHeight} L${xScale(sunriseTime)},${chartHeight} Z`;

    try {
      return Skia.Path.MakeFromSVGString(fillPathString);
    } catch (error) {
      console.warn("Failed to create sunrise buffer fill path:", error);
      return null;
    }
  }, [
    processedData,
    xScale,
    yScale,
    currentContext,
    getSunTimes,
    chartHeight,
    xDomain,
  ]);

  // Generate sunset buffer zone fill path (7px transition area)
  const sunsetBufferFillPath = useMemo(() => {
    if (
      currentContext !== "daily" ||
      processedData.length === 0 ||
      !getSunTimes?.sunset
    ) {
      return null;
    }

    const sunsetTime = getSunTimes.sunset.getTime();
    const bufferTimeMs = (7 / chartWidth) * (xDomain[1] - xDomain[0]);
    const sunsetBufferStart = sunsetTime - bufferTimeMs;

    // Find energy levels at buffer boundaries using same helper as daylight
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );
    const extendedData = [...backgroundData];

    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y,
        isGenerated: true,
      });
    }

    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y,
        isGenerated: true,
      });
    }

    const findEnergyAtTime = (targetTime: number) => {
      const beforePoint = extendedData.filter((p) => p.x <= targetTime).pop();
      const afterPoint = extendedData.find((p) => p.x >= targetTime);

      if (beforePoint && afterPoint && beforePoint.x !== afterPoint.x) {
        const ratio =
          (targetTime - beforePoint.x) / (afterPoint.x - beforePoint.x);
        return beforePoint.y + ratio * (afterPoint.y - beforePoint.y);
      } else if (beforePoint) {
        return beforePoint.y;
      } else if (afterPoint) {
        return afterPoint.y;
      }
      return 5;
    };

    const sunsetBufferY = findEnergyAtTime(sunsetBufferStart);
    const sunsetY = findEnergyAtTime(sunsetTime);

    // Create buffer zone data
    const bufferData = [
      { x: sunsetBufferStart, y: sunsetBufferY },
      { x: sunsetTime, y: sunsetY },
    ];

    // Create the buffer line path
    const bufferLinePath = line<any>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(bufferData);

    if (!bufferLinePath) return null;

    // Create fill path for sunset buffer
    const fillPathString = `${bufferLinePath} L${xScale(
      sunsetTime
    )},${chartHeight} L${xScale(sunsetBufferStart)},${chartHeight} Z`;

    try {
      return Skia.Path.MakeFromSVGString(fillPathString);
    } catch (error) {
      console.warn("Failed to create sunset buffer fill path:", error);
      return null;
    }
  }, [
    processedData,
    xScale,
    yScale,
    currentContext,
    getSunTimes,
    chartHeight,
    xDomain,
  ]);

  // Generate current time line (follows background path but stops at current time)
  const curvedLine = useMemo(() => {
    if (processedData.length === 0) return null;

    // Use IDENTICAL data processing as fullBackgroundLine
    const backgroundData = processedData.filter(
      (point) => !point.isGenerated || point.label !== "Current time"
    );

    // Create extended data EXACTLY like fullBackgroundLine
    const extendedData = [...backgroundData];

    // Add starting point at left edge - IDENTICAL to background line
    if (backgroundData.length > 0 && backgroundData[0].x > xDomain[0]) {
      extendedData.unshift({
        ...backgroundData[0],
        x: xDomain[0],
        y: backgroundData[0].y, // Use first point's energy for natural lead-in
        isGenerated: true,
      });
    }

    // Add ending point at right edge - IDENTICAL to background line
    if (
      backgroundData.length > 0 &&
      backgroundData[backgroundData.length - 1].x < xDomain[1]
    ) {
      extendedData.push({
        ...backgroundData[backgroundData.length - 1],
        x: xDomain[1],
        y: backgroundData[backgroundData.length - 1].y, // Use last point's energy for natural lead-out
        isGenerated: true,
      });
    }

    // For current periods (dateOffset === 0), create a truncated version at current time
    if (dateOffset === 0) {
      const now = new Date();

      // Generate the full path first, then interpolate at current time
      const fullLine = line<ChartDataPoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(curveCardinal.tension(0))(extendedData);

      if (!fullLine) return null;

      // Find the Y value at current time by interpolating the background curve
      const currentTimeX = xScale(now.getTime());

      // Filter points up to current time and add interpolated endpoint
      const dataUpToNow = extendedData.filter(
        (point) => point.x <= now.getTime()
      );

      // Add current time point with interpolated Y value from the background curve
      if (dataUpToNow.length > 0) {
        const lastPoint = dataUpToNow[dataUpToNow.length - 1];
        dataUpToNow.push({
          x: now.getTime(),
          y: lastPoint.y, // Use last known energy level
          label: "Current time endpoint",
          timestamp: now.toISOString(),
          originalLevel: lastPoint.y,
          isGenerated: true,
        });
      }

      return line<ChartDataPoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(curveCardinal.tension(0))(dataUpToNow);
    }

    // For past periods, use the full extended data (same as background)
    return line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveCardinal.tension(0))(extendedData);
  }, [processedData, xScale, yScale, dateOffset, xDomain]);

  // Convert background line to Skia path
  const backgroundLinePath = useMemo(() => {
    if (!fullBackgroundLine) return null;
    try {
      return Skia.Path.MakeFromSVGString(fullBackgroundLine);
    } catch (error) {
      console.warn(
        "Failed to create background Skia path from SVG string:",
        error
      );
      return null;
    }
  }, [fullBackgroundLine]);

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
      <Canvas
        style={{
          height: chartHeight,
          width: chartWidth,
          backgroundColor: "transparent",
        }}
      >
        {/* Filled background area below the energy line */}
        {backgroundFillPath && (
          <>
            {currentContext === "daily" ? (
              <>
                {/* Dark blue nighttime fill for daily */}
                <Path path={backgroundFillPath} style="fill" color="#65859A" />

                {/* Light blue daylight fill that follows the energy line */}
                {daylightFillPath && (
                  <Path path={daylightFillPath} style="fill" color="#92B1BE" />
                )}

                {/* Buffer zones - middle colors between night and day */}
                {sunriseBufferFillPath && (
                  <Path
                    path={sunriseBufferFillPath}
                    style="fill"
                    color="#7D9DB0"
                  />
                )}
                {sunsetBufferFillPath && (
                  <Path
                    path={sunsetBufferFillPath}
                    style="fill"
                    color="#7D9DB0"
                  />
                )}
              </>
            ) : (
              /* Solid fill for weekly and monthly */
              <Path
                path={backgroundFillPath}
                style="fill"
                color={
                  currentContext === "weekly"
                    ? "#7D9DB0" // Purple for weekly
                    : "#7D9DB0" // Brown for monthly
                }
              />
            )}
          </>
        )}

        {/* Background line - 10% opacity, spans full chart from left to right */}
        {backgroundLinePath && (
          <Path
            path={backgroundLinePath}
            style={"stroke"}
            strokeWidth={2}
            color={"rgba(255,255,255,0.1)"}
            strokeCap={"round"}
            start={0}
            end={1}
          />
        )}

        {/* Animated line - 100% opacity, fills from left to current time */}
        {linePath && (
          <Path
            path={linePath}
            style={"stroke"}
            strokeWidth={2}
            color={"white"}
            strokeCap={"round"}
            start={0}
            end={animationLine}
          >
            <Shadow dx={0} dy={1.5} blur={3} color={"rgba(0,0,0,0.1)"} />
            {/* <Shadow dx={0} dy={3} blur={3} color={"rgba(255,255,255,.6)"} /> */}
          </Path>
        )}

        {/* Current time indicator for all contexts */}
        {dateOffset === 0 &&
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
                />
              </Group>
            ) : null;
          })()}

        {/* Data point markers for all contexts (excluding generated points) - always show all dots */}
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
        {currentContext === "daily" &&
          // Daily: Show 25 hour notches (0-24) with labels: 3, 6, 9, 12, 3, 6, 9
          // Includes midnight at start (hour 0) and midnight at end (hour 24)
          Array.from({ length: 25 }, (_, i) => {
            const hour = i; // Hours 0-24 (0=start midnight, 24=end midnight)
            const isFirstNotch = hour === 0;
            const isLastNotch = hour === 24;

            return (
              <View
                key={hour}
                style={[
                  styles.notchItem,
                  isFirstNotch && { marginLeft: -chartWidth / 50 },
                  isLastNotch && { marginRight: -chartWidth / 50 },
                ]}
              >
                {!isFirstNotch && !isLastNotch && <View style={styles.notch} />}
                {(hour === 3 ||
                  hour === 6 ||
                  hour === 9 ||
                  hour === 12 ||
                  hour === 15 ||
                  hour === 18 ||
                  hour === 21) && (
                  <Text style={styles.notchNumber} numberOfLines={1}>
                    {hour === 12 ? 12 : hour > 12 ? hour - 12 : hour}
                  </Text>
                )}
              </View>
            );
          })}

        {currentContext === "weekly" &&
          (() => {
            // Calculate the start of the week
            const weekStart = new Date(startTime);
            const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
            const days = [];

            for (let i = 0; i < 7; i++) {
              const currentDay = new Date(weekStart);
              currentDay.setDate(weekStart.getDate() + i);
              const dayOfWeek = currentDay.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              days.push(
                <View key={i} style={styles.notchItem}>
                  <View
                    style={[styles.notch, isWeekend && styles.weekendNotch]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.notchNumber,
                      isWeekend && styles.weekendLabel,
                    ]}
                  >
                    {dayLabels[dayOfWeek]}
                  </Text>
                </View>
              );
            }
            return days;
          })()}

        {currentContext === "monthly" &&
          (() => {
            // Monthly: Show notch for every day + 2 edge notches, label every 3rd day (skip first/last)
            const monthStart = new Date(startTime);
            const monthEnd = new Date(endTime);
            const totalDays = Math.ceil(
              (monthEnd.getTime() - monthStart.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const totalNotches = totalDays + 2; // Add 2 edge notches
            const edgeMargin = -chartWidth / (totalNotches * 2);
            const notches = [];

            for (let dayNum = 0; dayNum <= totalDays + 1; dayNum++) {
              const isFirstNotch = dayNum === 0;
              const isLastNotch = dayNum === totalDays + 1;
              const isEdgeNotch = isFirstNotch || isLastNotch;

              // For labeling, only consider actual days (1 to totalDays)
              const actualDay = dayNum;
              const currentDate = new Date(monthStart);
              currentDate.setDate(monthStart.getDate() + dayNum - 1);

              notches.push(
                <View
                  key={dayNum}
                  style={[
                    styles.notchItem,
                    isFirstNotch && { marginLeft: edgeMargin },
                    isLastNotch && { marginRight: edgeMargin },
                  ]}
                >
                  {!isEdgeNotch && <View style={styles.notch} />}
                  {!isEdgeNotch &&
                    actualDay % 3 === 1 && ( // Label every 3rd day, skip edge notches
                      <Text style={styles.notchNumber} numberOfLines={1}>
                        {currentDate.getDate()}
                      </Text>
                    )}
                </View>
              );
            }
            return notches;
          })()}
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
            timeText = localDate
              .toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase()
              .replace(" ", "");
          } else if (currentContext === "weekly") {
            // Show just the day for weekly context (average per day)
            timeText = localDate.toLocaleDateString([], {
              weekday: "short",
            });
          } else if (currentContext === "monthly") {
            // Show date for monthly context (3-day avg): "Aug 31"
            timeText = localDate.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
          } else {
            // Project context: show full date and time
            timeText = localDate
              .toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase()
              .replace(" ", "");
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
                top: y - 29,
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  textAlign: "center",
                  lineHeight: 9,
                  marginTop: 1,
                }}
                weight="medium"
                color={"rgba(255,255,255,.4)"}
              >
                {timeText}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 15,
                  marginTop: 0,
                }}
                weight="medium"
                color={"rgba(255,255,255,1)"}
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
  notchWrapper: {
    display: "flex",
    flexDirection: "row",
    overflow: "visible",
  },
  notchItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    flex: 1,
    overflow: "visible",
  },
  notch: {
    height: 3,
    width: 0.5,
    backgroundColor: "rgba(255,255,255,.3)",
    overflow: "visible",
  },
  notchNumber: {
    color: "rgba(255,255,255,.4)",
    overflow: "visible",
    minWidth: 24,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 11,
  },
  weekendNotch: {
    backgroundColor: "rgba(255,255,255,.1)",
    overflow: "visible",
  },
  weekendLabel: {
    color: "rgba(255,255,255,.25)",
    overflow: "visible",
  },
});
