/**
 * Sample energy level data for Tides Mobile App
 * Matches Cloudflare database format and mobile upload structure
 *
 * Energy levels can be:
 * - String descriptors: 'low', 'medium', 'high', 'completed'
 * - Numeric values: 1-10 scale
 * - Mixed format as used throughout the app
 */

export interface EnergyDataPoint {
  id: string;
  tide_id: string;
  energy_level: string | number;
  context?: string;
  timestamp: string;
  timezone: string;
}

export interface TideEnergyProgress {
  tide_id: string;
  tide_title: string;
  energy_readings: EnergyDataPoint[];
  average_energy: number;
  trend: "increasing" | "decreasing" | "stable";
}

// Sample energy data points matching the tide_add_energy format
export const sampleEnergyData: EnergyDataPoint[] = [
  {
    id: "energy_001",
    tide_id: "daily_2025_08_30",
    energy_level: "high",
    context: "Morning coffee kicked in, feeling very focused",
    timestamp: "2025-08-30T09:15:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_002",
    tide_id: "daily_2025_08_30",
    energy_level: 8,
    context: "Mid-morning energy still strong",
    timestamp: "2025-08-30T10:30:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_003",
    tide_id: "daily_2025_08_30",
    energy_level: "medium",
    context: "Post-lunch dip, struggling with concentration",
    timestamp: "2025-08-30T13:45:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_004",
    tide_id: "daily_2025_08_30",
    energy_level: 6,
    context: "Afternoon recovery, second wind",
    timestamp: "2025-08-30T15:20:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_005",
    tide_id: "weekly_2025_w35",
    energy_level: "high",
    context: "Monday morning motivation",
    timestamp: "2025-08-25T08:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_006",
    tide_id: "weekly_2025_w35",
    energy_level: 7,
    context: "Wednesday productivity peak",
    timestamp: "2025-08-27T14:30:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_007",
    tide_id: "weekly_2025_w35",
    energy_level: "low",
    context: "Friday afternoon energy crash",
    timestamp: "2025-08-29T16:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_008",
    tide_id: "project_mobile_refactor",
    energy_level: "high",
    context: "Excited about new architecture improvements",
    timestamp: "2025-08-30T11:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_009",
    tide_id: "project_mobile_refactor",
    energy_level: 9,
    context: "Deep flow state during component refactoring",
    timestamp: "2025-08-30T14:15:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_010",
    tide_id: "project_mobile_refactor",
    energy_level: "completed",
    context: "Successfully completed EnergyChart component fix",
    timestamp: "2025-08-30T16:30:00.000Z",
    timezone: "America/Los_Angeles",
  },
  // August 31st data points
  {
    id: "energy_011",
    tide_id: "daily_2025_08_31",
    energy_level: "medium",
    context: "Early morning start, coffee brewing",
    timestamp: "2025-08-31T11:00:00.000Z", // 7:00 AM EDT = 11:00 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_012",
    tide_id: "daily_2025_08_31",
    energy_level: 8,
    context: "Morning momentum building, tackling chart animations",
    timestamp: "2025-08-31T13:30:00.000Z", // 9:30 AM EDT = 13:30 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_013",
    tide_id: "daily_2025_08_31",
    energy_level: "high",
    context: "Flow state achieved working on line chart tutorial",
    timestamp: "2025-08-31T15:15:00.000Z", // 11:15 AM EDT = 15:15 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_014",
    tide_id: "daily_2025_08_31",
    energy_level: 7,
    context: "Post-lunch focus, debugging animation issues",
    timestamp: "2025-08-31T18:00:00.000Z", // 2:00 PM EDT = 18:00 UTC
    timezone: "America/Los_Angeles",
  },

];

// Sample tide progress data for dashboard/chart display
export const sampleTideProgress: TideEnergyProgress[] = [
  {
    tide_id: "daily_2025_08_30",
    tide_title: "Daily Focus - Aug 30",
    energy_readings: sampleEnergyData.filter(
      (e) => e.tide_id === "daily_2025_08_30"
    ),
    average_energy: 7.25,
    trend: "decreasing",
  },
  {
    tide_id: "weekly_2025_w35",
    tide_title: "Week 35 - Aug 25-31",
    energy_readings: sampleEnergyData.filter(
      (e) => e.tide_id === "weekly_2025_w35"
    ),
    average_energy: 6.67,
    trend: "stable",
  },
  {
    tide_id: "project_mobile_refactor",
    tide_title: "Mobile App Refactoring",
    energy_readings: sampleEnergyData.filter(
      (e) => e.tide_id === "project_mobile_refactor"
    ),
    average_energy: 8.67,
    trend: "increasing",
  },
  {
    tide_id: "daily_2025_08_31",
    tide_title: "Daily Focus - Aug 31",
    energy_readings: sampleEnergyData.filter(
      (e) => e.tide_id === "daily_2025_08_31"
    ),
    average_energy: 7.83,
    trend: "increasing",
  },
];

// Energy level conversion utilities (matches mobile app logic)
export const energyLevelToNumber = (level: string | number): number => {
  if (typeof level === "number") return Math.max(1, Math.min(10, level));
  if (typeof level === "string") {
    switch (level.toLowerCase()) {
      case "low":
        return 3;
      case "medium":
        return 6;
      case "high":
        return 9;
      case "completed":
        return 10;
      default: {
        const parsed = parseInt(level, 10);
        return isNaN(parsed) ? 6 : Math.max(1, Math.min(10, parsed));
      }
    }
  }
  return 6; // Default medium
};

export const numberToEnergyLevel = (num: number): string => {
  if (num <= 3) return "low";
  if (num <= 6) return "medium";
  if (num <= 9) return "high";
  return "completed";
};

// Chart-ready data transformation
export const getChartData = (tideId?: string) => {
  const filteredData = tideId
    ? sampleEnergyData.filter((d) => d.tide_id === tideId)
    : sampleEnergyData;

  return filteredData.map((point) => ({
    x: new Date(point.timestamp).getTime(),
    y: energyLevelToNumber(point.energy_level),
    label: point.context || "",
    timestamp: point.timestamp,
    originalLevel: point.energy_level,
  }));
};

// Export for EnergyChart component
export default {
  sampleEnergyData,
  sampleTideProgress,
  getChartData,
  energyLevelToNumber,
  numberToEnergyLevel,
};
