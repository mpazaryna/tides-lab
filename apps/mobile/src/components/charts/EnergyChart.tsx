import React from "react";
import { View, StyleSheet } from "react-native";
import { LineGraph } from "react-native-graph";
import { colors, spacing } from "../../design-system/tokens";
import { Text } from "../Text";
import { useEnergyData } from "../../hooks/useEnergyData";
import { useLocationData } from "../../hooks/useLocationData";

interface EnergyChartProps {
  tideId?: string;
  height?: number;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({
  tideId,
  height = 250,
}) => {
  const { points, error } = useEnergyData(tideId);
  const { locationInfo } = useLocationData();
  const yValues = points.map((p: any) => p.value);
  const minY = Math.max(1, Math.min(...yValues) - 1);
  const maxY = Math.min(10, Math.max(...yValues) + 1);




  // Get energy check positions from points data
  const getEnergyCheckPositions = () => {
    return points.map((point: any) => {
      const pointTime = new Date(point.x);
      const hour = pointTime.getHours() + pointTime.getMinutes() / 60;
      return (hour / 24) * 100; // Convert to percentage
    });
  };

  return (
   
  );
};

const styles = StyleSheet.create({
  
});
