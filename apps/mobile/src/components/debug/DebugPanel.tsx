import React from "react";
import { 
  View, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Platform 
} from "react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { spacing } from "../../design-system/tokens";

interface DebugPanelProps {
  showDebugPanel: boolean;
  debugTestResults: string[];
  setShowDebugPanel: (show: boolean) => void;
  setDebugTestResults: (results: string[]) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  showDebugPanel,
  debugTestResults,
  setShowDebugPanel,
  setDebugTestResults,
}) => {
  const handleClose = () => {
    setShowDebugPanel(false);
    setDebugTestResults([]);
  };

  const getResultColor = (result: string) => {
    if (result.includes("✗")) return "error";
    if (result.includes("===")) return "primary";
    return "secondary";
  };

  if (!showDebugPanel) {
    return null;
  }

  return (
    <Card style={styles.debugPanel}>
      <View style={styles.debugPanelHeader}>
        <Text variant="h4" color="primary">
          Debug Test Results
        </Text>
        <TouchableOpacity onPress={handleClose}>
          <Text variant="body" color="secondary">
            Close
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.debugScrollView}>
        {debugTestResults.map((result, index) => (
          <Text
            key={index}
            variant="bodySmall"
            color={getResultColor(result)}
            style={styles.debugResultText}
          >
            {result}
          </Text>
        ))}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  debugPanel: {
    margin: spacing[3],
    padding: spacing[4],
  },
  debugPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  debugScrollView: {
    maxHeight: 300,
  },
  debugResultText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 2,
  },
});