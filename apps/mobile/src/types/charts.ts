// Chart-related types for energy visualization

export interface EnergyDataPoint {
  value: number; // energy level (1-10)
  date: Date; // timestamp as Date object
}

export interface EnergyChartData {
  points: EnergyDataPoint[];
  loading: boolean;
  error: string | null;
}

export interface ChartRange {
  x: {
    min: Date;
    max: Date;
  };
  y: {
    min: number;
    max: number;
  };
}

// Transform energy levels to numeric values
export const energyLevelToNumber = (level: string | number): number => {
  if (typeof level === 'number') return Math.max(1, Math.min(10, level));
  
  switch (level) {
    case 'low': return 3;
    case 'medium': return 6;
    case 'high': return 9;
    case 'completed': return 10;
    default: return 5;
  }
};