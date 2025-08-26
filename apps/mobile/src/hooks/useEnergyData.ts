import { useState, useEffect, useCallback } from "react";
import { useMCP } from "../context/MCPContext";
import {
  EnergyChartData,
  EnergyDataPoint,
  energyLevelToNumber,
} from "../types/charts";
import { loggingService } from "../services/loggingService";

export const useEnergyData = (tideId?: string) => {
  const [chartData, setChartData] = useState<EnergyChartData>({
    points: [],
    loading: false,
    error: null,
  });

  const { getTideReport, isConnected } = useMCP();

  const fetchEnergyData = useCallback(async () => {
    if (!isConnected) {
      setChartData((prev) => ({
        ...prev,
        error: "Not connected to MCP server",
      }));
      return;
    }

    setChartData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get tide report which includes energy progression
      const reportResult = await getTideReport(tideId || "", "json");

      if (reportResult.success && reportResult.report) {
        const report = reportResult.report;

        // Convert energy progression to chart points
        const points: EnergyDataPoint[] = [];

        if (
          report.energy_progression &&
          Array.isArray(report.energy_progression)
        ) {
          report.energy_progression.forEach(
            (energyLevel: any, index: number) => {
              // Create timestamp for each point (spread over recent time)
              const now = Date.now();
              const timeOffset =
                (report.energy_progression.length - 1 - index) *
                2 *
                60 *
                60 *
                1000; // 2 hours apart
              const timestamp = now - timeOffset;

              points.push({
                date: new Date(timestamp),
                value: energyLevelToNumber(energyLevel),
              });
            }
          );
        }

        // If no energy progression in report, use sample data for demonstration
        if (points.length === 0) {
          // Use sample data for demonstration
          const samplePoints: EnergyDataPoint[] = [
            { date: new Date(Date.now() - 6 * 60 * 60 * 1000), value: 7 }, // 6 hours ago
            { date: new Date(Date.now() - 4 * 60 * 60 * 1000), value: 8 }, // 4 hours ago
            { date: new Date(Date.now() - 2 * 60 * 60 * 1000), value: 6 }, // 2 hours ago
            { date: new Date(Date.now() - 1 * 60 * 60 * 1000), value: 9 }, // 1 hour ago
            { date: new Date(), value: 8 }, // now
          ];
          points.push(...samplePoints);
        }

        setChartData({
          points: points.sort((a, b) => a.date.getTime() - b.date.getTime()), // Sort by timestamp
          loading: false,
          error: null,
        });
      } else {
        throw new Error("Failed to fetch energy data");
      }
    } catch (error) {
      loggingService.error("EnergyData", "Error fetching energy data", {
        error,
      });
      setChartData({
        points: [],
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [getTideReport, isConnected, tideId]);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchEnergyData();
  }, [fetchEnergyData]);

  return {
    ...chartData,
    refetch: fetchEnergyData,
  };
};
