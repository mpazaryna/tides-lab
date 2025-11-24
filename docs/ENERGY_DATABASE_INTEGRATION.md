Tides tracks user energy from `tide_add_energy` MCP tool calls and displays them in the `EnergyChart` component at `Home.tsx:317-322`. It currently uses sample data from `data.ts:29+` and energy level conversion utilities (`energyLevelToNumber`, `numberToEnergyLevel`). It supports multiple energy formats: strings ("high", "medium", "low") and numbers (1-10).

#### Notes

- `tide_add_energy` MCP tool is implemented in `handlers/tools.ts:145-166`
- Complete storage architecture with `addEnergyUpdate()` across all storage backends:
  - `D1R2HybridStorage` (production) - `d1-r2.ts:313+`
  - `R2RestApiStorage` (limited) - `r2-rest.ts:193+`
  - `MockTideStorage` (fallback) - `mock.ts:84+`
- Energy data structure includes: `energy_level`, `context`, `timestamp`

#### Problems

**1. Energy chart displays static sample data from `getChartData()`, not live database data**

- No direct integration between mobile energy input and `tide_add_energy` MCP tool

**2. Real-time Synchronization Gap**

- Chart shows static sample data, not reflecting user's actual energy patterns
- No seamless flow: Energy Input → Database → Chart Update → User Reward

#### Goals

**Replace Sample Data Pipeline**

```typescript
// Current: getChartData() returns static sample data
// Target: getChartData() fetches from MCP server via tide_get_report

const energyData = await executeMCPTool("tide_get_report", {
  tide_id: getCurrentContextTideId(),
  format: "energy_only",
});
```

**Desired Flow**

1. User inputs energy + context through mobile UI
2. `tide_add_energy` MCP call stores in database
3. Chart automatically refreshes with new data point
4. User sees immediate visual feedback = **Reward Experience**
