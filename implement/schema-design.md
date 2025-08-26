# Hierarchical Tide Schema Design

## Current Schema Analysis
Based on `apps/server/src/db/schema.sql`, the current `tide_index` table structure:

```sql
CREATE TABLE IF NOT EXISTS tide_index (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('daily', 'weekly', 'project', 'seasonal')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  flow_count INTEGER DEFAULT 0,
  last_flow DATETIME,
  total_duration INTEGER DEFAULT 0,
  energy_balance INTEGER DEFAULT 0,
  r2_path TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Hierarchical Schema Additions

### New Columns for tide_index
```sql
-- Hierarchical relationship support
ALTER TABLE tide_index ADD COLUMN parent_tide_id TEXT REFERENCES tide_index(id);
ALTER TABLE tide_index ADD COLUMN date_start TEXT; -- ISO date (YYYY-MM-DD)
ALTER TABLE tide_index ADD COLUMN date_end TEXT;   -- ISO date (YYYY-MM-DD) 
ALTER TABLE tide_index ADD COLUMN auto_created BOOLEAN DEFAULT FALSE;

-- Add 'monthly' to flow_type enum (modify CHECK constraint)
-- Will need to recreate constraint to add 'monthly'
```

### New Indexes for Performance
```sql
-- Hierarchical relationship queries
CREATE INDEX IF NOT EXISTS idx_tides_parent ON tide_index(parent_tide_id);
CREATE INDEX IF NOT EXISTS idx_tides_date_range ON tide_index(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_tides_auto_created ON tide_index(auto_created, flow_type);

-- Time-based queries for auto-creation
CREATE INDEX IF NOT EXISTS idx_tides_user_date_type ON tide_index(user_id, date_start, flow_type);
CREATE INDEX IF NOT EXISTS idx_tides_user_date_auto ON tide_index(user_id, date_start, auto_created);
```

## Date Boundary Logic

### Daily Tides
- `date_start`: YYYY-MM-DD (e.g., "2025-08-23")
- `date_end`: YYYY-MM-DD (same as start)
- Auto-created for each calendar day when first flow session occurs

### Weekly Tides  
- `date_start`: Monday of the week (e.g., "2025-08-18")
- `date_end`: Sunday of the week (e.g., "2025-08-24")
- Monday-Sunday week boundaries (ISO week standard)

### Monthly Tides
- `date_start`: First day of month (e.g., "2025-08-01") 
- `date_end`: Last day of month (e.g., "2025-08-31")
- Calendar month boundaries

## Hierarchical Relationships

### Parent-Child Linking
```
Monthly Tide (Aug 2025)
├── Weekly Tide (Aug 18-24)
│   ├── Daily Tide (Aug 18)
│   ├── Daily Tide (Aug 19)
│   └── Daily Tide (Aug 20)
└── Weekly Tide (Aug 25-31)
    ├── Daily Tide (Aug 25)
    └── Daily Tide (Aug 26)
```

### Relationship Rules
1. **Daily → Weekly**: Each daily tide links to its containing week
2. **Weekly → Monthly**: Each weekly tide links to its containing month  
3. **Project Tides**: No automatic hierarchy, can be manually linked
4. **Seasonal Tides**: Top-level parents for quarters/seasons

## Flow Session Distribution

When a flow session is created:
1. **Automatic tide creation** if needed (daily, weekly, monthly)
2. **Hierarchical linking** - establish parent-child relationships
3. **Flow distribution** - add session to all relevant tides:
   - Daily tide for the session date
   - Weekly tide containing that date
   - Monthly tide containing that date

## Database Migration Strategy

### Phase 1: Schema Update
1. Add new columns to `tide_index`
2. Create new indexes
3. Update CHECK constraint for flow_type

### Phase 2: Data Migration  
1. Set `auto_created = false` for existing tides
2. Calculate date ranges for existing tides based on flow sessions
3. Establish parent-child relationships where possible
4. Handle orphaned data gracefully

### Phase 3: Validation
1. Verify all relationships are consistent
2. Check date range calculations
3. Validate index performance

## Implementation Notes

### Timezone Handling
- Store all dates in user's local timezone initially
- Consider UTC storage with timezone offset in future versions
- Date boundaries calculated in user's timezone

### Performance Considerations  
- Indexes on hierarchical queries (parent_tide_id)
- Composite indexes for time-range queries
- Consider materialized views for complex hierarchical aggregations

### Backward Compatibility
- Existing tides continue to work (auto_created = false)
- New hierarchical features optional initially
- Gradual migration path for existing data