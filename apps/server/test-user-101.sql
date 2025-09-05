-- Test user and API key for tides-101 environment
-- API Key: tides_vm27ydanzrg_325FD3

INSERT OR IGNORE INTO users (id, email, name, created_at) VALUES 
  ('testuser101', 'testuser101@example.com', 'Test User 101', datetime('now'));

INSERT OR IGNORE INTO api_keys (key_hash, user_id, name, created_at) VALUES 
  ('4b19603ec46fb2ef9f674ed70fdaea5ac255c764dafd66c161ad2803aaeae0d0', 'testuser101', 'Test Key 101', datetime('now'));