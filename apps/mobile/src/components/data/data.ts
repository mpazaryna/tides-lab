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
    tide_id: "weekly_2025_w36",
    energy_level: "high",
    context: "Monday morning motivation",
    timestamp: "2025-09-01T08:00:00.000Z", // Monday Sept 1
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_006",
    tide_id: "weekly_2025_w36",
    energy_level: 7,
    context: "Wednesday productivity peak",
    timestamp: "2025-09-03T14:30:00.000Z", // Wednesday Sept 3
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_007",
    tide_id: "weekly_2025_w36",
    energy_level: "low",
    context: "Friday afternoon energy crash",
    timestamp: "2025-09-05T16:00:00.000Z", // Friday Sept 5
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
  // August data points spread throughout the month
  {
    id: "energy_011",
    tide_id: "daily_2025_08_05",
    energy_level: 7,
    context: "Strong Monday start",
    timestamp: "2025-08-05T13:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_012",
    tide_id: "daily_2025_08_08",
    energy_level: "high",
    context: "Peak energy Thursday",
    timestamp: "2025-08-08T15:30:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_013",
    tide_id: "daily_2025_08_12",
    energy_level: 5,
    context: "Monday blues",
    timestamp: "2025-08-12T14:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_014",
    tide_id: "daily_2025_08_15",
    energy_level: 8,
    context: "Mid-month productivity",
    timestamp: "2025-08-15T16:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_015",
    tide_id: "daily_2025_08_18",
    energy_level: "medium",
    context: "Weekend prep energy",
    timestamp: "2025-08-18T12:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_016",
    tide_id: "daily_2025_08_22",
    energy_level: 9,
    context: "Thursday high performance",
    timestamp: "2025-08-22T14:30:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_017",
    tide_id: "daily_2025_08_25",
    energy_level: "low",
    context: "Sunday recovery",
    timestamp: "2025-08-25T17:00:00.000Z",
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_018",
    tide_id: "daily_2025_08_28",
    energy_level: 6,
    context: "Wednesday steady pace",
    timestamp: "2025-08-28T13:15:00.000Z",
    timezone: "America/Los_Angeles",
  },
  // August 30-31st data points
  {
    id: "energy_019",
    tide_id: "daily_2025_08_30",
    energy_level: "high",
    context: "Morning coffee kicked in, feeling very focused",
    timestamp: "2025-08-30T13:15:00.000Z", // 9:15 AM EDT = 13:15 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_020",
    tide_id: "daily_2025_08_30",
    energy_level: 8,
    context: "Mid-morning energy still strong",
    timestamp: "2025-08-30T14:30:00.000Z", // 10:30 AM EDT = 14:30 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_021",
    tide_id: "daily_2025_08_30",
    energy_level: "medium",
    context: "Post-lunch dip, struggling with concentration",
    timestamp: "2025-08-30T17:45:00.000Z", // 1:45 PM EDT = 17:45 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_022",
    tide_id: "daily_2025_08_30",
    energy_level: 6,
    context: "Afternoon recovery, second wind",
    timestamp: "2025-08-30T19:20:00.000Z", // 3:20 PM EDT = 19:20 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_023",
    tide_id: "daily_2025_08_31",
    energy_level: "medium",
    context: "Early morning start, coffee brewing",
    timestamp: "2025-08-31T11:00:00.000Z", // 7:00 AM EDT = 11:00 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_024",
    tide_id: "daily_2025_08_31",
    energy_level: 8,
    context: "Morning momentum building, tackling chart animations",
    timestamp: "2025-08-31T13:30:00.000Z", // 9:30 AM EDT = 13:30 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_025",
    tide_id: "daily_2025_08_31",
    energy_level: "high",
    context: "Flow state achieved working on line chart tutorial",
    timestamp: "2025-08-31T15:15:00.000Z", // 11:15 AM EDT = 15:15 UTC
    timezone: "America/Los_Angeles",
  },
  {
    id: "energy_026",
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
