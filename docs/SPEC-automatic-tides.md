# Automatic Daily Tides: Technical Specification

## Executive Summary

Transform Tides from an explicit workflow management system to an ambient productivity tracker that automatically creates and aggregates daily workflows. This reduces user friction while maintaining data fidelity for productivity insights.

## The Problem We're Solving

Currently, users must explicitly create tides, creating friction at the exact moment they want to start working. This is like requiring someone to create a new document before they can start typing - unnecessary cognitive overhead that interrupts flow state.

## Architecture Decision: Why This Works

Your existing architecture already solved the hard problems:

1. **JSONB in R2**: Flexible schema means retroactive updates are trivial
2. **MCP Tools Pattern**: Adding new tools doesn't break existing clients
3. **Flow Types**: Already have daily/weekly/seasonal - perfect for aggregation
4. **Modular Mobile Architecture**: 86% code reduction means adding features is clean

## Implementation Strategy

### Phase 1: Automatic Daily Tides (Week 1)

#### Server Changes (~/apps/server/src/tools/tide-core.ts)

```typescript
/**
 * Gets today's tide or creates one automatically
 * This is the key innovation - treat tides as ambient containers
 */
export async function getOrCreateDailyTide(
  params: { timezone?: string },
  storage: TideStorage
) {
  const today = getTodayKey(params.timezone); // "2025-01-18"
  
  // Check for existing daily tide
  const existing = await storage.findTideByKey(`daily_${today}`);
  if (existing) return { success: true, tide: existing };
  
  // Create new daily tide with minimal metadata
  const tide = await storage.createTide({
    name: today, // Just the date initially
    flow_type: 'daily',
    metadata: {
      auto_created: true,
      initial_date: today,
      can_rename: true,
      aggregation_eligible: true
    }
  });
  
  return { success: true, tide, created: true };
}
```

**Why this approach**: 
- Single source of truth per day
- Retroactive naming preserves intent
- Metadata flags enable smart aggregation later

#### Mobile Changes (~/apps/mobile/src/hooks/useDailyTide.ts)

```typescript
export const useDailyTide = () => {
  const { executeTool } = useMCP();
  const [dailyTide, setDailyTide] = useState<Tide | null>(null);
  
  useEffect(() => {
    // On app open, ensure daily tide exists
    const initializeDailyTide = async () => {
      const result = await executeTool('get_or_create_daily_tide', {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      if (result.success) {
        setDailyTide(result.tide);
        // If newly created, we could show subtle onboarding
        if (result.created) {
          // "Your daily tide is ready"
        }
      }
    };
    
    initializeDailyTide();
  }, []);
  
  return { dailyTide, isReady: !!dailyTide };
};
```

**Senior insight**: Notice we're using the browser's timezone API instead of asking users. Reduce decisions, increase adoption.

### Phase 2: Retroactive Naming (Week 1-2)

Users don't know what their day will be about until they're in it. Let them name it later.

```typescript
export async function updateTideName(
  params: {
    tide_id: string;
    name: string;
    auto_generate?: boolean; // Use AI to suggest based on content
  },
  storage: TideStorage
) {
  const tide = await storage.getTide(params.tide_id);
  
  if (params.auto_generate && !params.name) {
    // Analyze flow sessions, tasks, and energy patterns
    const suggestion = await generateTideName(tide);
    params.name = suggestion;
  }
  
  // Preserve original date in metadata
  tide.name = params.name;
  tide.metadata.renamed_at = new Date().toISOString();
  tide.metadata.original_name = tide.metadata.original_name || tide.name;
  
  await storage.updateTide(tide);
  return { success: true, tide };
}
```

**Why retroactive naming matters**: Users can't predict their day. "2025-01-18" becomes "Shipped auth refactor" after the fact. This preserves both temporal reference and semantic meaning.

### Phase 3: Automatic Context Attachment (Week 2)

Every interaction automatically attaches to the current daily tide.

```typescript
// In ChatContext.tsx
const { dailyTide } = useDailyTide();

const sendMessage = async (message: string) => {
  // Auto-attach to daily tide
  if (dailyTide) {
    await executeTool('tide_add_context', {
      tide_id: dailyTide.id,
      context: {
        type: 'chat',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: { auto_attached: true }
      }
    });
  }
  
  // Continue with normal message flow
  await agentService.sendMessage(message);
};
```

**Pattern recognition**: This is event sourcing. Every user action becomes an event in their daily tide. Later, we can replay these events for insights.

### Phase 4: Intelligent Aggregation (Week 3-4)

#### Weekly Aggregation

```typescript
export async function aggregateToWeeklyTide(
  params: { week_start: string },
  storage: TideStorage
) {
  // Get all daily tides for the week
  const dailyTides = await storage.listTides({
    flow_type: 'daily',
    date_range: getWeekRange(params.week_start)
  });
  
  // Create aggregated summary
  const weeklyData = {
    total_flow_time: sum(dailyTides.map(t => t.total_flow_time)),
    energy_pattern: analyzeEnergyPattern(dailyTides),
    key_accomplishments: extractKeyTasks(dailyTides),
    productivity_score: calculateProductivityScore(dailyTides),
    themes: extractThemes(dailyTides) // AI-powered theme extraction
  };
  
  // Create or update weekly tide
  const weeklyTide = await storage.createOrUpdateTide({
    name: `Week of ${params.week_start}`,
    flow_type: 'weekly',
    metadata: {
      aggregated_from: dailyTides.map(t => t.id),
      week_summary: weeklyData,
      auto_generated: true
    }
  });
  
  return { success: true, weekly_tide: weeklyTide, summary: weeklyData };
}
```

**Why aggregate**: Daily data is noise. Weekly patterns are signal. Monthly trends are insights.

## Database Considerations

Your R2 + D1 hybrid approach is perfect here:

- **D1**: Indexes for fast daily tide lookups by date
- **R2**: Full JSON documents with unlimited metadata growth

No schema migrations needed. Add fields as you go.

## Performance Optimizations

1. **Lazy Creation**: Don't create tide until first interaction
2. **Background Aggregation**: Use Cloudflare Cron Triggers for weekly/monthly rollups
3. **Client Caching**: Daily tide rarely changes, cache aggressively

## Edge Cases Handled

1. **Timezone Changes**: Store timezone with each tide, handle travel
2. **Missed Days**: Don't backfill, gaps are data too
3. **Multiple Devices**: Same daily tide across all devices via user_id
4. **Retroactive Edits**: Full audit trail in metadata

## Migration Strategy

**Zero migration needed**. Existing users keep explicit tides. New behavior only affects new days. This is the beauty of additive changes.

## Success Metrics

- **Adoption**: 100% of active users will have daily tides (by definition)
- **Engagement**: Expect 3x more data points per user
- **Retention**: Reduced friction should improve D7 retention by 20%+

## Technical Debt Acknowledged

1. **Aggregation Logic**: Will need optimization at 10K+ users
2. **AI Naming**: Requires prompt engineering and testing
3. **Storage Costs**: R2 usage will increase linearly with users

## Timeline

- Week 1: Daily tide creation + mobile integration
- Week 2: Retroactive naming + auto-attachment
- Week 3: Weekly aggregation
- Week 4: Monthly aggregation + AI insights

## The Controversial Decision

**We're removing user control over tide creation**. This is intentional. Most productivity apps fail because they require too much user input. We're betting that ambient capture beats explicit tracking.

## Why Engineers Might Resist

1. **"It's not pure CRUD anymore"** - Correct, it's better
2. **"Auto-creation is magic"** - No, it's reducing friction  
3. **"What about user consent?"** - They consented by opening the app

## The Senior Perspective

This isn't a pivot, it's an evolution. You built a flexible foundation (JSONB, MCP tools, modular mobile). Now you're using that foundation to reduce user friction to zero.

The best productivity system is the one users don't have to think about. This makes Tides invisible until users need insights.

## Next Steps

1. Review this spec with the team
2. Create feature flag for gradual rollout
3. Start with daily tide creation only
4. Measure engagement metrics
5. Iterate based on data

## Code Quality Notes

- Add comprehensive tests for tide creation idempotency
- Ensure timezone handling is bulletproof  
- Add Sentry tracking for auto-creation failures
- Document the retroactive naming API clearly

## Final Thought

This change transforms Tides from a productivity tool users must remember to use, into an ambient system that's always there. That's the difference between good software and great software.