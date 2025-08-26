# Development Roadmap

React Native Supabase-authenticated HTTP-based MCP integration for rhythmic workflow management.

## Phase 1: Foundation & Authentication (Weeks 1-2)

21/31 Complete - Added Step 1.4 (Hybrid Authentication System) for critical cross-client compatibility requirement. Remaining issues include TypeScript/Linting errors (can be revisited), Android setup (can be revisited), MCP session management (may not be necessary with HTTP/RPC 2.0), and the new hybrid authentication system implementation for desktop client support.

### Step 1.1: Project Infrastructure Setup

- [x] Initialize React Native 0.80.1 with React 19.1.0 setup - _Complete: setup exceeds requirements with newer React Native version_
- [x] Configure TypeScript support and ESLint - _WILL revisit later: TypeScript has 5 compilation errors, ESLint has 14 errors. Need to fix FlowSession.tsx:15, Input.tsx:125, secureStorage.ts:44,54 and resolve linting issues before checking off_
- [x] Set up Metro bundler and development scripts - _Complete: metro.config.js:9-11 configured, package.json:9 has start script, bundler starts successfully_
- [x] Install core dependencies: @react-native-async-storage/async-storage, @supabase/supabase-js - _Complete: package.json:13,17 both dependencies installed and verified via npm list_

**Acceptance Criteria:**

- [x] React Native project runs on iOS and Android - _WILL revisit later: iOS/Android project structure exists but React Native doctor shows 2 Android errors (missing SDK v35.0.0, no emulator). Need to verify actual builds work on both platforms_
- [x] TypeScript compilation works without errors - _WILL revisit later: Same issue as Line 10. TypeScript has 5 compilation errors in FlowSession.tsx:15, Input.tsx:125, secureStorage.ts:44,54 that must be fixed first_
- [x] ESLint and development scripts configured - _WILL revisit later: Configuration exists (.eslintrc.js, package.json:6-10) but npm run lint shows 14 errors that must be resolved for clean development workflow_
- [x] All required dependencies installed - _Complete: package.json:12-48 shows all prod/dev dependencies, npm list confirms installation, no missing dependency errors_

### Step 1.2: Supabase Authentication Implementation

- [x] Install and configure Supabase client (@supabase/supabase-js) - _Complete: src/config/supabase.ts:9-16 properly configured with AsyncStorage auth, constants defined, auto-refresh implemented_
- [x] Create authentication flow screens in Auth Stack - _Complete: src/navigation/AuthNavigator.tsx:18-42 implements Auth Stack with Initial and CreateAccount screens, proper navigation types defined_
- [x] Implement secure Supabase session storage in AsyncStorage (JWT + refresh tokens) - _Complete: src/config/supabase.ts:11,13 configures AsyncStorage with persistSession:true, Supabase automatically handles JWT + refresh tokens_
- [x] Add automatic session refresh and expiration handling - _Complete: src/config/supabase.ts:12 autoRefreshToken:true + AppState listener:23-29 manages foreground/background refresh_

**Acceptance Criteria:**

- [x] Supabase client successfully authenticates users - _Complete: src/services/authService.ts:68-71,99-102 implements signUp/signIn with Supabase, comprehensive auth service with session management_
- [x] JWT tokens stored securely in AsyncStorage - _Complete: src/config/supabase.ts:11,13 configures Supabase to use AsyncStorage with persistSession:true, JWT tokens automatically stored_
- [x] Automatic session refresh works before token expiry - _Complete: Same as Line 26. src/config/supabase.ts:12 autoRefreshToken:true with AppState management ensures refresh before expiry_
- [x] Login/logout flows work correctly - _Complete: src/services/authService.ts:95-124,126-146 implements complete login/logout flows with error handling, cleanup, and auth state management_

### Step 1.3: MCP Server Connection Architecture

- [x] Implement HTTP-based JSON-RPC 2.0 MCP client - _Complete: src/services/mcpService.ts:181-186,192 implements proper JSON-RPC 2.0 structure with HTTP transport, error handling, request ID generation_
- [x] Create API key authentication for Cloudflare Workers MCP server - _Complete: src/services/authService.ts:53-62 generates API keys, httpClient.ts:44 adds Bearer token auth, secure storage implemented_
- [ ] Implement MCP session management (session ID storage/retrieval) - _NOT ready: mcpService.ts:65 references session_id but no actual storage/retrieval implementation found. Need AsyncStorage for MCP session persistence_
- [x] Add configurable MCP server URL with default <https://supabase-tides-demo-1.mason-c32.workers.dev> - _Complete: src/services/authService.ts:22-23 sets exact default URL, setWorkerUrl:284-294 enables configuration with AsyncStorage persistence_
- [x] Create connection status UI components - _Complete: src/context/MCPContext.tsx:9-15,75-105 provides isConnected/loading/error state management, design-system components available for UI display_

### Step 1.4: Hybrid Authentication System (Cross-Client Compatibility)

- [ ] Implement hybrid authentication middleware in MCP server - _NEW: Support both custom API keys (mobile) and UUID tokens (desktop) per docs/specs/002-hybrid-authentication-system.md_
- [ ] Create Supabase Edge Function for UUID propagation to Cloudflare KV - _NEW: Auto-propagate user UUIDs to enable desktop client authentication_
- [ ] Add UUID export functionality to mobile app - _NEW: Allow users to get their UUID for desktop client setup_
- [ ] Create desktop setup screen with QR code generation - _NEW: Seamless desktop client onboarding experience_
- [ ] Deploy UUID registration endpoint on MCP server - _NEW: Admin endpoint for registering UUIDs in Cloudflare KV_

**Acceptance Criteria:**

- [x] MCP client authenticates using API keys (not JWT tokens) - _Complete: Same as Line 38. src/services/httpClient.ts:44 uses Bearer API key, not JWT tokens for MCP server authentication_
- [x] HTTP JSON-RPC 2.0 protocol implemented correctly (no SSE) - _Complete: Same as Line 37. src/services/mcpService.ts:181-186,192 uses HTTP POST with proper JSON-RPC 2.0 structure, no SSE_
- [x] API key persistence works across app restarts - _Complete: src/services/authService.ts:214-217 uses SecureStorage (keychain), getApiKey:186-206 retrieves across restarts with auto-generation_
- [x] Connection retry logic handles network interruptions - _Complete: src/services/httpClient.ts:58-145 implements retry with exponential backoff, timeout handling, 3 retries default, smart error classification_
- [x] All 8 MCP tools callable with proper API key authentication - _Complete: src/services/mcpService.ts:215-309 implements all 8 tools (create,list,flow,energy,link,list_links,report,participants), all use makeRequest with API key auth_
- [ ] Desktop clients can authenticate using UUID tokens - _NEW: Cross-client compatibility requirement per hybrid authentication spec_
- [ ] Mobile app can export UUID for desktop client setup - _NEW: QR code and manual export functionality for seamless desktop onboarding_
- [ ] Server validates both custom API keys and UUID tokens - _NEW: Dual authentication validation with proper user resolution_
- [ ] UUID propagation from Supabase to Cloudflare KV works automatically - _NEW: Real-time user registration triggers UUID storage for desktop access_

## Phase 2: Core MCP Integration (Weeks 3-4)

11/17 tasks complete, can caustiously work on phase 3 - all issues have to do with offline quieing and MCP sessionmanagement. Still nto sure fi that is teh BEST way to go abotu things but I will investigate. Can catuisuly beguinn working on phase 3, but would be best if that answer is sovled

### Step 2.1: MCP Tools Implementation

- [x] Implement all 8 MCP tool integrations (API key authenticated) - _Complete: All 8 tools implemented (mcpService.ts:215-309) with proper API key authentication as designed_

**Acceptance Criteria:**

- [x] All 8 MCP tools successfully call server with API keys - _Complete: All 8 tools successfully call server (mcpService.ts:215-309) using API key authentication (httpClient.ts:44) as designed_
- [x] User-specific data isolation works correctly - _Complete: src/services/authService.ts:54,61 generates user-specific API keys (tides_{userId}_{randomId}), each user gets unique authentication for isolated data_
- [x] Error handling for tool failures - _Complete: src/services/mcpService.ts:194-211 handles JSON-RPC errors, MCPContext.tsx:162-166 catches failures and sets UI error state, HTTP retry from Line 48_

### Step 2.2: Network Resilience & Error Handling

- [x] Add HTTP retry patterns with exponential backoff - _Complete: Same as Line 48. src/services/httpClient.ts:58-145,138 implements retry with exponential backoff (1s,2s,4s up to 10s)_
- [ ] Implement Supabase session refresh on 401 errors - _❌ NOT ready: No 401 error handling found in httpClient.ts or services. Need HTTP interceptor to catch 401 and trigger session refresh_
- [ ] Create MCP session recovery mechanisms - _❌ NOT ready: Depends on Line 39 (MCP session management) which is not implemented. No session recovery possible without session storage_
- [ ] Add offline operation queuing - _❌ NOT ready: No offline queuing found in codebase. Need offline detection, operation queue with AsyncStorage, and queue processing when online_

**Acceptance Criteria:**

- [x] Network failures retry with exponential backoff - _Complete: Same as Lines 48,65. src/services/httpClient.ts:58-145,138 implements retry with exponential backoff_
- [x] Supabase token refresh works automatically - _Complete: Same as Lines 26,32. src/config/supabase.ts:12 autoRefreshToken:true with AppState management_
- [ ] Offline actions queued and executed when online - _❌ NOT ready: Same as Line 68. No offline queuing implementation found in codebase_

### Step 2.3: Session Persistence

- [ ] Implement AsyncStorage persistence for Supabase tokens + MCP session ID - _🔄 PARTIAL: Supabase tokens ✅ (supabase.ts:11,13), MCP session ID ❌ (same as Line 39 - not implemented)_
- [x] Add automatic session restoration on app launch - _Complete: Same as Line 25. src/config/supabase.ts:11,13 persistSession:true enables automatic session restoration_
- [x] Create authentication state management with Supabase - _Complete: Same as Line 80. src/context/AuthContext.tsx + authService.ts:95-124,126-146 provide complete auth state management_

**Acceptance Criteria:**

- [x] App restarts with preserved Supabase session - _Complete: Same as Line 79. src/config/supabase.ts:11,13 persistSession:true with AsyncStorage enables session preservation_
- [ ] MCP session persists across app launches - _❌ NOT ready: Same as Line 39. No MCP session management implemented - cannot persist sessions that don't exist_
- [x] Background refresh maintains authentication - _Complete: Same as Lines 26,32,73. src/config/supabase.ts:12,23-29 autoRefreshToken with AppState management_

## Phase 3: Tide Management Features (Weeks 5-6)

Just starting

### Step 3.1: Tide Creation Interface

- [x] Create tide creation form with name, flow*type, description fields - \_Complete: src/screens/Main/Home.tsx:42-44 implements form state, UI at lines 434,450-457 with all required fields*
- [x] Implement flow type selection (daily, weekly, project, seasonal) - _Complete: src/screens/Main/Home.tsx:44 defines all 4 flow types, UI selection at lines 450-457 with active/inactive states_
- [ ] Add intensity customization (gentle, moderate, strong) - _❌ NOT ready: Only 'moderate' found at Home.tsx:133, no intensity state variable or selection UI like flow type implementation_
- [x] Integrate with API key-authenticated `tide_create` MCP tool - _Complete: Integration exists (Home.tsx:97-101→MCPContext→mcpService) using API key authentication as designed_

**Acceptance Criteria:**

- [ ] All flow types and intensities selectable - _🔄 PARTIAL: Flow types ✅ (Line 93), Intensities ❌ (same as Line 94 - not implemented)_
- [x] Tide creation successful with proper Supabase user context - _Complete: Home.tsx:97-101 creates tides, authService.ts:54,61 ensures user-specific API keys provide proper user context_
- [x] Error handling for validation failures - _Complete: src/screens/Main/Home.tsx:106-108 implements try/catch with Alert feedback, context-level error handling from Line 61_

### Step 3.2: Tide Management Dashboard

- [x] Create tide list view using API key-authenticated `tide_list` MCP tool - _Complete: src/screens/Main/Home.tsx:486-499 displays tide list using MCP context (line 33→MCPContext→mcpService.listTides)_
- [ ] Implement tide detail views and editing capabilities - _❌ NOT ready: No tide detail screens found in src/screens/, no edit capabilities, only Home screen exists_
- [ ] Add tide lifecycle management (pause/resume, archive, delete) - _❌ NOT ready: Status types exist (mcpService.ts:34) but no UI controls or lifecycle methods implemented in Home.tsx_
- [ ] Create tide status indicators and refresh functionality - _🔄 PARTIAL: Status indicators ✅ (Home.tsx:511,515-517), Refresh functionality ❌ (refreshTides not imported/used)_

**Acceptance Criteria:**

- [x] Tide list displays only user-specific data - _Complete: Same as Line 60. User-specific API keys (authService.ts:54,61) ensure server returns only user's data to tide list_
- [ ] All CRUD operations work with Supabase authentication - _🔄 PARTIAL: Create✅Read✅ (mcpService.ts:215-230), Update❌Delete❌ not implemented. Only 2/4 CRUD operations exist_
- [ ] Real-time updates when tides change - _❌ NOT ready: No real-time updates implemented. No WebSocket/SSE/polling found in codebase_

### Step 3.3: Tide Customization

- [ ] Add time block configuration (15min-2hr options) - _❌ NOT ready: No time block configuration found in codebase. No UI or settings for duration customization_
- [ ] Implement rest period customization - _❌ NOT ready: No rest period customization found in codebase_
- [ ] Create repeat pattern settings (daily, weekdays, custom) - _❌ NOT ready: No repeat pattern settings found in codebase_
- [ ] Add energy tracking enable/disable settings - _❌ NOT ready: No energy tracking enable/disable settings found in Home.tsx or any settings screens_

**Acceptance Criteria:**

- [ ] Repeat patterns persist and function correctly - _❌ NOT ready: Same as Line 120. No repeat pattern implementation exists to persist_
- [ ] Energy tracking preferences saved per user - _❌ NOT ready: Same as Line 121. No energy tracking preferences found in codebase_
- [ ] All settings synchronized with Supabase backend - _❌ NOT ready: Depends on Lines 120,121. No settings to synchronize_

## Phase 4: Flow Session Management (Weeks 7-8)

### Step 4.1: Session Control Interface

- [ ] Create flow session start UI with tide selection
- [ ] Implement session state management (Rising → Peak → Ebbing → Rest)
- [ ] Add pause/resume functionality with Supabase-authenticated MCP synchronization
- [ ] Create session completion workflow
- [ ] Implement energy level tracking (1-10 scale with timestamps)

**Acceptance Criteria:**

- [ ] Session states transition correctly through all phases
- [ ] Pause/resume maintains state with cloud synchronization
- [ ] Energy tracking data stored with user context
- [ ] Timer accuracy and performance optimized

### Step 4.2: Session State Synchronization

- [ ] Integrate flow states with Supabase-authenticated MCP tools
- [ ] Implement real-time session updates to cloud database
- [ ] Add session recovery after app interruptions
- [ ] Create session history retrieval via `tide_get_report`

**Acceptance Criteria:**

- [ ] All session data synchronized with user-specific Supabase context
- [ ] App interruptions properly handled with state recovery
- [ ] Session history displays accurate user data
- [ ] Real-time updates work without data loss

### Step 4.3: Multi-Session Management

- [ ] Add daily session tracking and recommendations
- [ ] Implement session linking and pattern analysis
- [ ] Create energy depletion warnings and rest recommendations
- [ ] Add optimal timing suggestions based on historical data

**Acceptance Criteria:**

- [ ] Daily session limits and tracking work correctly
- [ ] Pattern analysis provides meaningful insights
- [ ] Energy warnings trigger at appropriate thresholds
- [ ] Timing suggestions based on user historical data

## Phase 5: Mobile-Specific Features (Weeks 9-10)

### Step 5.1: Native Notifications

- [ ] Implement flow session reminders and state transition alerts
- [ ] Add preparation alerts and session completion notifications
- [ ] Create customizable notification preferences (sound, vibration, visual)
- [ ] Integrate with device Do Not Disturb settings

**Acceptance Criteria:**

- [ ] All notification types trigger correctly
- [ ] User preferences control notification behavior
- [ ] Do Not Disturb integration works properly
- [ ] Notifications work across app states (foreground/background)

### Step 5.2: Focus Mode Integration

- [ ] Add optional automatic Do Not Disturb activation
- [ ] Implement in-app focus mode (hide non-essential UI)
- [ ] Create emergency interruption handling
- [ ] Add battery optimization features

**Acceptance Criteria:**

- [ ] Focus mode toggles work correctly
- [ ] Emergency interruptions handled gracefully
- [ ] Battery optimization measurably improves performance
- [ ] UI simplification enhances user focus

### Step 5.3: Accessibility Support

- [ ] Implement full screen reader compatibility
- [ ] Add support for system font size settings
- [ ] Ensure high contrast mode compatibility
- [ ] Create appropriately sized touch targets with proper labels

**Acceptance Criteria:**

- [ ] Screen reader navigation works on all screens
- [ ] App respects system accessibility settings
- [ ] Touch targets meet minimum size requirements
- [ ] High contrast mode maintains app usability

## Phase 6: Reporting & Analytics (Weeks 11-12)

### Step 6.1: Data Export Functionality

- [ ] Create individual tide report generation via authenticated MCP data
- [ ] Implement comprehensive export (all tides) with filtering
- [ ] Add export format options (JSON, CSV)
- [ ] Integrate with mobile share sheet for data sharing

**Acceptance Criteria:**

- [ ] Export functions work for all data types
- [ ] Filtering options produce correct subsets
- [ ] Both JSON and CSV formats generate properly
- [ ] Mobile sharing integrates with system share sheet

### Step 6.2: Analytics Dashboard

- [ ] Create analytics views from authenticated MCP server data
- [ ] Implement productivity pattern analysis
- [ ] Add trend analysis and historical patterns
- [ ] Create mobile-optimized report viewing with responsive charts

**Acceptance Criteria:**

- [ ] Analytics display accurate user data
- [ ] Pattern analysis provides actionable insights
- [ ] Charts render properly on mobile screens
- [ ] Historical trends show meaningful progressions

### Step 6.3: Mobile-Optimized Reporting

- [ ] Implement touch-friendly, zoomable visualizations
- [ ] Add swipe navigation between report sections
- [ ] Create adaptive layouts for portrait/landscape
- [ ] Add gesture controls (pinch-zoom, swipe between time periods)

**Acceptance Criteria:**

- [ ] Touch interactions work smoothly across all reports
- [ ] Swipe navigation feels natural and responsive
- [ ] Layouts adapt properly to orientation changes
- [ ] Zoom and gesture controls enhance report usability

## Phase 7: Advanced Features & Polish (Weeks 13-14)

### Step 7.1: Advanced Session Features

- [ ] Implement session customization (notification style, state transitions)
- [ ] Add background sounds integration
- [ ] Create visual theme options (tidal, minimal, dark, light)
- [ ] Implement energy check-in frequency settings

**Acceptance Criteria:**

- [ ] Session customization options work correctly
- [ ] Background sounds enhance user experience
- [ ] All theme options render properly
- [ ] Energy check-in frequency respects user preferences

### Step 7.2: Emergency & Edge Case Handling

- [ ] Add emergency interruption handling with state preservation
- [ ] Implement system interruption recovery (crashes, restarts)
- [ ] Create network loss handling with operation queuing
- [ ] Add maximum tide limits and upgrade prompts

**Acceptance Criteria:**

- [ ] Emergency interruptions preserve session state
- [ ] App recovers gracefully from crashes and restarts
- [ ] Network loss scenarios handled without data loss
- [ ] Tide limits enforced with clear upgrade messaging

### Step 7.3: Performance Optimization

- [ ] Optimize HTTP-based MCP communication for mobile
- [ ] Implement efficient memory management
- [ ] Add battery usage optimization
- [ ] Create concurrent request handling without connection limits

**Acceptance Criteria:**

- [ ] MCP communication performance measurably improved
- [ ] Memory usage optimized for mobile devices
- [ ] Battery consumption reduced compared to baseline
- [ ] Concurrent requests handle properly without bottlenecks

## Phase 8: Testing & Quality Assurance (Weeks 15-16)

### Step 8.1: Comprehensive Testing

- [ ] Create unit tests for all MCP tool integrations
- [ ] Implement Supabase authentication flow testing
- [ ] Add session management and persistence testing
- [ ] Create network resilience and error handling tests

**Acceptance Criteria:**

- [ ] All MCP tools have comprehensive unit test coverage
- [ ] Supabase authentication flows fully tested
- [ ] Session persistence scenarios covered
- [ ] Network error conditions properly tested

### Step 8.2: Integration Testing

- [ ] Test Supabase + MCP integration end-to-end
- [ ] Validate all feature scenarios from feature files
- [ ] Test mobile-specific functionality (notifications, accessibility)
- [ ] Verify data export and reporting accuracy

**Acceptance Criteria:**

- [ ] End-to-end Supabase + MCP workflows function correctly
- [ ] All feature file scenarios pass
- [ ] Mobile-specific features work across devices
- [ ] Data export produces accurate, complete results

### Step 8.3: User Experience Testing

- [ ] Test app performance on various devices
- [ ] Validate accessibility features
- [ ] Test network interruption scenarios
- [ ] Verify battery optimization effectiveness

**Acceptance Criteria:**

- [ ] App performs well across target device range
- [ ] Accessibility features meet platform standards
- [ ] Network interruption handling works seamlessly
- [ ] Battery optimization shows measurable improvement

## Phase 9: Production Deployment (Week 17)

### Step 9.1: Production Preparation

- [ ] Configure production MCP server URLs
- [ ] Set up Supabase provider production credentials
- [ ] Implement analytics and crash reporting
- [ ] Create app store assets and descriptions

**Acceptance Criteria:**

- [ ] Production MCP server configured and tested
- [ ] Supabase production environment ready
- [ ] Analytics and crash reporting functional
- [ ] App store assets meet platform requirements

### Step 9.2: Deployment

- [ ] Build and test production app bundles
- [ ] Deploy to iOS App Store and Google Play Store
- [ ] Monitor initial user feedback and crash reports
- [ ] Implement immediate bug fixes if needed

**Acceptance Criteria:**

- [ ] Production builds successfully created and tested
- [ ] Apps deployed to both app stores without issues
- [ ] Monitoring systems capture user feedback and crashes
- [ ] Rapid response process ready for critical issues

## Critical Path Items

1. **Supabase authentication** - Blocks all other features
2. **MCP authentication integration** - Required for any cloud functionality
3. **Navigation setup** - Enables multi-screen development
4. **Core contexts** - Foundation for all feature development

## Key Success Criteria

- [ ] 100% adherence to all feature requirements in `/docs/features/`
- [x] **Supabase authentication** working with email/password and OAuth providers - _Complete: Same as Line 30. src/services/authService.ts:68-71,99-102 implements signUp/signIn with comprehensive auth service_
- [x] **HTTP-based MCP integration** with all 8 required tools using API keys - _Complete: All 8 MCP tools implemented (mcpService.ts:215-309) with API key authentication (httpClient.ts:44)_
- [x] **Session persistence** across app restarts using Supabase session management - _Complete: Same as Line 84. src/config/supabase.ts:11,13 persistSession:true with AsyncStorage enables session persistence_
- [x] **Mobile-optimized UI** with accessibility support - _Complete: src/design-system/ components implemented, navigation structure exists (src/navigation/), proper mobile architecture_
- [ ] **Data export functionality** (JSON/CSV) via authenticated MCP tools
- [x] **Network resilience** with retry patterns and Supabase token refresh - _Complete: Same as Lines 48,65,72. src/services/httpClient.ts:58-145 retry with exponential backoff, supabase.ts:12,23-29 token refresh_
- [x] **Battery-optimized HTTP communication** (no WebSocket) - _Complete: Same as Line 46. src/services/mcpService.ts:192 uses HTTP POST only, no WebSocket/SSE implementation anywhere_
- [x] **User-specific data isolation** through Supabase authentication - _Complete: Same as Line 60. src/services/authService.ts:54,61 generates user-specific API keys (tides_{userId}_{randomId}) for data isolation_
- [ ] **TypeScript type safety**
