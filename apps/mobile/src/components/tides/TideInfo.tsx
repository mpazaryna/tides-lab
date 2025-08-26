import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, Edit2 } from "lucide-react-native";
import { colors, spacing } from "../../design-system/tokens";
import { useDailyTide } from "../../hooks/useDailyTide";
import { useLocationData } from "../../hooks/useLocationData";
import Loading from "../Loading";
import { Text } from "../Text";
import { EnergyChart } from "../charts/EnergyChart";

// const formatTime = (date: Date): string => {
//   return date.toLocaleTimeString("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// const getTimeIcon = (timeOfDay: LocationInfo["timeOfDay"]) => {
//   const iconColor = colors.neutral[600];
//   const size = 16;

//   switch (timeOfDay) {
//     case "morning":
//       return <Sunrise color={iconColor} size={size} />;
//     case "afternoon":
//       return <Sun color={iconColor} size={size} />;
//     case "evening":
//       return <Sunset color={iconColor} size={size} />;
//     case "night":
//       return <Moon color={iconColor} size={size} />;
//     default:
//       return <Sun color={iconColor} size={size} />;
//   }
// };

// const getGreeting = (timeOfDay: LocationInfo["timeOfDay"]): string => {
//   switch (timeOfDay) {
//     case "morning":
//       return "Good morning";
//     case "afternoon":
//       return "Good afternoon";
//     case "evening":
//       return "Good evening";
//     case "night":
//       return "Good evening";
//     default:
//       return "Hello";
//   }
// };

export const TideInfo: React.FC = React.memo(() => {
  const { dailyTide, loading, wasCreatedToday, error } = useDailyTide();
  const { locationInfo } = useLocationData();

  // Debug information
  const currentTime = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = currentTime.toLocaleString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const localDate = currentTime.toLocaleDateString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Format sunrise and sunset times
  const formatTime = (date: Date | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loading size="small" />
          <Text
            variant="bodySmall"
            color="secondary"
            style={styles.loadingText}
          >
            Setting up your daily tide...
          </Text>
        </View>
      </View>
    );
  }

  // if (error || !locationInfo) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.row}>
  //         <Sun color={colors.neutral[600]} size={16} />
  //         <Text variant="body" color="primary" style={styles.greeting}>
  //           Hello
  //         </Text>
  //       </View>
  //       <Text variant="bodySmall" color="secondary">
  //         {error || "Location unavailable"}
  //       </Text>
  //     </View>
  //   );
  // }

  // const greeting = getGreeting(locationInfo.timeOfDay);
  // const timeIcon = getTimeIcon(locationInfo.timeOfDay);

  return (
    <View style={styles.container}>
      {/* Debug Information Section */}
      <View style={styles.debugSection}>
        <Text variant="bodySmall" color="secondary">
          Debug Info:
        </Text>
        <Text variant="bodySmall" color="secondary">
          • Timezone: {timezone}
        </Text>
        <Text variant="bodySmall" color="secondary">
          • Local Time: {localTime}
        </Text>
        <Text variant="bodySmall" color="secondary">
          • Local Date: {localDate}
        </Text>
        {locationInfo && (
          <>
            <Text variant="bodySmall" color="secondary">
              • Location: {locationInfo.city || "Unknown"},{" "}
              {locationInfo.region || "Unknown"}
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Sunrise: {formatTime(locationInfo.sunrise)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Sunset: {formatTime(locationInfo.sunset)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Time of Day: {locationInfo.timeOfDay}
            </Text>
          </>
        )}
        {dailyTide && (
          <>
            <Text variant="bodySmall" color="secondary">
              • Tide ID: {dailyTide.id?.substring(0, 20)}...
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Tide Name: {dailyTide.name}
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Created Today: {wasCreatedToday ? "Yes" : "No"}
            </Text>
            <Text variant="bodySmall" color="secondary">
              • Status: {dailyTide.status}
            </Text>
          </>
        )}
        {error && (
          <Text variant="bodySmall" color="error">
            • Error: {error}
          </Text>
        )}
      </View>

      {/* Daily Tide Header */}
      {dailyTide && (
        <View style={styles.dailyTideSection}>
          <View style={styles.dailyTideHeader}>
            <View style={styles.dailyTideLeft}>
              <Calendar color={colors.neutral[600]} size={16} />
              <Text
                variant="body"
                color="primary"
                style={styles.dailyTideTitle}
              >
                {dailyTide.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit2 color={colors.neutral[500]} size={14} />
            </TouchableOpacity>
          </View>
          {wasCreatedToday && (
            <Text
              variant="bodySmall"
              color="secondary"
              style={styles.newTideNote}
            >
              Today's tide is ready • Tap edit to rename
            </Text>
          )}
        </View>
      )}

      <View style={styles.mainRow}>
        <View style={styles.greetingSection}>
          {/* Placeholder for future greeting content */}
        </View>
      </View>

      <View style={styles.sunTimesRow}>
        {/* <View style={styles.sunTimeItem}>
          <Sunrise color={colors.neutral[500]} size={12} />
          <Text
            variant="bodySmall"
            color="secondary"
            style={styles.sunTimeText}
          >
            {formatTime(locationInfo.sunrise)}
          </Text>
        </View>

        <View style={styles.sunTimeItem}>
          <Sunset color={colors.neutral[500]} size={12} />
          <Text
            variant="bodySmall"
            color="secondary"
            style={styles.sunTimeText}
          >
            {formatTime(locationInfo.sunset)}
          </Text>
        </View> */}

        {/* {locationInfo.timeUntilSunset && (
          <Text variant="bodySmall" color="secondary" style={styles.timeUntil}>
            {locationInfo.timeUntilSunset} until sunset
          </Text>
        )} */}

        {/* {locationInfo.timeUntilSunrise && (
          <Text variant="bodySmall" color="secondary" style={styles.timeUntil}>
            {locationInfo.timeUntilSunrise} until sunrise
          </Text>
        )} */}
      </View>

      {/* Energy Chart Section */}
      <View style={styles.energySection}>
        <EnergyChart height={120} />
      </View>
    </View>
  );
});

TideInfo.displayName = "TideInfo";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  debugSection: {
    backgroundColor: colors.neutral[50],
    padding: spacing[2],
    marginBottom: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  dailyTideSection: {
    marginBottom: spacing[3],
  },
  dailyTideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dailyTideLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dailyTideTitle: {
    marginLeft: spacing[2],
    fontWeight: "600",
    fontSize: 16,
  },
  editButton: {
    padding: spacing[1],
  },
  newTideNote: {
    marginTop: spacing[1],
    marginLeft: spacing[6], // Align with title (icon width + margin)
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: spacing[2],
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingSection: {
    flex: 1,
  },
  timeSection: {
    alignItems: "flex-end",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    marginLeft: spacing[2],
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[1],
  },
  locationText: {
    marginLeft: spacing[1],
  },
  currentTime: {
    fontWeight: "600",
    fontSize: 16,
  },
  sunTimesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[2],
    flexWrap: "wrap",
  },
  sunTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing[4],
  },
  sunTimeText: {
    marginLeft: spacing[1],
  },
  timeUntil: {
    fontStyle: "italic",
    marginLeft: spacing[2],
  },
  energySection: {},
});
