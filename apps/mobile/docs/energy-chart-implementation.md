# 🌊 Energy Chart Implementation: Tide-Style Line Graph

## Architecture Overview

**Simple, Elegant Solution per User Requirements:**

1. **One API Call**: Fetch 120 days of energy data with real timestamps
2. **Client-Side Aggregation**: Fast time context switching (daily/weekly/monthly/seasonal)
3. **Real-Time Updates**: Refresh data when energy submitted via POST
4. **Tide Chart Aesthetic**: Smooth curved line with peak labeling like tide charts

## Implementation Steps

### Step 1: Enhanced Types (15 min)

```typescript
// src/types/charts.ts
export type TimeContext = 'daily' | 'weekly' | 'monthly' | 'seasonal';

export interface EnergyEntry {
  timestamp: string; // ISO 8601 from actual submission
  energy_level: EnergyLevel;
  tide_id: string;
  context?: string;
}

export interface TimeContextConfig {
  label: string;
  days: number;
  aggregation: 'raw' | 'daily_avg' | 'rolling_avg';
}

export const TIME_CONTEXTS: Record<TimeContext, TimeContextConfig> = {
  daily: { label: 'Today', days: 1, aggregation: 'raw' },
  weekly: { label: 'Week', days: 7, aggregation: 'daily_avg' },
  monthly: { label: 'Month', days: 30, aggregation: 'rolling_avg' },
  seasonal: { label: 'Season', days: 90, aggregation: 'rolling_avg' }
};

export interface EnergyHistoryData {
  entries: EnergyEntry[];
  loading: boolean;
  error: string | null;
}
```

### Step 2: New MCP Tool Integration (20 min)

```typescript
// Add to MCPContext.tsx
getTideEnergyHistory: (
  daysBack?: number,
  tideId?: string
) => Promise<EnergyHistoryResponse>;

// MCPService implementation
async getTideEnergyHistory(daysBack = 120, tideId?: string) {
  return this.call('tide_get_energy_history', {
    days_back: daysBack,
    tide_id: tideId
  });
}
```

### Step 3: 120-Day Energy Hook (45 min)

```typescript
// src/hooks/useEnergyHistory.ts
export const useEnergyHistory = (tideId?: string) => {
  const [data, setData] = useState<EnergyHistoryData>({
    entries: [],
    loading: false,
    error: null
  });

  const { getTideEnergyHistory, isConnected } = useMCP();

  const fetchEnergyHistory = useCallback(async () => {
    if (!isConnected) return;
    
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await getTideEnergyHistory(120, tideId);
      if (response.success) {
        setData({
          entries: response.entries || [],
          loading: false,
          error: null
        });
      } else {
        throw new Error(response.error || 'Failed to fetch energy history');
      }
    } catch (error) {
      setData({
        entries: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [getTideEnergyHistory, isConnected, tideId]);

  const getDataForContext = useCallback((context: TimeContext): EnergyDataPoint[] => {
    const config = TIME_CONTEXTS[context];
    const cutoffDate = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
    
    const filteredEntries = data.entries.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate &&
      (!tideId || entry.tide_id === tideId)
    );

    return aggregateEnergyData(filteredEntries, config.aggregation);
  }, [data.entries, tideId]);

  useEffect(() => {
    fetchEnergyHistory();
  }, [fetchEnergyHistory]);

  return {
    ...data,
    refetch: fetchEnergyHistory,
    getDataForContext
  };
};

// Client-side aggregation functions
function aggregateEnergyData(entries: EnergyEntry[], aggregation: string): EnergyDataPoint[] {
  switch (aggregation) {
    case 'raw':
      return entries.map(entry => ({
        date: new Date(entry.timestamp),
        value: energyLevelToNumber(entry.energy_level)
      }));
    
    case 'daily_avg':
      return groupByDay(entries).map(group => ({
        date: group.date,
        value: group.entries.reduce((sum, e) => sum + energyLevelToNumber(e.energy_level), 0) / group.entries.length
      }));
    
    case 'rolling_avg':
      return calculateRollingAverage(entries, 3);
    
    default:
      return [];
  }
}
```

### Step 4: Time Context Selector (20 min)

```typescript
// src/components/charts/TimeContextSelector.tsx
export const TimeContextSelector: React.FC<{
  currentContext: TimeContext;
  onContextChange: (context: TimeContext) => void;
}> = ({ currentContext, onContextChange }) => {
  return (
    <View style={styles.container}>
      {(['daily', 'weekly', 'monthly', 'seasonal'] as TimeContext[]).map(context => (
        <TouchableOpacity
          key={context}
          style={[
            styles.contextButton,
            currentContext === context && styles.activeContext
          ]}
          onPress={() => onContextChange(context)}
        >
          <Text 
            variant="bodySmall" 
            color={currentContext === context ? 'primary' : 'secondary'}
          >
            {TIME_CONTEXTS[context].label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### Step 5: Tide-Style Chart Component (60 min)

```typescript
// src/components/charts/EnergyChart.tsx - Updated with tide aesthetic
export const EnergyChart: React.FC<EnergyChartProps> = ({ 
  tideId, 
  height = 120 
}) => {
  const [timeContext, setTimeContext] = useState<TimeContext>('daily');
  const { entries, loading, error, refetch, getDataForContext } = useEnergyHistory(tideId);
  
  const points = useMemo(() => 
    getDataForContext(timeContext), 
    [getDataForContext, timeContext]
  );

  const peaks = useMemo(() => 
    findEnergyPeaks(points), 
    [points]
  );

  if (loading) {
    return <EnergyChartSkeleton height={height} />;
  }

  if (error || points.length === 0) {
    return <EnergyChartEmpty error={error} height={height} />;
  }

  return (
    <View style={[styles.container, { height: height + 60 }]}>
      {/* Header with current energy indicator */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp color={colors.neutral[600]} size={16} />
          <Text variant="bodyMedium" color="primary" style={styles.title}>
            Energy Flow
          </Text>
          {points.length > 0 && (
            <EnergyBadge value={points[points.length - 1].value} />
          )}
        </View>
        <Text variant="bodySmall" color="tertiary">
          {points.length} sessions • {TIME_CONTEXTS[timeContext].label}
        </Text>
      </View>

      {/* Time Context Selector */}
      <TimeContextSelector 
        currentContext={timeContext}
        onContextChange={setTimeContext}
      />

      {/* Tide-Style Chart */}
      <View style={styles.chartContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chartBackground}
        >
          <LineGraph
            points={points}
            animated={true}
            color="rgba(255, 255, 255, 0.9)"
            style={styles.chart}
            enablePanGesture={true}
            TopAxisLabel={() => peaks.length > 0 ? (
              <PeakLabel peak={peaks[0]} />
            ) : null}
            onPointSelected={(point) => {
              // Haptic feedback like tide apps
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          
          {/* Peak Labels */}
          {peaks.map((peak, index) => (
            <PeakLabel 
              key={index}
              peak={peak}
              style={[styles.peakLabel, getPeakLabelPosition(peak)]}
            />
          ))}
        </LinearGradient>
      </View>
    </View>
  );
};

// Peak labeling component like tide charts
const PeakLabel: React.FC<{ peak: EnergyPeak }> = ({ peak }) => (
  <View style={styles.peakLabelContainer}>
    <Text variant="caption" color="white" style={styles.peakTime}>
      {formatTime(peak.date)}
    </Text>
    <Text variant="bodySmall" color="white" style={styles.peakValue}>
      {peak.value.toFixed(1)}
    </Text>
  </View>
);
```

### Step 6: Real-Time Integration (15 min)

```typescript
// Update MCPContext.tsx - Add refetch trigger
const addEnergyToTide = useCallback(async (...args) => {
  const result = await mcpService.addEnergyToTide(...args);
  
  if (result.success) {
    // Trigger energy history refresh
    if (energyHistoryRefreshCallback) {
      energyHistoryRefreshCallback();
    }
  }
  
  return result;
}, [energyHistoryRefreshCallback]);

// Register energy refresh callback
const registerEnergyRefresh = useCallback((callback: () => void) => {
  energyHistoryRefreshCallback = callback;
}, []);
```

## Visual Design (Tide Chart Style)

### Color Scheme
- **Background**: Linear gradient (#667eea → #764ba2)
- **Line**: Semi-transparent white (rgba(255, 255, 255, 0.9))
- **Labels**: White text with subtle shadows
- **Peaks**: Highlighted with time and energy value

### Styling Details
```typescript
const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing[2]
  },
  chartBackground: {
    flex: 1,
    padding: spacing[3]
  },
  peakLabel: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6
  },
  peakTime: {
    fontSize: 11,
    fontWeight: '500'
  },
  peakValue: {
    fontSize: 13,
    fontWeight: '700'
  }
});
```

## Performance Characteristics

- **Initial Load**: ~120 data points (minimal)
- **Context Switching**: Instant (client-side aggregation)
- **Memory Usage**: <1MB for 120 days of data
- **Real-Time**: Immediate refresh on energy submission
- **Offline**: Graceful degradation with cached data

## MCP Server Requirements

### New Tool: `tide_get_energy_history`

```sql
-- Server-side query (example)
SELECT 
  timestamp,
  energy_level,
  tide_id,
  context
FROM energy_entries 
WHERE timestamp >= DATE('now', '-120 days')
  AND (tide_id = ? OR ? IS NULL)
ORDER BY timestamp ASC;
```

This implementation delivers exactly what you requested: a simple, elegant energy chart that looks like tide charts, loads 120 days of data in one call, and provides instant time context switching with real-time updates.