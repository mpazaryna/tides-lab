-- Tides D1 Database Schema
-- Complete schema for user authentication, tide metadata, and analytics
-- Full tide data is stored in R2 as JSON, D1 stores metadata and indexes

-- =============================================================================
-- Core Tables
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys for authentication
CREATE TABLE IF NOT EXISTS api_keys (
  key_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tide metadata index (full data in R2)
CREATE TABLE IF NOT EXISTS tide_index (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('daily', 'weekly', 'monthly', 'project', 'seasonal')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  description TEXT, -- For search and filtering
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  flow_count INTEGER DEFAULT 0,
  last_flow DATETIME,
  total_duration INTEGER DEFAULT 0, -- Cached total flow duration in minutes
  energy_balance INTEGER DEFAULT 0, -- Cached energy score
  r2_path TEXT NOT NULL, -- Path to full JSON in R2
  -- Hierarchical tide support
  parent_tide_id TEXT REFERENCES tide_index(id),
  date_start TEXT, -- ISO date (YYYY-MM-DD) for time-bound tides
  date_end TEXT,   -- ISO date (YYYY-MM-DD) for time-bound tides  
  auto_created BOOLEAN DEFAULT FALSE, -- True if automatically created by system
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- Analytics Tables
-- =============================================================================

-- Analytics tables for performance comparison and dashboards
CREATE TABLE IF NOT EXISTS tide_analytics (
  tide_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- In minutes
  avg_intensity REAL DEFAULT 0.0, -- 1.0=gentle, 2.0=moderate, 3.0=strong
  peak_energy INTEGER DEFAULT 0,
  low_energy INTEGER DEFAULT 0,
  last_session_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tide_id) REFERENCES tide_index(id) ON DELETE CASCADE
);

-- Daily/weekly activity rollups for dashboard performance
CREATE TABLE IF NOT EXISTS user_activity_rollups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  flow_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  avg_energy REAL DEFAULT 0.0,
  active_tides INTEGER DEFAULT 0,
  completed_tides INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Flow session summary for fast queries (denormalized from R2 data)
CREATE TABLE IF NOT EXISTS flow_session_summary (
  id TEXT PRIMARY KEY,
  tide_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_date TEXT NOT NULL, -- YYYY-MM-DD
  intensity TEXT NOT NULL CHECK (intensity IN ('gentle', 'moderate', 'strong')),
  duration INTEGER NOT NULL,
  energy_delta INTEGER DEFAULT 0,
  started_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tide_id) REFERENCES tide_index(id) ON DELETE CASCADE
);

-- =============================================================================
-- Performance Indexes
-- =============================================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_tide_user ON tide_index(user_id);
CREATE INDEX IF NOT EXISTS idx_tide_user_status ON tide_index(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tide_user_flow_type ON tide_index(user_id, flow_type);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_tide_user_status_flowtype ON tide_index(user_id, status, flow_type);
CREATE INDEX IF NOT EXISTS idx_tide_user_created ON tide_index(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tide_user_lastflow ON tide_index(user_id, last_flow DESC);
CREATE INDEX IF NOT EXISTS idx_tide_user_updated ON tide_index(user_id, updated_at DESC);

-- Hierarchical tide indexes  
CREATE INDEX IF NOT EXISTS idx_tides_parent ON tide_index(parent_tide_id);
CREATE INDEX IF NOT EXISTS idx_tides_date_range ON tide_index(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_tides_auto_created ON tide_index(auto_created, flow_type);
CREATE INDEX IF NOT EXISTS idx_tides_user_date_type ON tide_index(user_id, date_start, flow_type);
CREATE INDEX IF NOT EXISTS idx_tides_user_date_auto ON tide_index(user_id, date_start, auto_created);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON tide_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_updated ON tide_analytics(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rollups_user_date ON user_activity_rollups(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_rollups_user_period ON user_activity_rollups(user_id, period_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON flow_session_summary(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_tide ON flow_session_summary(tide_id, started_at DESC);

-- =============================================================================
-- Test Data
-- =============================================================================

-- Test users (testuser001 through testuser005)
INSERT OR IGNORE INTO users (id, email, name, created_at) VALUES 
  ('testuser001', 'testuser001@example.com', 'Test User 001', datetime('now')),
  ('testuser002', 'testuser002@example.com', 'Test User 002', datetime('now')),
  ('testuser003', 'testuser003@example.com', 'Test User 003', datetime('now')),
  ('testuser004', 'testuser004@example.com', 'Test User 004', datetime('now')),
  ('testuser005', 'testuser005@example.com', 'Test User 005', datetime('now'));

-- Test API keys (tides_testuser_001 through tides_testuser_005)
-- SHA-256 hashes of the actual API key strings
INSERT OR IGNORE INTO api_keys (key_hash, user_id, name, created_at) VALUES 
  -- tides_testuser_001
  ('5f43c0ad55d6843758e22ab1eb0e43f9a9cb4832ac57dc443d12ece418bdd7bc', 'testuser001', 'Test Key 001', datetime('now')),
  -- tides_testuser_002  
  ('bd8065fc4e32e65273c2b3804120218f4c5eae765ca72eadaea8b4fee457a1df', 'testuser002', 'Test Key 002', datetime('now')),
  -- tides_testuser_003
  ('45dd5547f7a26bd6a1005c9d63f8eb57573fb96eb9ec1cbbfba213dc3f184527', 'testuser003', 'Test Key 003', datetime('now')),
  -- tides_testuser_004
  ('ff6398ef88e9cdc1ce8f60e12e9ad2939d1e921b6e7302468094a5d04cba9545', 'testuser004', 'Test Key 004', datetime('now')),
  -- tides_testuser_005
  ('a40d94651a98d71da6ee07a2b6ca3761f33347443493d2ccef70571a96aae9da', 'testuser005', 'Test Key 005', datetime('now'));