# ADR 0002: Tide Data Storage Format - Objects vs JSON Strings

Date: 2025-08-03

## Status

Draft

## Context

The Tides application needs to store complex tide data including flow sessions, energy updates, and task links. We need to decide on the storage format for this nested data.

### Current Implementation Analysis

**Server-Side Storage (Cloudflare D1 + Workers)**:

```typescript
// Current storage in supabase-tides-demo-1/src/storage/index.ts
interface Tide {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
  flow_sessions: FlowSession[]; // ← Stored as JSON string
  energy_updates: EnergyUpdate[]; // ← Stored as JSON string
  task_links: TaskLink[]; // ← Stored as JSON string
  created_at: string;
  updated_at: string;
}

// Database schema uses JSON.stringify() for nested arrays
await this.db
  .prepare(
    `
  INSERT INTO tides (id, name, status, flow_type, description, energy_level, 
                     flow_sessions, energy_updates, task_links, user_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
  )
  .bind(
    // ...
    JSON.stringify(newTide.flow_sessions), // ← JSON string storage
    JSON.stringify(newTide.energy_updates), // ← JSON string storage
    JSON.stringify(newTide.task_links), // ← JSON string storage
    // ...
  );
```

**Client-Side Representation**:

```typescript
// Mobile app receives and works with structured objects
interface Tide {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
  // ... other fields received as structured data
}
```

### The Decision Question

Should we:

1. **Continue with JSON strings** for nested data storage in D1 database
2. **Migrate to separate tables** with foreign key relationships
3. **Use JSONB-style storage** with better query capabilities

Key considerations:

- D1 SQLite supports JSON functions but not native JSONB like PostgreSQL
- Current approach works for proof-of-concept development
- Query complexity for reporting and analytics
- Storage efficiency and performance
- Development velocity vs future scalability

## Decision

We will **migrate to relational storage** with separate tables for nested data:

1. **Create separate tables** for flow_sessions, energy_updates, and task_links with foreign keys
2. **Maintain simple JSON fields** only for truly unstructured data (user preferences, metadata)
3. **Implement proper database schema** with indexes for common query patterns
4. **Enable powerful analytics** and reporting from day one

**Rationale**:

- Query limitations of JSON strings severely restrict analytics and reporting capabilities
- A strong development team can handle relational complexity without velocity impact  
- Proper schema enables rich features like "show high-intensity sessions this week"
- Migration from JSON to relational is far more painful than starting relational

## Consequences

### Positive

1. **Powerful Analytics & Reporting**

   - Complex queries across flow sessions, energy levels, and tasks
   - Efficient filtering and aggregation on any field
   - Real-time insights: "Show me productivity patterns by time of day"
   - Advanced features: trend analysis, user comparisons, performance metrics

2. **Performance & Scalability**

   - Proper indexes enable fast queries at any scale
   - Normalized data reduces storage overhead
   - Efficient JOINs vs expensive JSON parsing
   - Database-level referential integrity

3. **Feature Enablement**
   - Rich reporting dashboard possibilities
   - User analytics and insights
   - Cross-tide pattern analysis
   - Export capabilities with complex filtering

### Negative

1. **Schema Complexity**

   - More tables to manage and understand
   - Foreign key relationships to maintain  
   - Database migrations for schema changes
   - More complex queries for simple operations

2. **Development Overhead**
   - Need to think about relationships upfront
   - More elaborate data access patterns
   - Additional validation logic for referential integrity

### Mitigations

1. **For Schema Complexity**:

   - Use database migration tools for schema versioning
   - Create comprehensive documentation of relationships
   - Implement database access layer to abstract complexity
   - Use ORM patterns to simplify data access

2. **For Development Overhead**:
   - Create helper functions for common query patterns
   - Build database seeding/fixtures for testing
   - Use TypeScript interfaces to enforce data consistency
   - Implement validation at application and database levels

## Implementation Notes

### New Relational Schema

```sql
-- Main tides table (simplified)
CREATE TABLE tides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  flow_type TEXT CHECK (flow_type IN ('daily', 'weekly', 'project', 'seasonal')) DEFAULT 'project',
  description TEXT,
  energy_level INTEGER DEFAULT 0,
  user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Flow sessions table
CREATE TABLE flow_sessions (
  id TEXT PRIMARY KEY,
  tide_id TEXT NOT NULL REFERENCES tides(id) ON DELETE CASCADE,
  intensity TEXT CHECK (intensity IN ('gentle', 'moderate', 'strong')) DEFAULT 'moderate',
  duration INTEGER NOT NULL, -- minutes
  started_at TEXT NOT NULL,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tide_id) REFERENCES tides(id)
);

-- Energy updates table  
CREATE TABLE energy_updates (
  id TEXT PRIMARY KEY,
  tide_id TEXT NOT NULL REFERENCES tides(id) ON DELETE CASCADE,
  level INTEGER CHECK (level >= 1 AND level <= 10) NOT NULL,
  mood TEXT,
  notes TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tide_id) REFERENCES tides(id)
);

-- Task links table
CREATE TABLE task_links (
  id TEXT PRIMARY KEY,
  tide_id TEXT NOT NULL REFERENCES tides(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  source TEXT DEFAULT 'general', -- github, linear, etc
  title TEXT NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'linked',
  linked_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tide_id) REFERENCES tides(id)
);

-- Indexes for common queries
CREATE INDEX idx_flow_sessions_tide_id ON flow_sessions(tide_id);
CREATE INDEX idx_flow_sessions_started_at ON flow_sessions(started_at);
CREATE INDEX idx_energy_updates_tide_id ON energy_updates(tide_id);
CREATE INDEX idx_energy_updates_timestamp ON energy_updates(timestamp);
CREATE INDEX idx_task_links_tide_id ON task_links(tide_id);
CREATE INDEX idx_tides_user_id ON tides(user_id);
CREATE INDEX idx_tides_created_at ON tides(created_at);
```

### Updated TypeScript Interfaces

```typescript
interface Tide {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
  description?: string;
  energy_level?: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Populated via JOINs when needed
  flow_sessions?: FlowSession[];
  energy_updates?: EnergyUpdate[];
  task_links?: TaskLink[];
}

interface FlowSession {
  id: string;
  tide_id: string;
  intensity: 'gentle' | 'moderate' | 'strong';
  duration: number; // minutes
  started_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

interface EnergyUpdate {
  id: string;
  tide_id: string;
  level: number; // 1-10 scale
  mood?: string;
  notes?: string;
  timestamp: string;
  created_at: string;
}

interface TaskLink {
  id: string;
  tide_id: string;
  task_id: string;
  source: string; // github, linear, etc
  title: string;
  url?: string;
  status?: string;
  linked_at: string;
  created_at: string;
}
```

### Example Powerful Queries Now Possible

```sql
-- Productivity patterns by time of day
SELECT 
  strftime('%H', started_at) as hour,
  AVG(duration) as avg_duration,
  COUNT(*) as session_count
FROM flow_sessions 
WHERE started_at >= date('now', '-30 days')
GROUP BY hour
ORDER BY hour;

-- High-energy sessions this week
SELECT t.name, fs.intensity, fs.duration, fs.started_at
FROM tides t
JOIN flow_sessions fs ON t.id = fs.tide_id
JOIN energy_updates eu ON t.id = eu.tide_id 
WHERE fs.started_at >= date('now', '-7 days')
  AND eu.level >= 8
  AND fs.intensity = 'strong'
ORDER BY fs.started_at DESC;

-- Most productive tides by linked tasks
SELECT t.name, COUNT(tl.id) as task_count, AVG(fs.duration) as avg_flow_duration
FROM tides t
LEFT JOIN task_links tl ON t.id = tl.tide_id
LEFT JOIN flow_sessions fs ON t.id = fs.tide_id
GROUP BY t.id, t.name
HAVING COUNT(tl.id) > 0
ORDER BY task_count DESC, avg_flow_duration DESC;
```

## Related Decisions

- MCP session storage strategy (see ADR 0001)
- Database migration strategy for production
- Analytics and reporting architecture

## References

- Current storage implementation: `supabase-tides-demo-1/src/storage/index.ts`
- SQLite JSON functions documentation
- CLAUDE.md guidance on JSONB priority
- Cloudflare D1 JSON capabilities
