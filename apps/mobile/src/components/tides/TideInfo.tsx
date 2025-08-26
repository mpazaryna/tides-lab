import React, { useRef, useState, useCallback } from "react";
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  Dimensions,
  Haptics,
  TouchableWithoutFeedback 
} from "react-native";
import { colors, spacing } from "../../design-system/tokens";
import { useDailyTide } from "../../hooks/useDailyTide";
import { useLocationData } from "../../hooks/useLocationData";
import { useTimeContext } from "../../context/TimeContext";
import { getContextDateRange, getContextDateRangeWithOffset } from "../../utils/contextUtils";
import Loading from "../Loading";
import { Text } from "../Text";

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const TAP_THRESHOLD = 10; // Maximum movement for tap

interface TideInfoProps {
  onPress?: () => void;
}

export const TideInfo: React.FC<TideInfoProps> = React.memo(({ onPress }) => {
  const { dailyTide, loading, wasCreatedToday } = useDailyTide();
  const { locationInfo } = useLocationData();
  const { 
    currentContext, 
    dateOffset,
    navigateBackward, 
    navigateForward, 
    isAtPresent 
  } = useTimeContext();

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [previewOffset, setPreviewOffset] = useState<number | null>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    try {
      if (Haptics && Haptics.selectionAsync) {
        Haptics.selectionAsync();
      }
    } catch (error) {
      // Haptics might not be available on all devices
    }
  }, []);

  // Reset animations
  const resetAnimations = useCallback(() => {
    Animated.parallel([
      Animated.spring(pan, { 
        toValue: { x: 0, y: 0 }, 
        useNativeDriver: false 
      }),
      Animated.spring(opacity, { 
        toValue: 1, 
        useNativeDriver: false 
      })
    ]).start();
    setPreviewOffset(null);
  }, [pan, opacity]);

  // Handle navigation
  const handleNavigation = useCallback((direction: 'forward' | 'backward') => {
    if (currentContext === 'project') return; // No time navigation for project context
    
    triggerHaptic();
    
    if (direction === 'backward') {
      navigateBackward();
    } else {
      navigateForward();
    }
    
    resetAnimations();
    setIsGestureActive(false);
  }, [currentContext, navigateBackward, navigateForward, resetAnimations, triggerHaptic]);

  // Create PanResponder - simplified for testing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log("onStartShouldSetPanResponder called");
        return true;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        console.log("onMoveShouldSetPanResponder called", gestureState);
        return true; // Always try to set responder for testing
      },
      onPanResponderGrant: (evt, gestureState) => {
        console.log("PanResponder GRANTED!", evt.nativeEvent, gestureState);
        setIsGestureActive(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        console.log("PanResponder MOVE", gestureState.dx, gestureState.dy);
        
        // Only allow horizontal movement for navigation contexts
        if (currentContext === 'project') return;
        
        const { dx } = gestureState;
        
        // Calculate preview offset based on gesture
        if (Math.abs(dx) > SWIPE_THRESHOLD / 2) {
          const direction = dx > 0 ? 'forward' : 'backward';
          const newPreviewOffset = direction === 'backward' ? dateOffset + 1 : Math.max(0, dateOffset - 1);
          
          if (newPreviewOffset !== previewOffset) {
            setPreviewOffset(newPreviewOffset);
            try {
              if (Haptics && Haptics.impactAsync) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch (error) {
              // Ignore haptic errors
            }
          }
        } else {
          setPreviewOffset(null);
        }

        // Update animations
        pan.setValue({ x: dx, y: 0 });
        const opacityValue = Math.max(0.7, 1 - Math.abs(dx) / screenWidth);
        opacity.setValue(opacityValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        const { dx, dy } = gestureState;
        const totalMovement = Math.sqrt(dx * dx + dy * dy);
        
        // If minimal movement, treat as tap
        if (totalMovement < TAP_THRESHOLD) {
          onPress?.();
          resetAnimations();
          setIsGestureActive(false);
          return;
        }
        
        // Determine if swipe threshold was met
        if (Math.abs(dx) > SWIPE_THRESHOLD && currentContext !== 'project') {
          const direction = dx > 0 ? 'forward' : 'backward';
          
          // Prevent going to future dates
          if (direction === 'forward' && dateOffset === 0) {
            resetAnimations();
            setIsGestureActive(false);
            return;
          }
          
          handleNavigation(direction);
        } else {
          resetAnimations();
          setIsGestureActive(false);
        }
      },
      onPanResponderTerminationRequest: () => false, // Don't let other responders terminate this
      onShouldBlockNativeResponder: () => true, // Block native responders
    })
  ).current;


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

  // Calculate sunrise and sunset positions (0-23 hour scale mapped to 0-100%)
  const getSunPosition = (sunTime: Date | undefined) => {
    if (!sunTime) return 0;
    const hour = sunTime.getHours() + sunTime.getMinutes() / 60;
    return (hour / 24) * 100; // Convert to percentage
  };

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
            Setting up your {currentContext} tide...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }],
          opacity: opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
    

      <View style={styles.chartContainer}>
        {/* Sunrise and Sunset markers */}

        {locationInfo && locationInfo.sunset && locationInfo.sunrise && (
          <View
            style={[
              styles.sunLine,
              styles.sunsetMarker,
              {
                width: `${
                  getSunPosition(locationInfo.sunset) -
                  getSunPosition(locationInfo.sunrise)
                }%`,
                left: `${getSunPosition(locationInfo.sunrise)}%`,
              },
            ]}
          />
        )}
      </View>
      <View style={styles.numberBottom}>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            3
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            6
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            9
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            12
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            3
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            6
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.numberedMarker} />
          <Text variant="captionSmall" color={colors.text.primaryDisabled}>
            9
          </Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
        <View style={styles.numberCell}>
          <View style={styles.marker} />
          <Text variant="captionSmall">{""}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

TideInfo.displayName = "TideInfo";

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    backgroundColor: colors.secondary[100],
    borderRadius: 20,
    height: 148,
    maxHeight: 148,
    minHeight: 148,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowRadius: 1.5,
    shadowOpacity: 0.03,
  },
  previewContainer: {
    position: "absolute",
    top: spacing[2],
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
    backgroundColor: colors.primary[500] + "E6", // Semi-transparent
    borderRadius: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  previewText: {
    color: colors.neutral[50],
    textAlign: "center",
    fontWeight: "600",
  },
  dateRangeContainer: {
    position: "absolute",
    top: spacing[2],
    left: spacing[4],
    right: spacing[4],
    zIndex: 5,
  },
  dateRangeText: {
    color: colors.neutral[700],
    textAlign: "center",
    fontWeight: "500",
  },
  debugSection: {
    backgroundColor: colors.text.primary,
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

  chartContainer: {
    height: 80,
    display: "flex",
    width: "100%",
    alignItems: "flex-start",
    backgroundColor: colors.primary[200],
    justifyContent: "flex-start",
  },
  flowCount: {
    alignSelf: "flex-end",
  },
  chart: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  numberBottom: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    height: 25,
  },
  numberCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    gap: 3,
  },
  marker: {
    width: 0.5,
    height: 2,
    backgroundColor: colors.text.primary,
  },
  numberedMarker: {
    width: 0.5,
    height: 2.5,
    backgroundColor: colors.text.primary,
  },
  sunLine: {
    position: "absolute",
    height: 80,
    backgroundColor: colors.warning[100],
    zIndex: 1,
  },
  sunriseMarker: {
    backgroundColor: colors.warning[300],
  },
  sunsetMarker: {
    backgroundColor: colors.primary[100],
  },
  sunLabel: {
    position: "absolute",
    top: -20,
    left: -10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sunLabelText: {
    fontSize: 14,
  },
  emptyChart: {
    flex: 1,
    backgroundColor: "transparent",
  },
  currentTimeLine: {
    position: "absolute",
    width: 2,
    height: 80,
    backgroundColor: colors.error[500],
    zIndex: 3,
  },
  energyCheckLine: {
    position: "absolute",
    width: 1,
    height: 80,
    backgroundColor: colors.primary[400],
    zIndex: 2,
  },
});
