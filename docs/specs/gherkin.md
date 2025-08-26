# Gherkin Scenario Review Notes

This document tracks the review of Gherkin scenarios for the Tides mobile app, documenting implications for both the iOS client and MCP server implementation.

## Table of Contents

- [Flow Session Management](#flow-session-management)
  - [Scenario 1: Start a new authenticated flow session](#scenario-1-start-a-new-authenticated-flow-session)
  - [Scenario 2: Navigate through authenticated flow state cycle](#scenario-2-navigate-through-authenticated-flow-state-cycle)
  - [Scenario 3: Pause and resume flow session](#scenario-3-pause-and-resume-flow-session)
  - [Scenario 4: Track energy levels during flow session](#scenario-4-track-energy-levels-during-flow-session)
  - [Scenario 5: Complete flow session with summary](#scenario-5-complete-flow-session-with-summary)
  - [Scenario 6: Handle unexpected interruptions](#scenario-6-handle-unexpected-interruptions)
  - [Scenario 7: Customize flow session parameters](#scenario-7-customize-flow-session-parameters)
  - [Scenario 8: Manage multiple flow sessions](#scenario-8-manage-multiple-flow-sessions)
  - [Scenario 9: View flow session history](#scenario-9-view-flow-session-history)
  - [Scenario 10: Handle system interruptions](#scenario-10-handle-system-interruptions)

---

## Flow Session Management

Source: [`servers/tides/docs/features/flow_session_management.feature`](servers/tides/docs/features/flow_session_management.feature)

### Scenario 1: Start a new authenticated flow session

**Location**: Lines 14-28 in flow_session_management.feature  
**Tags**: `@critical @flow-start @oauth @mcp-tools`

#### Scenario Description

User starts a new flow session by tapping "Start Flow Session" button. The app authenticates with the MCP server and creates a new flow session record.

#### Client (iOS App) Requirements

1. **Authentication Layer**

   - OAuth token storage (Keychain)
   - Token refresh mechanism
   - Bearer token injection in HTTP headers
   - Session persistence for app lifecycle

2. **UI Components**

   - "Start Flow Session" button
   - Intensity selector (gentle/moderate/strong)
   - Loading states during server communication
   - Error states for failed requests
   - Success confirmation UI

3. **Network Layer**

   - HTTP POST request capability
   - JSON-RPC 2.0 protocol implementation
   - Request/response models for flow_session_start
   - Error handling for network failures
   - Retry logic with exponential backoff

4. **State Management**

   - Local storage of tide_id
   - Current session state tracking
   - Sync queue for offline scenarios
   - State persistence across app restarts

5. **Data Models**

   ```swift
   struct FlowSessionStartRequest {
       let tide_id: String
       let intensity: FlowIntensity // enum: .gentle, .moderate, .strong
       let session_type: String // "daily"
   }

   struct FlowSessionResponse {
       let session_id: String
       let start_time: Date
       let status: String
   }
   ```

#### Server (MCP) Requirements

1. **Authentication Middleware**

   - OAuth token validation
   - User identity extraction from token
   - Permission checking for tide access
   - Token expiration handling

2. **MCP Tool Implementation**

   - `flow_session_start` tool with parameters:
     - tide_id (string)
     - intensity (enum)
     - session_type (string)
   - Input validation
   - Response formatting per MCP spec

3. **Database Layer**

   - User-scoped data queries
   - Flow session table schema:
     - session_id (primary key)
     - user_id (foreign key)
     - tide_id (foreign key)
     - start_time
     - intensity
     - session_type
     - status
   - Transaction support for atomic operations

4. **Business Logic**

   - Verify tide belongs to authenticated user
   - Check for existing active sessions
   - Generate unique session_id
   - Set initial session state
   - Calculate any derived fields

5. **Response Handling**
   - Consistent error responses
   - Success response with session data
   - Proper HTTP status codes
   - MCP-compliant JSON-RPC formatting

#### Critical Integration Points

1. **Authentication Flow**

   - Client must include `Authorization: Bearer {token}` header
   - Server must validate token before processing

2. **Data Consistency**

   - Client tide_id must match server records
   - User can only start sessions for their own tides

3. **Error Scenarios**

   - Invalid/expired token → 401 response
   - Tide not found → 404 response
   - Tide belongs to different user → 403 response
   - Server error → 500 response

4. **State Synchronization**
   - Client updates UI to "In Flow" only after successful server response
   - Client stores session_id for future updates
   - Server maintains source of truth for session state

#### Discussion Notes

_Space for notes and decisions as we review_

---

### Scenario 2: Navigate through authenticated flow state cycle

**Location**: Lines 30-42 in flow_session_management.feature  
**Tags**: `@critical @flow-states @oauth @mcp-sync`

#### Scenario Description

Flow sessions progress through four states (Rising → Peak → Ebbing → Rest) with each transition synchronized to the server. State persists across app restarts.

#### Client (iOS App) Requirements

1. **State Management**

   - Track current flow state locally
   - State transition logic/timers
   - Queue state updates for server sync
   - Persist state across app lifecycle

2. **UI Components**

   - Flow state visualization (4 states)
   - Current state indicator
   - Progress within current state
   - State transition animations
   - Background state notifications

3. **Network Layer**

   - `flow_session_update` calls for each transition
   - Include state parameter ("rising", "peak", "ebbing", "rest")
   - Timestamp tracking for each transition
   - Offline queue for state updates

4. **State Recovery**

   - On app launch, query current session state
   - Reconcile local vs server state
   - Handle mid-state recovery
   - Resume timers from correct position

5. **Data Models**

   ```swift
   enum FlowState: String {
       case rising, peak, ebbing, rest
   }

   struct FlowStateUpdate {
       let session_id: String
       let state: FlowState
       let timestamp: Date
   }
   ```

#### Server (MCP) Requirements

1. **MCP Tool Implementation**

   - `flow_session_update` tool accepting:
     - session_id (string)
     - state (enum: rising/peak/ebbing/rest)
     - timestamp (ISO 8601)
   - Validate state transitions (no skipping)
   - Store state history

2. **Database Schema**

   - Flow session state history table:
     - id (primary key)
     - session_id (foreign key)
     - state (enum)
     - timestamp
     - user_id (for validation)
   - Current state on session record

3. **Business Logic**

   - Validate session belongs to user
   - Ensure valid state progression
   - Calculate time spent in each state
   - Handle concurrent updates
   - Prevent invalid state transitions

4. **Query Support**
   - `flow_session_status` tool for current state
   - Return current state and duration
   - Include state history if requested
   - Support state recovery scenarios

#### Critical Integration Points

1. **State Progression Rules**

   - Must follow: Rising → Peak → Ebbing → Rest
   - No backwards transitions
   - No skipping states
   - Each state must have minimum duration?

2. **Timing Synchronization**

   - Client manages state timers
   - Server validates transitions
   - Timestamp conflicts resolution
   - Clock drift handling

3. **Recovery Scenarios**

   - App crash during state transition
   - Network failure during update
   - Server/client state mismatch
   - Expired session handling

4. **Background Behavior**
   - State progression while app backgrounded
   - Notification scheduling for transitions
   - Battery optimization considerations
   - Background fetch for state sync

#### Discussion Notes

**Key Discussion Points:**

1. **State Duration & Timing**

   - Should each state have a fixed duration or be flexible?
   - For example: Rising (5 min) → Peak (15 min) → Ebbing (5 min) → Rest (5 min)?
   - Or should it adapt based on the total session length?
   - Consider different durations for different intensity levels (gentle/moderate/strong)

2. **User Experience**

   - Do users need to understand these states or should they be invisible?
   - Should we notify users of state changes?
   - What visual metaphor works best? (wave? circle? linear progress?)
   - Consider subtle vs explicit state indicators

3. **Technical Challenges**

   - Background state progression is complex on iOS
   - How do we handle the app being killed during Peak state?
   - Should the server drive state transitions or just validate them?
   - Battery optimization vs accurate state tracking trade-off

4. **State Semantics**

   - **Rising**: Getting into flow, warming up
   - **Peak**: Maximum productivity/focus
   - **Ebbing**: Winding down, less intense
   - **Rest**: Recovery period

5. **Open Questions**
   - Can users pause during any state?
   - What happens if a user wants to end session early?
   - Should state durations be customizable per user?
   - How do we handle time zone changes during a session?

---

### Scenario 3: Pause and resume flow session

**Location**: Lines 44-60 in flow_session_management.feature  
**Tags**: `@flow-control @mcp-persistence`

#### Scenario Description

Users can pause an active flow session for unexpected breaks and resume later. The server maintains accurate timing and logs all pause/resume events.

#### Client (iOS App) Requirements

1. **UI Components**

   - Prominent "Pause" button during active flow
   - "Resume" button when paused
   - Pause duration display
   - Visual indicator of paused state
   - Optional pause reason selector

2. **State Management**

   - Track pause state locally
   - Store pause timestamp
   - Calculate pause duration
   - Maintain session context during pause
   - Handle app termination while paused

3. **Network Layer**

   - Send pause update with parameters:
     - session_id
     - state: "paused"
     - pause_reason: "user_initiated"
     - timestamp
   - Send resume update with state: "resumed"
   - Queue updates if offline

4. **Timer Management**

   - Stop flow timer on pause
   - Track pause duration separately
   - Resume timer from correct position
   - Exclude pause time from total flow time
   - Update UI timers appropriately

5. **Data Models**

   ```swift
   struct PauseEvent {
       let session_id: String
       let pause_reason: PauseReason
       let timestamp: Date
   }

   enum PauseReason: String {
       case user_initiated
       case phone_call
       case app_backgrounded
       case emergency
   }
   ```

#### Server (MCP) Requirements

1. **Pause Handling Logic**

   - Accept "paused" state in flow_session_update
   - Store pause timestamp
   - Track pause reason
   - Maintain session timing integrity
   - Support multiple pause/resume cycles

2. **Database Schema**

   - Pause events table:
     - id (primary key)
     - session_id (foreign key)
     - pause_start_time
     - pause_end_time (null if ongoing)
     - pause_reason
     - user_id
   - Update session record with pause state

3. **Timing Calculations**

   - Track total pause time
   - Calculate active flow time (total - pauses)
   - Preserve state duration accuracy
   - Handle overlapping pause events
   - Support pause analytics

4. **Resume Logic**
   - Validate session can be resumed
   - Calculate pause duration
   - Update pause end time
   - Return updated session timing
   - Ensure state consistency

#### Critical Integration Points

1. **Pause State Validation**

   - Can't pause if already paused
   - Can't resume if not paused
   - Handle rapid pause/resume cycles
   - Validate session ownership

2. **Timing Accuracy**

   - Server is source of truth for timing
   - Handle clock drift between client/server
   - Preserve millisecond accuracy
   - Exclude pauses from flow metrics

3. **Edge Cases**

   - Pause during state transition
   - Multiple devices accessing same session
   - Session expiry while paused
   - Network failure during pause/resume

4. **Analytics Requirements**
   - Track pause frequency
   - Average pause duration
   - Pause reasons distribution
   - Impact on flow completion

#### Discussion Notes

**Key Questions:**

1. **Pause Limits**

   - Maximum pause duration allowed?
   - Maximum number of pauses per session?
   - Auto-end session after extended pause?

2. **Pause Reasons**

   - Should users specify why they're pausing?
   - Predefined reasons vs free text?
   - Different handling for different reasons?

3. **UI/UX Considerations**

   - How prominent should pause button be?
   - Accidental pause prevention?
   - Quick pause vs detailed pause?
   - Resume confirmation needed?

4. **Background Behavior**

   - Auto-pause when app backgrounds?
   - Notification to resume?
   - Battery impact of maintaining paused state?

5. **State Interaction**
   - Can pause during any flow state?
   - Does pause affect state progression?
   - Resume in same state or restart state?

---

### Scenario 4: Track energy levels during flow session

**Location**: Lines 62-72 in flow_session_management.feature  
**Tags**: `@flow-tracking @mcp-analytics`

#### Scenario Description

Users receive prompts to rate their energy levels (1-10) during flow sessions. The server accumulates this data to identify patterns and provide future recommendations.

#### Client (iOS App) Requirements

1. **UI Components**

   - Energy rating interface (1-10 scale)
   - Prompt notifications/modals
   - Visual energy scale (slider, buttons, or visual metaphor)
   - Quick rating option vs detailed check-in
   - Energy history visualization

2. **Prompt Management**

   - Configurable check-in frequency
   - Smart timing (not during deep focus)
   - Non-intrusive prompt design
   - Snooze/skip options
   - Context-aware prompting

3. **Data Collection**

   - Energy level (1-10)
   - Timestamp of rating
   - Current flow state
   - Optional mood/notes
   - Session context

4. **Network Layer**

   - Send energy update via flow_session_update
   - Include energy_level parameter
   - Queue if offline
   - Batch multiple ratings if needed

5. **Data Models**

   ```swift
   struct EnergyCheckIn {
       let session_id: String
       let energy_level: Int // 1-10
       let timestamp: Date
       let flow_state: FlowState
       let notes: String? // optional
   }

   struct EnergyPromptConfig {
       let frequency: TimeInterval
       let enabledStates: [FlowState]
       let quietHours: DateInterval?
   }
   ```

#### Server (MCP) Requirements

1. **Energy Data Collection**

   - Accept energy_level in flow_session_update
   - Validate rating range (1-10)
   - Store with timestamp and context
   - Associate with user and session
   - Track flow state at time of rating

2. **Database Schema**

   - Energy readings table:
     - id (primary key)
     - session_id (foreign key)
     - user_id (foreign key)
     - energy_level (integer 1-10)
     - timestamp
     - flow_state
     - notes (optional)
   - User energy patterns table

3. **Pattern Analysis**

   - Aggregate energy data by:
     - Time of day
     - Day of week
     - Flow state
     - Session intensity
     - Session duration
   - Identify energy trends
   - Calculate baselines per user

4. **Recommendation Engine**
   - Suggest optimal session times
   - Recommend intensity based on energy
   - Predict energy dips
   - Personalized insights
   - Adaptive recommendations

#### Critical Integration Points

1. **Prompt Timing**

   - Don't interrupt peak flow states
   - Respect user preferences
   - Consider time since last prompt
   - Adapt to user response patterns

2. **Data Quality**

   - Handle missing check-ins
   - Validate reasonable patterns
   - Account for time zones
   - Filter outlier readings

3. **Privacy Considerations**

   - Energy data is sensitive
   - User controls over data retention
   - Anonymized analytics only
   - Clear data usage policies

4. **Analytics Pipeline**
   - Real-time pattern detection
   - Daily/weekly aggregation
   - Machine learning readiness
   - Export capabilities

#### Discussion Notes

**Key Questions:**

1. **Prompt Frequency & Timing**

   - How often to prompt? (every 15/30/60 min?)
   - Should frequency adapt to session length?
   - Prompt during all states or specific ones?
   - How to handle ignored prompts?

2. **Rating Interface**

   - Numeric scale (1-10) or descriptive?
   - Visual metaphor (battery, wave, flame)?
   - Quick tap vs detailed form?
   - Include mood or just energy?

3. **User Experience**

   - How intrusive should prompts be?
   - Push notifications vs in-app only?
   - Vibration/sound for prompts?
   - Gamification elements?

4. **Data Analysis**

   - What patterns are most valuable?
   - How much history to analyze?
   - Real-time vs batch processing?
   - Individual vs aggregate insights?

5. **Recommendations**
   - When to surface insights?
   - How prescriptive should they be?
   - Adapt to user feedback?
   - Integration with session planning?

---

### Scenario 5: Complete flow session with summary

**Location**: Lines 73-85 in flow_session_management.feature  
**Tags**: `@flow-completion @mcp-summary`

#### Scenario Description

When a flow session timer reaches completion, the app calls the server to finalize the session. The server calculates comprehensive metrics and generates a summary.

#### Client (iOS App) Requirements

1. **Completion UI**

   - Session complete notification/screen
   - Summary display with key metrics
   - Productivity rating input (1-10)
   - Reflection/notes input field
   - Share or save options

2. **Timer Management**

   - Detect session completion
   - Handle early completion option
   - Final state transition
   - Completion sound/vibration
   - Prevent accidental over-runs

3. **Data Collection**

   - Capture final productivity rating
   - Optional session notes
   - Mood/satisfaction rating
   - What worked well
   - What could improve

4. **Network Layer**

   - Call flow_session_complete tool
   - Include session_id
   - Send productivity rating
   - Include any final notes
   - Handle completion confirmation

5. **Data Models**

   ```swift
   struct SessionCompletion {
       let session_id: String
       let productivity_rating: Int // 1-10
       let notes: String?
       let completed_early: Bool
       let completion_time: Date
   }

   struct SessionSummary {
       let total_duration: TimeInterval
       let active_duration: TimeInterval // excluding pauses
       let energy_pattern: [EnergyDataPoint]
       let state_durations: [FlowState: TimeInterval]
       let pause_count: Int
       let average_energy: Double
   }
   ```

#### Server (MCP) Requirements

1. **Completion Processing**

   - flow_session_complete tool implementation
   - Validate session can be completed
   - Calculate final metrics
   - Store completion data
   - Generate summary

2. **Metrics Calculation**

   - Total session duration
   - Active time (minus pauses)
   - Time per flow state
   - Energy level patterns
   - Pause frequency/duration
   - Productivity score

3. **Database Updates**

   - Mark session as completed
   - Store final timestamp
   - Save productivity rating
   - Archive session data
   - Update user statistics

4. **Summary Generation**
   - Aggregate all session data
   - Calculate derived metrics
   - Format for client display
   - Include trend comparisons
   - Generate insights

#### Critical Integration Points

1. **Data Completeness**

   - Ensure all pending updates processed
   - Handle missing energy readings
   - Validate state transitions complete
   - Account for network delays

2. **Metric Accuracy**

   - Server-authoritative timing
   - Consistent pause handling
   - Accurate state durations
   - Valid energy averages

3. **Session Finalization**

   - No further updates allowed
   - Archive for history
   - Update user aggregates
   - Trigger notifications

4. **Summary Access**
   - Immediate availability
   - Historical access via flow_session_history
   - Export capabilities
   - Privacy controls

#### Discussion Notes

**Key Questions:**

1. **Completion Triggers**

   - Timer-based auto-complete?
   - Manual completion allowed?
   - Early completion handling?
   - Overtime sessions?

2. **Summary Content**

   - What metrics are most valuable?
   - How much detail to show?
   - Comparison to previous sessions?
   - Personalized insights?

3. **User Reflection**

   - Required or optional rating?
   - Guided reflection prompts?
   - Quick vs detailed feedback?
   - When to prompt for reflection?

4. **Post-Session Flow**

   - Immediate next session option?
   - Rest period enforcement?
   - Share achievements?
   - Schedule next session?

5. **Data Visualization**
   - Charts and graphs?
   - Simple metrics display?
   - Energy pattern visualization?
   - State progression replay?

---

### Scenario 6: Handle unexpected interruptions

**Location**: Lines 87-104 in flow_session_management.feature  
**Tags**: `@flow-interruption`

#### Scenario Description

Handle urgent interruptions (phone calls, emergencies) gracefully with an "Emergency Pause" feature that preserves session state and offers recovery options upon return.

#### Client (iOS App) Requirements

1. **Emergency UI**

   - Prominent "Emergency Pause" button
   - Different visual treatment than regular pause
   - Quick access (minimal taps)
   - Interruption reason selector
   - Auto-save all current data

2. **Interruption Handling**

   - Immediate state preservation
   - Log interruption type/reason
   - Stop all timers instantly
   - Queue any pending updates
   - Display interruption duration

3. **Recovery Options UI**

   - Clear recovery screen on return
   - Three options presented:
     - Continue Session (resume)
     - Restart Phase (restart current state)
     - End Session (complete early)
   - Time since interruption display
   - Context reminder (what you were doing)

4. **State Management**

   - Preserve exact session state
   - Track interruption timestamp
   - Calculate time away
   - Maintain flow context
   - Handle extended interruptions

5. **Data Models**

   ```swift
   enum InterruptionType: String {
       case phone_call
       case emergency
       case app_crash
       case notification
       case external
   }

   struct InterruptionEvent {
       let session_id: String
       let type: InterruptionType
       let timestamp: Date
       let flow_state: FlowState
       let recovery_option: RecoveryOption?
   }

   enum RecoveryOption: String {
       case continue_session
       case restart_phase
       case end_session
   }
   ```

#### Server (MCP) Requirements

1. **Interruption Logging**

   - New interruption event type
   - Store interruption details
   - Track interruption patterns
   - Associate with session
   - Analytics categorization

2. **Recovery Support**

   - Accept recovery option choice
   - Adjust session based on option:
     - Continue: Resume with gap
     - Restart: Reset current state timer
     - End: Complete with partial data
   - Maintain data integrity

3. **Pattern Analysis**

   - Track interruption frequency
   - Common interruption times
   - Impact on session completion
   - User-specific patterns
   - Predictive interruption risk

4. **Adaptive Recommendations**
   - Learn from interruption data
   - Suggest better session times
   - Recommend shorter sessions if needed
   - Adjust intensity suggestions
   - Personalize based on patterns

#### Critical Integration Points

1. **Quick Response**

   - Emergency pause must be instant
   - No network dependency for pause
   - Local state preservation first
   - Sync when possible

2. **Recovery Logic**

   - Different from regular pause/resume
   - State-specific recovery options
   - Time-based recovery suggestions
   - Context preservation

3. **Analytics Value**

   - Interruption patterns inform scheduling
   - Correlation with completion rates
   - Environmental factors
   - User behavior insights

4. **Edge Cases**
   - Multiple interruptions
   - Very long interruptions (hours/days)
   - Interruption during pause
   - Network failure during recovery

#### Discussion Notes

**Key Questions:**

1. **Emergency vs Regular Pause**

   - Visual differentiation needed?
   - Different handling logic?
   - Separate analytics tracking?
   - Different time limits?

2. **Recovery Options**

   - Always show all three options?
   - Smart default based on time away?
   - Add "Start New Session" option?
   - Memory aids for context?

3. **Interruption Types**

   - Predefined categories sufficient?
   - Track source (call, text, app)?
   - iOS CallKit integration?
   - Notification type detection?

4. **Time Thresholds**

   - Max interruption before auto-end?
   - Different thresholds per option?
   - Warning before auto-actions?
   - User-configurable limits?

5. **Learning System**
   - How to use interruption data?
   - Preemptive suggestions?
   - Calendar integration for busy times?
   - Do Not Disturb automation?

---

### Scenario 7: Customize flow session parameters

**Location**: Lines 105-117 in flow_session_management.feature  
**Tags**: `@flow-customization`

#### Scenario Description

Users can customize various aspects of their flow experience including notifications, state transitions, energy check-ins, sounds, themes, and focus modes.

#### Client (iOS App) Requirements

1. **Settings UI Structure**

   - Flow customization section in settings
   - Grouped settings by category
   - Preview/test options for each setting
   - Save/cancel functionality
   - Reset to defaults option

2. **Notification Settings**

   - Style selector: Sound/Vibration/Visual/None
   - Custom sound picker
   - Vibration pattern options
   - Visual notification preview
   - Per-state notification config

3. **State Transition Settings**

   - Mode selector: Automatic/Manual/Hybrid
   - Timing adjustments for automatic
   - Confirmation prompts for manual
   - Hybrid rules configuration
   - Transition notifications

4. **Energy Check-in Settings**

   - Frequency options: 15/30/60 min/Manual
   - Enable/disable per flow state
   - Prompt style customization
   - Snooze duration settings
   - Quick rating vs detailed

5. **Audio/Visual Settings**

   - Background sound options:
     - Nature sounds library
     - White/pink/brown noise
     - Silence option
     - Custom audio import
   - Visual themes:
     - Tidal (ocean-inspired)
     - Minimal (distraction-free)
     - Dark mode
     - Light mode
   - Theme scheduling

6. **Focus Mode Integration**

   - iOS Do Not Disturb integration
   - Airplane mode automation
   - App notification blocking
   - Contact exceptions
   - Schedule-based rules

7. **Data Models**

   ```swift
   struct FlowCustomization {
       let notification_style: NotificationStyle
       let state_transition_mode: TransitionMode
       let energy_checkin_frequency: TimeInterval?
       let background_sound: BackgroundSound
       let visual_theme: Theme
       let focus_mode_enabled: Bool
       let focus_mode_settings: FocusSettings?
   }

   enum NotificationStyle {
       case sound(SystemSound)
       case vibration(VibrationPattern)
       case visual
       case none
       case combined([NotificationStyle])
   }

   enum TransitionMode {
       case automatic(timings: StateTimings)
       case manual
       case hybrid(rules: HybridRules)
   }
   ```

#### Server (MCP) Requirements

1. **Settings Storage**

   - User preferences table
   - Setting versioning
   - Default values management
   - Cross-device sync support
   - Preference inheritance

2. **Preference Validation**

   - Validate setting combinations
   - Check value ranges
   - Ensure compatibility
   - Handle deprecated settings
   - Migration support

3. **Sync Management**

   - Store preferences per user
   - Handle conflicts
   - Timestamp-based resolution
   - Device-specific overrides
   - Offline setting changes

4. **Analytics Integration**
   - Track setting usage
   - Correlate with completion rates
   - Popular configurations
   - A/B testing support
   - Recommendation basis

#### Critical Integration Points

1. **iOS System Integration**

   - Do Not Disturb API
   - Sound/haptic permissions
   - Background audio sessions
   - Focus mode compatibility
   - Notification permissions

2. **Performance Impact**

   - Background sounds battery usage
   - Visual theme rendering
   - Notification scheduling
   - Settings caching
   - Quick access needs

3. **User Experience**

   - Settings complexity balance
   - Sensible defaults
   - Progressive disclosure
   - Help/explanation text
   - Setting previews

4. **Cross-Platform**
   - Setting compatibility
   - Platform-specific features
   - Graceful degradation
   - Feature detection
   - Sync considerations

#### Discussion Notes

**Key Questions:**

1. **Setting Granularity**

   - How many options to expose?
   - Basic vs advanced modes?
   - Per-session overrides?
   - Preset configurations?

2. **Sound Management**

   - Built-in sounds only or custom?
   - Licensing for nature sounds?
   - Offline sound storage?
   - Sound mixing options?

3. **Theme Design**

   - How many themes needed?
   - Custom theme creation?
   - Seasonal themes?
   - Accessibility themes?

4. **Focus Mode**

   - Deep iOS integration level?
   - Auto-enable during flows?
   - Exception handling?
   - Emergency override?

5. **Defaults & Presets**
   - Suggested configurations?
   - Productivity profiles?
   - Time-based defaults?
   - Learning from usage?

---

### Scenario 8: Manage multiple flow sessions

**Location**: Lines 119-132 in flow_session_management.feature  
**Tags**: `@multi-session`

#### Scenario Description

When users want to start additional flow sessions in a day, the app provides smart recommendations based on energy depletion, time gaps, daily patterns, and warns against overextension.

#### Client (iOS App) Requirements

1. **Pre-Session UI**

   - Previous session summary display
   - Recommendation cards/banners
   - Warning indicators for overextension
   - Rest timer since last session
   - Daily session count display

2. **Recommendation Display**

   - Energy-based intensity suggestions
   - Suggested rest duration
   - Optimal time indicators
   - Daily pattern visualization
   - Override options with warnings

3. **Smart Recommendations**

   - Lower intensity after draining sessions
   - Enforce minimum rest periods
   - Show optimal times from history
   - Align with tidal rhythms
   - Personalized suggestions

4. **Warning System**

   - Overextension alerts
   - Fatigue risk indicators
   - Session limit warnings
   - Energy depletion notices
   - Override confirmation

5. **Session Linking**

   - Daily session chain view
   - Cumulative metrics display
   - Energy trend visualization
   - Pattern recognition
   - Daily summary preview

6. **Data Models**

   ```swift
   struct SessionRecommendation {
       let suggested_intensity: FlowIntensity
       let reason: String
       let min_rest_remaining: TimeInterval?
       let optimal_start_times: [Date]
       let warnings: [OverextensionWarning]
   }

   struct DailyPattern {
       let sessions: [FlowSession]
       let total_flow_time: TimeInterval
       let energy_trend: EnergyTrend
       let recovery_needed: TimeInterval
   }

   enum OverextensionWarning {
       case too_many_sessions(count: Int)
       case insufficient_rest(needed: TimeInterval)
       case energy_depleted
       case late_hour
   }
   ```

#### Server (MCP) Requirements

1. **Recommendation Engine**

   - Analyze previous session data
   - Calculate energy depletion
   - Determine rest requirements
   - Identify optimal times
   - Generate warnings

2. **Pattern Analysis**

   - Daily session patterns
   - Weekly trends
   - Energy recovery rates
   - Performance correlations
   - Personalized thresholds

3. **Business Rules**

   - Maximum sessions per day
   - Minimum rest between sessions
   - Intensity step-down rules
   - Time-based restrictions
   - Override permissions

4. **Data Aggregation**
   - Link sessions by day
   - Calculate cumulative metrics
   - Track energy progression
   - Monitor recovery patterns
   - Build user profile

#### Critical Integration Points

1. **Real-time Analysis**

   - Immediate recommendation generation
   - Current energy state calculation
   - Dynamic rest requirements
   - Live pattern matching

2. **Safety Mechanisms**

   - Prevent burnout
   - Enforce healthy limits
   - Gradual intensity reduction
   - Recovery monitoring

3. **Personalization**

   - Learn individual limits
   - Adapt to user patterns
   - Respect preferences
   - Balance safety/flexibility

4. **Data Requirements**
   - Session history access
   - Energy tracking data
   - Recovery patterns
   - Time preferences

#### Discussion Notes

**Key Questions:**

1. **Session Limits**

   - Hard limit on daily sessions?
   - Flexible based on intensity?
   - User-configurable limits?
   - Medical/safety guidelines?

2. **Rest Calculations**

   - Fixed rest periods?
   - Intensity-based recovery?
   - Energy-based formulas?
   - Individual adaptation?

3. **Override Behavior**

   - Allow all overrides?
   - Require acknowledgment?
   - Track override patterns?
   - Disable after X overrides?

4. **Recommendation Logic**

   - How prescriptive?
   - Multiple options presented?
   - Explain reasoning?
   - Learn from choices?

5. **Daily Patterns**
   - Define "day" boundaries?
   - Sleep schedule integration?
   - Weekend differences?
   - Timezone handling?

---

### Scenario 9: View flow session history

**Location**: Lines 134-143 in flow_session_management.feature  
**Tags**: `@flow-analytics`

#### Scenario Description

Users can access their flow session history to view past sessions, energy levels, and aggregate statistics. Individual session details are available for review.

#### Client (iOS App) Requirements

1. **History List UI**

   - Chronological session list
   - Filter/sort options
   - Search functionality
   - Date range selector
   - Pull-to-refresh

2. **Session List Items**

   - Date and time display
   - Duration indicator
   - Intensity badge
   - Completion status icon
   - Energy trend sparkline

3. **Filtering & Sorting**

   - By date range
   - By intensity level
   - By completion status
   - By duration
   - By tide type

4. **Detail View**

   - Full session metrics
   - State progression timeline
   - Energy level graph
   - Pause/interruption events
   - Notes and reflections

5. **Statistics Dashboard**

   - Total sessions count
   - Total flow time
   - Average session duration
   - Completion rate
   - Energy patterns

6. **Data Visualization**

   - Weekly/monthly views
   - Calendar heat map
   - Trend charts
   - Progress indicators
   - Comparative analysis

7. **Data Models**

   ```swift
   struct SessionHistoryItem {
       let session_id: String
       let date: Date
       let duration: TimeInterval
       let intensity: FlowIntensity
       let completion_status: CompletionStatus
       let average_energy: Double
       let tide_name: String
   }

   struct SessionStatistics {
       let total_sessions: Int
       let total_flow_time: TimeInterval
       let average_duration: TimeInterval
       let completion_rate: Double
       let sessions_by_intensity: [FlowIntensity: Int]
       let time_period: DateInterval
   }
   ```

#### Server (MCP) Requirements

1. **History Query Tool**

   - flow_session_history implementation
   - Pagination support
   - Flexible filtering
   - Sort options
   - Date range queries

2. **Data Aggregation**

   - Calculate statistics
   - Generate summaries
   - Compute trends
   - Energy averaging
   - Performance metrics

3. **Query Optimization**

   - Indexed queries
   - Cached aggregates
   - Efficient pagination
   - Minimal data transfer
   - Progressive loading

4. **Data Export**
   - CSV export option
   - JSON data format
   - PDF reports
   - Share functionality
   - Privacy controls

#### Critical Integration Points

1. **Performance**

   - Fast list loading
   - Smooth scrolling
   - Efficient queries
   - Cache management
   - Background updates

2. **Data Consistency**

   - Sync with server
   - Handle conflicts
   - Update notifications
   - Offline access
   - Data integrity

3. **Privacy**

   - User data only
   - Secure queries
   - Export controls
   - Deletion rights
   - Audit trail

4. **Scalability**
   - Years of history
   - Thousands of sessions
   - Quick access
   - Storage limits
   - Archive options

#### Discussion Notes

**Key Questions:**

1. **History Depth**

   - How far back to show?
   - Archive old sessions?
   - Storage implications?
   - Performance limits?

2. **Detail Level**

   - Basic vs detailed view?
   - All data accessible?
   - Progressive disclosure?
   - Export everything?

3. **Visualization**

   - Which charts/graphs?
   - Interactive elements?
   - Comparison features?
   - Insights generation?

4. **Organization**

   - Group by day/week/month?
   - Tide-based grouping?
   - Project associations?
   - Custom categories?

5. **Offline Access**
   - Cache how much data?
   - Sync strategy?
   - Conflict resolution?
   - Storage management?

---

### Scenario 10: Handle system interruptions

**Location**: Lines 146-158 in flow_session_management.feature  
**Tags**: `@edge-cases @oauth @mcp-resilience`

#### Scenario Description

Handle various system-level interruptions (app crashes, network loss, device restarts, token expiration, server timeouts) with automatic recovery using OAuth tokens and MCP session persistence.

#### Client (iOS App) Requirements

1. **Persistent Storage**

   - OAuth tokens in Keychain
   - Session ID in UserDefaults
   - Current state in CoreData
   - Queue in SQLite
   - Timestamps for recovery

2. **Crash Recovery**

   - App launch state detection
   - Check for active sessions
   - Restore UI to last state
   - Resume timers correctly
   - Show recovery status

3. **Network Resilience**

   - Offline queue implementation
   - Retry logic with backoff
   - Network reachability monitoring
   - Automatic sync on reconnect
   - Conflict resolution

4. **Token Management**

   - Token expiry detection
   - Automatic refresh flow
   - Queue requests during refresh
   - Update all pending requests
   - Handle refresh failures

5. **State Recovery**

   - Query server for truth
   - Reconcile local/remote
   - Resume from last known
   - Handle time gaps
   - Preserve user context

6. **Data Models**

   ```swift
   struct RecoveryState {
       let session_id: String?
       let last_known_state: FlowState?
       let last_sync_time: Date
       let pending_updates: [PendingUpdate]
       let recovery_attempts: Int
   }

   struct PendingUpdate {
       let id: UUID
       let type: UpdateType
       let payload: Data
       let timestamp: Date
       let retry_count: Int
   }

   enum SystemInterruption {
       case app_crash
       case network_loss
       case device_restart
       case token_expired
       case server_timeout
   }
   ```

#### Server (MCP) Requirements

1. **Session Persistence**

   - Long-lived session records
   - State snapshots
   - Recovery endpoints
   - Idempotent operations
   - Conflict handling

2. **Token Handling**

   - Grace period for expired tokens
   - Refresh token validation
   - Concurrent token management
   - Session continuity
   - Security audit trail

3. **Recovery API**

   - flow_session_recover tool
   - Accept time gaps
   - Validate session ownership
   - Return full state
   - Handle duplicates

4. **Resilience Features**
   - Request deduplication
   - Timestamp reconciliation
   - State conflict resolution
   - Graceful degradation
   - Recovery analytics

#### Critical Integration Points

1. **iOS Lifecycle**

   - Background task registration
   - State preservation/restoration
   - Crash reporting integration
   - Background fetch
   - Silent push notifications

2. **Network Layer**

   - URLSession configuration
   - Background session support
   - Reachability monitoring
   - Request prioritization
   - Timeout handling

3. **Data Integrity**

   - Atomic operations
   - Transaction support
   - Consistency checks
   - Data validation
   - Audit logging

4. **Recovery Strategy**
   - Exponential backoff
   - Max retry limits
   - Circuit breakers
   - Fallback options
   - User notification

#### Discussion Notes

**Key Questions:**

1. **Recovery Windows**

   - How long to attempt recovery?
   - Session expiry after interruption?
   - Maximum time gap allowed?
   - User notification timing?

2. **Data Consistency**

   - Local vs server priority?
   - Conflict resolution rules?
   - Missing data handling?
   - Duplicate prevention?

3. **User Experience**

   - Show recovery process?
   - Automatic vs manual recovery?
   - Progress indicators?
   - Failure messaging?

4. **Background Limits**

   - iOS background time constraints?
   - Battery impact considerations?
   - Network usage limits?
   - Storage quotas?

5. **Edge Cases**
   - Multiple device conflicts?
   - Timezone changes during interruption?
   - Account switches?
   - App updates during session?

---

## Summary

We have reviewed all 10 scenarios from the flow_session_management.feature file. Each scenario has been documented with:

1. **Client (iOS App) Requirements** - UI components, state management, network layer, and data models
2. **Server (MCP) Requirements** - API implementations, database schemas, business logic, and analytics
3. **Critical Integration Points** - Key technical challenges and integration requirements
4. **Discussion Notes** - Important questions for the team to address

### Key Themes Across All Scenarios:

1. **State Management** - Complex state synchronization between client and server
2. **User Experience** - Balance between features and simplicity
3. **Performance** - Optimization needed for history, real-time updates, and offline support
4. **Resilience** - Comprehensive error handling and recovery mechanisms
5. **Personalization** - Learning from user patterns to provide better recommendations

### Next Steps:

- Review remaining feature files (tides_app.feature, reporting_analytics.feature, etc.)
- Prioritize scenarios for implementation
- Define technical architecture based on requirements
- Create detailed API specifications
- Design database schemas
- Plan iOS app architecture
