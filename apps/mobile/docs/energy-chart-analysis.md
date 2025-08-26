# 🎯 Senior Developer Analysis: Energy Data Architecture & Testing Strategy

## Data Flow Architecture

### Current Energy Data Sources

**Primary Source**: `energy_progression` field from `tide_get_report` MCP tool

- **Storage**: Cloudflare D1 (SQL) + R2 (JSONB) hybrid architecture
- **Access Pattern**: Pull-based via MCP over HTTP/JSON-RPC 2.0
- **Data Structure**: Array of `EnergyLevel` enum values (`'low' | 'medium' | 'high' | 'completed'`)

**Fallback Strategy**: Hard-coded sample data (lines 53-60)

```typescript
// Smart fallback prevents empty chart states
const samplePoints: EnergyDataPoint[] = [
  { date: new Date(Date.now() - 6 * 60 * 60 * 1000), value: 7 },
  // ... realistic energy progression
];
```

### Data Transformation Pipeline

```
Raw Energy Level → energyLevelToNumber() → Chart Point
'low' → 3, 'medium' → 6, 'high' → 9, 'completed' → 10
```

**Timestamp Generation Issue** ⚠️: Lines 39-41 show a **major architectural flaw**:

```typescript
const timeOffset =
  (report.energy_progression.length - 1 - index) * 2 * 60 * 60 * 1000; // 2 hours apart
```

This synthesizes timestamps rather than using actual flow session timestamps. This is technical debt that will bite you later.

## 📊 Testing Data Upload Feasibility

### Option 1: Direct MCP Tool Integration (Recommended)

**Feasibility**: ✅ **High** - Use existing `tide_add_energy` tool

```typescript
// Already exists in MCPContext
addEnergyToTide: (tideId: string, energyLevel: EnergyLevel, context?: string) =>
  Promise<EnergyUpdate>;
```

**Implementation Strategy**:

```typescript
// Create retroactive energy data seeder
const seedEnergyData = async (tideId: string) => {
  const testData = [
    { energy: "low", hoursAgo: 24 },
    { energy: "medium", hoursAgo: 18 },
    { energy: "high", hoursAgo: 12 },
    // ... more test data
  ];

  for (const point of testData) {
    await addEnergyToTide(
      tideId,
      point.energy,
      `Test data from ${point.hoursAgo}h ago`
    );
  }
};
```

### Option 2: Database Direct Insert (Power User)

**Feasibility**: ✅ **Medium** - Requires server access

Target: Cloudflare D1 `energy_entries` table (likely structure):

```sql
INSERT INTO energy_entries (tide_id, energy_level, timestamp, context)
VALUES
  ('tide_123', 'high', '2024-08-17 10:00:00', 'Retroactive test data'),
  ('tide_123', 'medium', '2024-08-17 12:00:00', 'Retroactive test data');
```

### Option 3: Mock Service Layer (Development)

**Feasibility**: ✅ **High** - No server dependencies

```typescript
// Add to useEnergyData hook
const useMockData = process.env.NODE_ENV === "development";
if (useMockData) {
  // Override with comprehensive test data
  return generateMockEnergyProgression(tideId);
}
```

## 🏗️ Senior Architectural Concerns

### 1. Timestamp Synthesis Anti-Pattern

**Problem**: Current code fabricates timestamps instead of using real flow session data
**Impact**: Chart shows fake temporal relationships
**Solution**: Modify server to include actual `created_at` timestamps in energy progression

### 2. Data Staleness Strategy

**Missing**: Cache invalidation and real-time updates
**Recommendation**: Add WebSocket or polling for live energy updates during active flow sessions

### 3. Performance Implications

**Current**: N+1 query pattern risk if chart scales to 100+ data points
**Mitigation**: Server-side aggregation and pagination

### 4. Error Boundary Gaps

**Issue**: Chart fails silently with malformed server data
**Fix**: Zod schema validation on client-side data ingestion

## ⚡ Immediate Quick Wins (15-30 min each)

### Quick Win 1: Add Time Context Types (15 min)
**Impact**: Foundation for multi-context without breaking changes
**Effort**: Add types only, no implementation

```typescript
// Add to src/types/charts.ts
export type TimeContext = 'daily' | 'weekly' | 'monthly' | 'seasonal';

export interface TimeContextConfig {
  label: string;
  days: number;
  expectedPoints: number;
  aggregation: 'raw' | 'daily_avg' | 'rolling_3day' | 'rolling_10day';
}

export const TIME_CONTEXTS: Record<TimeContext, TimeContextConfig> = {
  daily: { label: 'Today', days: 1, expectedPoints: 24, aggregation: 'raw' },
  weekly: { label: 'This Week', days: 7, expectedPoints: 7, aggregation: 'daily_avg' },
  monthly: { label: 'This Month', days: 30, expectedPoints: 10, aggregation: 'rolling_3day' },
  seasonal: { label: 'Last 3 Months', days: 90, expectedPoints: 9, aggregation: 'rolling_10day' }
};
```

### Quick Win 2: Enhance Chart Visual Feedback (20 min)
**Impact**: Better UX with current data
**Effort**: Style improvements + better empty states

```typescript
// Update EnergyChart.tsx - Add gradient and better visual feedback
const getChartGradient = (points: EnergyDataPoint[]) => {
  const avgEnergy = points.reduce((sum, p) => sum + p.value, 0) / points.length;
  if (avgEnergy > 7) return colors.success[400]; // High energy = green tint
  if (avgEnergy > 4) return colors.primary[500]; // Medium = primary
  return colors.warning[400]; // Low energy = orange tint
};

// Enhanced empty state with actionable message
const EmptyState = ({ error }: { error?: string }) => (
  <View style={styles.emptyContainer}>
    <TrendingUp color={colors.neutral[300]} size={24} />
    <Text variant="bodySmall" color="tertiary" style={{ marginTop: 8, textAlign: 'center' }}>
      {error || 'Start a flow session to see your energy patterns'}
    </Text>
  </View>
);
```

### Quick Win 3: Add Current Energy Indicator (25 min)
**Impact**: Shows latest energy level prominently
**Effort**: Extract latest value and display as badge

```typescript
// Add to EnergyChart.tsx header
const currentEnergy = points.length > 0 ? points[points.length - 1].value : null;
const getEnergyColor = (energy: number) => {
  if (energy >= 8) return colors.success[500];
  if (energy >= 6) return colors.primary[500];
  if (energy >= 4) return colors.warning[500];
  return colors.error[500];
};

// In header section:
<View style={styles.titleRow}>
  <TrendingUp color={colors.neutral[600]} size={14} />
  <Text variant="bodySmall" color="secondary" style={styles.title}>
    Recent Energy Levels
  </Text>
  {currentEnergy && (
    <View style={[styles.energyBadge, { backgroundColor: getEnergyColor(currentEnergy) }]}>
      <Text variant="bodySmall" color="white" style={styles.energyText}>
        {currentEnergy.toFixed(1)}
      </Text>
    </View>
  )}
</View>
```

### Quick Win 4: Better Sample Data Variety (15 min)
**Impact**: More realistic demo experience
**Effort**: Replace static sample data with dynamic patterns

```typescript
// Replace in useEnergyData.ts - More realistic sample data
const generateRealisticSampleData = (): EnergyDataPoint[] => {
  const now = Date.now();
  const patterns = [
    // Morning energy dip, afternoon peak, evening decline
    [6, 5, 7, 8, 9, 8, 7, 6],
    // Steady energy with lunch dip
    [7, 7, 6, 5, 7, 8, 8, 7],
    // High performance day
    [8, 9, 8, 7, 8, 9, 8, 7]
  ];
  
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  return selectedPattern.map((energy, index) => ({
    date: new Date(now - (selectedPattern.length - 1 - index) * 60 * 60 * 1000),
    value: energy + (Math.random() - 0.5) // Add slight variance
  }));
};
```

### Quick Win 5: Add Debug Seed Button (30 min)
**Impact**: Easy testing for development
**Effort**: Add dev-only button to generate test data

```typescript
// Add to EnergyChart.tsx (development only)
import { useMCP } from '../../context/MCPContext';

const { addEnergyToTide } = useMCP();

const seedTestData = async () => {
  if (!tideId) return;
  
  const testPattern = [
    { energy: 'medium', hoursAgo: 8 },
    { energy: 'high', hoursAgo: 6 },
    { energy: 'medium', hoursAgo: 4 },
    { energy: 'high', hoursAgo: 2 },
    { energy: 'medium', hoursAgo: 1 }
  ];
  
  for (const point of testPattern) {
    await addEnergyToTide(tideId, point.energy as EnergyLevel, `Test data`);
  }
  refetch();
};

// Add to component return (in development only)
{__DEV__ && (
  <TouchableOpacity style={styles.debugButton} onPress={seedTestData}>
    <Text variant="bodySmall" color="primary">+ Seed Test Data</Text>
  </TouchableOpacity>
)}
```

### Quick Win 6: Smart Chart Height (20 min)
**Impact**: Better mobile experience
**Effort**: Dynamic height based on screen size and data

```typescript
// Add to EnergyChart.tsx
import { Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');
const optimalHeight = Math.min(100, screenHeight * 0.12); // 12% of screen or 100px max

// Use in component
const dynamicHeight = height || optimalHeight;
```

## 🛠️ Recommended Testing Implementation

### Phase 1: Quick Win Implementation (1-2 hours total)

```typescript
// Add to EnergyChart component
const seedTestData = async () => {
  if (!tideId) return;

  const testEnergyLevels = ["low", "medium", "high", "medium", "high"];
  for (let i = 0; i < testEnergyLevels.length; i++) {
    await addEnergyToTide(
      tideId,
      testEnergyLevels[i] as EnergyLevel,
      `Test session ${i + 1}`
    );
  }
  refetch(); // Refresh chart
};

// Add debug button in development
{
  __DEV__ && <Button onPress={seedTestData}>Seed Test Data</Button>;
}
```

### Phase 2: Production Ready (1 day)

1. **Server Enhancement**: Add batch energy upload endpoint
2. **Client Hook**: `useEnergySeeder` with transaction rollback
3. **Validation**: Schema-based data integrity checks
4. **Analytics**: Track synthetic vs. real data for debugging

## 💡 Senior Insights

**Why the current architecture works now but won't scale**:

- Acceptable for <100 users, but energy data will become a bottleneck
- Missing proper time-series optimizations
- No data retention policies

**The smart technical debt decision**:

- Sample data fallback (line 51-61) is actually brilliant
- Prevents chart breaking during development
- But creates false confidence in production

**Production readiness checklist**:

- [ ] Real timestamps from flow sessions
- [ ] Batch upload endpoint for testing
- [ ] Data validation pipeline
- [ ] Performance monitoring for chart rendering
- [ ] User privacy controls for energy data

## 🕒 Multi-Context Time View Architecture

### Requirements Overview

Users need to switch between temporal contexts with different aggregation patterns:

| Context | Time Range | Data Aggregation | Chart Behavior |
|---------|------------|------------------|----------------|
| **Daily** | Current day | Raw data points | Individual flow sessions as curve points |
| **Weekly** | Past 7 days | Daily averages | 7 points showing daily average energy |
| **Monthly** | Past month | 3-day rolling average | ~10 points with 3-day smoothing |
| **Seasonal** | Past 3 months | 10-day rolling average | ~9 points with 10-day smoothing |

### Data Architecture Implications

#### Current Limitations
```typescript
// Current implementation only handles single time context
const timeOffset = (report.energy_progression.length - 1 - index) * 2 * 60 * 60 * 1000;
```

#### Required Enhancements

**1. Time Context State Management**
```typescript
export type TimeContext = 'daily' | 'weekly' | 'monthly' | 'seasonal';

export interface TimeContextConfig {
  range: DateRange;
  aggregation: 'raw' | 'daily_avg' | 'rolling_3day' | 'rolling_10day';
  expectedPoints: number;
}

const TIME_CONTEXTS: Record<TimeContext, TimeContextConfig> = {
  daily: { 
    range: { days: 1 }, 
    aggregation: 'raw', 
    expectedPoints: 24 // hourly granularity
  },
  weekly: { 
    range: { days: 7 }, 
    aggregation: 'daily_avg', 
    expectedPoints: 7 
  },
  monthly: { 
    range: { days: 30 }, 
    aggregation: 'rolling_3day', 
    expectedPoints: 10 
  },
  seasonal: { 
    range: { days: 90 }, 
    aggregation: 'rolling_10day', 
    expectedPoints: 9 
  }
};
```

**2. Enhanced Data Fetching Strategy**
```typescript
// Updated useEnergyData hook signature
export const useEnergyData = (
  tideId?: string, 
  timeContext: TimeContext = 'daily'
) => {
  const fetchEnergyData = useCallback(async () => {
    const config = TIME_CONTEXTS[timeContext];
    const startDate = getStartDateForContext(timeContext);
    
    // Fetch raw energy entries in date range
    const energyEntries = await getEnergyEntries(tideId, startDate, new Date());
    
    // Apply aggregation based on context
    const aggregatedData = aggregateEnergyData(energyEntries, config.aggregation);
    
    return transformToChartPoints(aggregatedData);
  }, [tideId, timeContext]);
};
```

**3. Data Aggregation Functions**
```typescript
const aggregateEnergyData = (
  entries: EnergyEntry[], 
  aggregation: AggregationType
): EnergyDataPoint[] => {
  switch (aggregation) {
    case 'raw':
      return entries.map(entry => ({
        date: new Date(entry.timestamp),
        value: energyLevelToNumber(entry.energy_level)
      }));
      
    case 'daily_avg':
      return groupByDay(entries).map(dayGroup => ({
        date: dayGroup.date,
        value: calculateAverage(dayGroup.entries)
      }));
      
    case 'rolling_3day':
      return calculateRollingAverage(entries, 3);
      
    case 'rolling_10day':
      return calculateRollingAverage(entries, 10);
  }
};
```

### UI/UX Architecture

**Context Selector Component**
```typescript
interface TimeContextSelectorProps {
  currentContext: TimeContext;
  onContextChange: (context: TimeContext) => void;
}

const TimeContextSelector: React.FC<TimeContextSelectorProps> = ({
  currentContext,
  onContextChange
}) => {
  return (
    <View style={styles.selectorContainer}>
      {(['daily', 'weekly', 'monthly', 'seasonal'] as TimeContext[]).map(context => (
        <TouchableOpacity
          key={context}
          style={[
            styles.contextButton,
            currentContext === context && styles.activeContext
          ]}
          onPress={() => onContextChange(context)}
        >
          <Text variant="bodySmall" color={currentContext === context ? 'primary' : 'secondary'}>
            {context.charAt(0).toUpperCase() + context.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

**Updated EnergyChart Integration**
```typescript
export const EnergyChart: React.FC<EnergyChartProps> = ({ 
  tideId, 
  height = 80 
}) => {
  const [timeContext, setTimeContext] = useState<TimeContext>('daily');
  const { points, loading, error } = useEnergyData(tideId, timeContext);

  return (
    <View style={[styles.container, { height: height + 40 }]}> {/* +40 for selector */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp color={colors.neutral[600]} size={14} />
          <Text variant="bodySmall" color="secondary" style={styles.title}>
            Energy Levels - {timeContext}
          </Text>
        </View>
        <Text variant="bodySmall" color="tertiary">
          {points.length} {getDataPointLabel(timeContext)}
        </Text>
      </View>
      
      <TimeContextSelector 
        currentContext={timeContext}
        onContextChange={setTimeContext}
      />
      
      <View style={styles.chartContainer}>
        <LineGraph
          points={points}
          animated={true}
          color={colors.primary[500]}
          style={styles.chart}
          // Dynamic range based on context
          range={getChartRange(timeContext, points)}
        />
      </View>
    </View>
  );
};
```

### Performance Considerations

**1. Caching Strategy**
```typescript
// Cache aggregated data by time context to avoid recalculation
const energyDataCache = new Map<string, { data: EnergyDataPoint[], timestamp: number }>();

const getCacheKey = (tideId: string, timeContext: TimeContext) => 
  `${tideId}_${timeContext}`;
```

**2. Server-Side Aggregation**
For production efficiency, move aggregation logic to the MCP server:

```typescript
// New MCP tool: tide_get_energy_aggregated
interface EnergyAggregationRequest {
  tide_id: string;
  time_context: TimeContext;
  start_date: string;
  end_date: string;
}
```

**3. Lazy Loading Strategy**
Only fetch data when context is actively selected:

```typescript
const [loadedContexts, setLoadedContexts] = useState<Set<TimeContext>>(new Set(['daily']));

const handleContextChange = useCallback((newContext: TimeContext) => {
  setTimeContext(newContext);
  if (!loadedContexts.has(newContext)) {
    // Trigger background fetch for new context
    prefetchContextData(newContext);
    setLoadedContexts(prev => new Set([...prev, newContext]));
  }
}, [loadedContexts]);
```

### Senior Architectural Recommendations

**1. Temporal Data Modeling**
- Add `granularity` field to energy entries for different sampling rates
- Implement proper time-series indexing in Cloudflare D1
- Consider using time-bucketing for seasonal aggregations

**2. Chart Performance**
- Implement chart virtualization for datasets >100 points
- Add smooth transitions between time contexts using react-native-graph animations
- Precompute rolling averages server-side to reduce client computation

**3. UX Considerations**
- Add loading skeletons during context switches
- Implement intelligent zoom levels based on time context
- Show data density indicators ("24 sessions today" vs "7 days averaged")

**4. Testing Strategy Enhancement**
```typescript
// Enhanced test data seeder for multiple contexts
const seedMultiContextData = async (tideId: string) => {
  const contexts = {
    daily: generateHourlyData(24), // 24 hours of data
    weekly: generateDailyData(7),  // 7 days of data  
    monthly: generateDailyData(30), // 30 days of data
    seasonal: generateDailyData(90) // 90 days of data
  };
  
  for (const [context, data] of Object.entries(contexts)) {
    await seedContextData(tideId, context, data);
  }
};
```

## 🎯 Updated Conclusion

The multi-context time view adds significant complexity but creates a powerful user experience. The architecture needs:

1. **Enhanced data aggregation** at multiple time scales
2. **Server-side optimization** for rolling averages 
3. **Intelligent caching** to prevent redundant calculations
4. **Smooth UX transitions** between contexts

Priority implementation order:
1. Time context state management (1 day)
2. Basic aggregation functions (2 days) 
3. UI context selector (1 day)
4. Server-side aggregation optimization (3 days)
5. Advanced caching and performance tuning (2 days)

This transforms the energy chart from a simple visualization into a comprehensive energy analytics dashboard.

---

### Files Referenced

- `src/hooks/useEnergyData.ts` - Primary data fetching logic (needs major refactor)
- `src/context/MCPContext.tsx` - MCP tool integration (needs new aggregation tools)
- `src/types/charts.ts` - Data transformation types (needs time context types)
- `src/components/charts/EnergyChart.tsx` - Chart rendering component (needs context selector)
- `src/components/charts/TimeContextSelector.tsx` - New component needed
- `src/utils/energyAggregation.ts` - New utility file needed
