export interface EnergyDataPoint {
  date: Date;
  value: number;
}

export interface EnergyChartData {
  points: EnergyDataPoint[];
  loading: boolean;
  error: string | null;
}

export interface LocationInfo {
  sunrise: Date | undefined;
  sunset: Date | undefined;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface TideChartData {
  points: EnergyDataPoint[];
  location?: LocationInfo;
  loading: boolean;
  error: string | null;
}

// Energy level conversion utility
export const energyLevelToNumber = (level: any): number => {
  if (typeof level === 'number') return Math.max(1, Math.min(10, level));
  if (typeof level === 'string') {
    const parsed = parseInt(level, 10);
    return isNaN(parsed) ? 5 : Math.max(1, Math.min(10, parsed));
  }
  return 5; // default
};