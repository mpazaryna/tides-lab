import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  ChartLine,
  Sun,
  Waves,
  Moon,
  Lock,
} from "lucide-react-native";
import { colors } from "../design-system/tokens";
import { useTimeContext, TimeContextType } from "../context/TimeContext";
import { Text } from "./Text";

interface ContextToggleProps {
  showLabels?: boolean;
  variant?: "compact" | "full";
}

export const ContextToggle: React.FC<ContextToggleProps> = ({ 
  showLabels = false, 
  variant = "compact" 
}) => {
  const {
    currentContext,
    setCurrentContext,
    isAtPresent,
    resetToPresent,
    contextSwitchingDisabled,
  } = useTimeContext();
  const [showTooltip, setShowTooltip] = useState(false);

  const contextOptions: {
    label: string;
    value: TimeContextType;
    icon: any;
    disabled?: boolean;
  }[] = [
    { label: "Daily", value: "daily", icon: Sun },
    { label: "Weekly", value: "weekly", icon: Waves },
    { label: "Monthly", value: "monthly", icon: Moon },
    { label: "Project", value: "project", icon: ChartLine, disabled: true },
  ];

  const handleTogglePress = () => {
    if (contextSwitchingDisabled) return;
    setShowTooltip(!showTooltip);
  };

  const handleContextSelect = async (value: TimeContextType) => {
    if (contextSwitchingDisabled) return;

    if (currentContext === value && !isAtPresent) {
      resetToPresent();
    } else {
      await setCurrentContext(value);
    }
    setShowTooltip(false);
  };

  if (variant === "full") {
    // Segmented control layout for energy chart
    const activeOptions = contextOptions.filter(option => !option.disabled);
    
    return (
      <View style={{
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 2,
        opacity: contextSwitchingDisabled ? 0.6 : 1.0,
      }}>
        {activeOptions.map((option) => {
          const isSelected = currentContext === option.value;
          const isDisabled = contextSwitchingDisabled || option.disabled;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleContextSelect(option.value)}
              disabled={isDisabled}
              style={{
                flex: 1,
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: isSelected
                  ? "rgba(255,255,255,0.25)"
                  : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? "600" : "400",
                  color: isSelected 
                    ? "rgba(255,255,255,1.0)"
                    : "rgba(255,255,255,0.6)",
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Compact modal variant (original design)
  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        onPress={handleTogglePress}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.1)",
          opacity: contextSwitchingDisabled ? 0.6 : 1.0,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
        disabled={contextSwitchingDisabled}
      >
        {(() => {
          const currentOption = contextOptions.find(option => option.value === currentContext);
          const IconComponent = currentOption?.icon || Sun;
          return (
            <>
              <IconComponent
                size={16}
                color="rgba(255,255,255,0.8)"
                strokeWidth={2}
              />
              {showLabels && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {currentOption?.label}
                </Text>
              )}
            </>
          );
        })()}
      </TouchableOpacity>

      <Modal visible={showTooltip} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowTooltip(false)}>
          <View style={{ 
            flex: 1, 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)" 
          }}>
            <View
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 16,
                paddingVertical: 8,
                paddingHorizontal: 8,
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 0.5,
                borderColor: colors.neutral[200],
                gap: 8,
                width: 296,
              }}
            >
              {contextOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = currentContext === option.value;
                const isDisabled = contextSwitchingDisabled || option.disabled;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleContextSelect(option.value)}
                    disabled={isDisabled}
                    style={{
                      paddingVertical: 10,
                      paddingBottom: 7.5,
                      borderRadius: 8,
                      backgroundColor: isSelected
                        ? colors.primary[100]
                        : "transparent",
                      alignItems: "center",
                      width: 64,
                      opacity: isDisabled ? 0.7 : 1.0,
                    }}
                  >
                    <IconComponent
                      size={20}
                      color={
                        isDisabled
                          ? colors.neutral[300]
                          : isSelected
                          ? colors.text.primary
                          : colors.text.tertiary
                      }
                      strokeWidth={2}
                      style={{ marginBottom: 2.5 }}
                    />
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {option.disabled && (
                        <Lock
                          size={8}
                          color={colors.neutral[400]}
                          strokeWidth={2}
                          style={{ marginRight: 2 }}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? "500" : "400",
                          color: isDisabled
                            ? colors.neutral[300]
                            : isSelected
                            ? colors.text.primary
                            : colors.text.tertiary,
                          textAlign: "center",
                        }}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};