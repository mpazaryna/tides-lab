// D1 + R2 Hybrid Storage Implementation
// D1 for user auth and tide metadata, R2 for full JSON data

import type { TideStorage, Tide, FlowSession, EnergyUpdate, TaskLink, CreateTideInput, TideFilter } from './index';

interface R2Storage {
  putObject(key: string, data: any): Promise<void>;
  getObject(key: string): Promise<any | null>;
}

interface D1Config {
  db: D1Database;
  r2Storage: R2Storage;
}

export interface AuthContext {
  userId: string;
  email?: string;
  apiKeyName?: string;
}

export class D1R2HybridStorage implements TideStorage {
  private db: D1Database;
  private r2: R2Storage;
  private authContext: AuthContext | null = null;

  constructor(config: D1Config) {
    this.db = config.db;
    this.r2 = config.r2Storage;
  }

  // Set auth context for the current request
  setAuthContext(context: AuthContext) {
    this.authContext = context;
  }

  private getUserId(): string {
    if (!this.authContext?.userId) {
      // For backwards compatibility during migration
      return 'default-user';
    }
    return this.authContext.userId;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getUserR2Path(userId: string, tideId: string): string {
    return `users/${userId}/tides/${tideId}.json`;
  }

  async createTide(input: CreateTideInput): Promise<Tide> {
    const userId = this.getUserId();
    const tideId = this.generateId('tide');
    const now = new Date().toISOString();
    
    console.log(`🔍 D1R2HybridStorage.createTide called for userId: ${userId}, tideId: ${tideId}`);
    console.log(`🔍 Input:`, input);
    
    const tide: Tide = {
      id: tideId,
      name: input.name,
      flow_type: input.flow_type,
      description: input.description,
      created_at: now,
      status: 'active',
      flow_sessions: [],
      energy_updates: [],
      task_links: [],
      metadata: input.metadata || undefined,
    };

    const r2Path = this.getUserR2Path(userId, tideId);
    console.log(`🔍 R2 path: ${r2Path}`);

    try {
      // Enhanced transaction-like pattern: prepare all operations first
      const d1Statement = this.db.prepare(`
        INSERT INTO tide_index (
          id, user_id, name, flow_type, description, status, created_at, updated_at, r2_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tideId,
        userId,
        input.name,
        input.flow_type,
        input.description || null,
        'active',
        now,
        now,
        r2Path
      );

      console.log(`🔍 About to insert into D1 with values:`, {
        tideId,
        userId,
        name: input.name,
        flow_type: input.flow_type,
        description: input.description || null,
        status: 'active',
        created_at: now,
        updated_at: now,
        r2_path: r2Path
      });

      // 1. Insert into D1 index
      const d1Result = await d1Statement.run();
      console.log(`🔍 D1 insert result:`, d1Result);

      // 2. Store full data in R2
      console.log(`🔍 About to store in R2 at path: ${r2Path}`);
      await this.r2.putObject(r2Path, tide);
      console.log(`🔍 R2 storage completed`);

      // 3. Initialize analytics record
      console.log(`🔍 About to insert analytics record`);
      const analyticsResult = await this.db.prepare(`
        INSERT INTO tide_analytics (tide_id, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(tideId, userId, now, now).run();
      console.log(`🔍 Analytics insert result:`, analyticsResult);

      console.log(`✅ D1R2HybridStorage.createTide completed successfully for tideId: ${tideId}`);
      return tide;
    } catch (error) {
      console.error(`❌ D1R2HybridStorage.createTide failed for tideId: ${tideId}:`, error);
      // Attempt cleanup on failure
      try {
        await this.db.prepare(`DELETE FROM tide_index WHERE id = ?`).bind(tideId).run();
        await this.db.prepare(`DELETE FROM tide_analytics WHERE tide_id = ?`).bind(tideId).run();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      console.error('Error creating tide:', error);
      throw error;
    }
  }

  async getTide(id: string): Promise<Tide | null> {
    const userId = this.getUserId();
    
    // If we have proper auth context (not default fallback), use user-scoped query
    // If using default fallback, try to find tide without user restriction (for backward compatibility)
    let result;
    if (userId !== 'default-user') {
      // Authenticated user - use user-scoped query
      result = await this.db.prepare(`
        SELECT r2_path FROM tide_index 
        WHERE id = ? AND user_id = ?
      `).bind(id, userId).first();
    } else {
      // Fallback for systems that don't have proper auth context propagation
      // In production with proper auth, this branch should rarely be hit
      result = await this.db.prepare(`
        SELECT r2_path FROM tide_index 
        WHERE id = ?
      `).bind(id).first();
    }

    if (!result) {
      return null;
    }

    // Get full data from R2
    const tide = await this.r2.getObject(result.r2_path as string);
    return tide;
  }

  async listTides(filter?: TideFilter): Promise<Tide[]> {
    const userId = this.getUserId();
    
    console.log(`🔍 D1R2HybridStorage.listTides called for userId: ${userId}`);
    
    let query = 'SELECT * FROM tide_index WHERE user_id = ?';
    const params: any[] = [userId];

    if (filter?.flow_type) {
      query += ' AND flow_type = ?';
      params.push(filter.flow_type);
    }

    if (filter?.active_only) {
      query += ' AND status = ?';
      params.push('active');
    }

    query += ' ORDER BY created_at DESC';

    console.log(`🔍 D1R2HybridStorage query: ${query}, params:`, params);

    const results = await this.db.prepare(query).bind(...params).all();
    
    console.log(`🔍 D1R2HybridStorage query returned ${results.results.length} results:`, results.results);

    // Convert D1 results to Tide format (use actual description from D1)
    return results.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      flow_type: row.flow_type,
      status: row.status,
      created_at: row.created_at,
      description: row.description || '', // Use actual description from D1
      flow_sessions: [], // Not needed for listing
      energy_updates: [], // Not needed for listing
      task_links: [], // Not needed for listing
    }));
  }

  async updateTide(id: string, updates: Partial<Tide>): Promise<Tide> {
    const userId = this.getUserId();
    const now = new Date().toISOString();
    
    // Get current tide
    const existing = await this.getTide(id);
    if (!existing) {
      throw new Error(`Tide with id ${id} not found`);
    }

    const updated: Tide = { ...existing, ...updates };

    try {
      // Always update updated_at timestamp
      await this.db.prepare(`
        UPDATE tide_index 
        SET name = ?, status = ?, flow_type = ?, description = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).bind(
        updated.name,
        updated.status,
        updated.flow_type,
        updated.description || null,
        now,
        id,
        userId
      ).run();

      // Update R2 data
      const r2Path = this.getUserR2Path(userId, id);
      await this.r2.putObject(r2Path, updated);

      // Update analytics if status changed to completed
      if (updates.status === 'completed' && existing.status !== 'completed') {
        await this.updateCompletionAnalytics(id, userId);
      }

      return updated;
    } catch (error) {
      console.error('Error updating tide:', error);
      throw error;
    }
  }

  async addFlowSession(tideId: string, session: Omit<FlowSession, 'id' | 'tide_id'>): Promise<FlowSession> {
    const tide = await this.getTide(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const userId = this.getUserId();
    const now = new Date().toISOString();
    const sessionId = this.generateId('session');
    
    const flowSession: FlowSession = {
      id: sessionId,
      tide_id: tideId,
      ...session,
    };

    tide.flow_sessions.push(flowSession);
    
    try {
      // Calculate intensity value for analytics
      const intensityValue = this.getIntensityValue(session.intensity);
      
      // Update tide metadata in D1
      await this.db.prepare(`
        UPDATE tide_index 
        SET flow_count = flow_count + 1, 
            last_flow = ?,
            total_duration = total_duration + ?,
            updated_at = ?
        WHERE id = ? AND user_id = ?
      `).bind(session.started_at, session.duration, now, tideId, userId).run();

      // Update analytics
      await this.updateFlowAnalytics(tideId, userId, session.duration, intensityValue);

      // Store denormalized session summary for fast queries
      await this.createFlowSessionSummary(sessionId, tideId, userId, session, intensityValue);

      // Update full data in R2
      const r2Path = this.getUserR2Path(userId, tideId);
      await this.r2.putObject(r2Path, tide);

      // Update daily rollups
      await this.updateDailyRollups(userId, session.started_at, session.duration);

      return flowSession;
    } catch (error) {
      console.error('Error adding flow session:', error);
      throw error;
    }
  }

  async getFlowSessions(tideId: string): Promise<FlowSession[]> {
    const tide = await this.getTide(tideId);
    return tide?.flow_sessions || [];
  }

  async addEnergyUpdate(tideId: string, update: Omit<EnergyUpdate, 'id' | 'tide_id'>): Promise<EnergyUpdate> {
    const tide = await this.getTide(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const energyUpdate: EnergyUpdate = {
      id: this.generateId('energy'),
      tide_id: tideId,
      ...update,
    };

    tide.energy_updates.push(energyUpdate);
    await this.updateTide(tideId, tide);

    return energyUpdate;
  }

  async getEnergyUpdates(tideId: string): Promise<EnergyUpdate[]> {
    const tide = await this.getTide(tideId);
    return tide?.energy_updates || [];
  }

  async addTaskLink(tideId: string, link: Omit<TaskLink, 'id' | 'tide_id'>): Promise<TaskLink> {
    const tide = await this.getTide(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const taskLink: TaskLink = {
      id: this.generateId('link'),
      tide_id: tideId,
      ...link,
    };

    tide.task_links.push(taskLink);
    await this.updateTide(tideId, tide);

    return taskLink;
  }

  async getTaskLinks(tideId: string): Promise<TaskLink[]> {
    const tide = await this.getTide(tideId);
    return tide?.task_links || [];
  }

  async removeTaskLink(linkId: string): Promise<boolean> {
    const userId = this.getUserId();
    
    // Find tide containing this link via D1
    const results = await this.db.prepare(`
      SELECT id, r2_path FROM tide_index WHERE user_id = ?
    `).bind(userId).all();

    for (const row of results.results) {
      const tide = await this.r2.getObject(row.r2_path as string) as Tide;
      if (!tide) continue;

      const linkIndex = tide.task_links.findIndex(link => link.id === linkId);
      if (linkIndex !== -1) {
        tide.task_links.splice(linkIndex, 1);
        await this.r2.putObject(row.r2_path as string, tide);
        return true;
      }
    }

    return false;
  }

  // Helper methods for analytics and calculations
  private getIntensityValue(intensity: string): number {
    switch (intensity) {
      case 'gentle': return 1.0;
      case 'moderate': return 2.0;
      case 'strong': return 3.0;
      default: return 1.0;
    }
  }

  private async updateFlowAnalytics(tideId: string, userId: string, duration: number, intensityValue: number): Promise<void> {
    const now = new Date().toISOString();
    
    // Upsert analytics record
    await this.db.prepare(`
      INSERT INTO tide_analytics (tide_id, user_id, total_sessions, total_duration, avg_intensity, last_session_at, updated_at)
      VALUES (?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(tide_id) DO UPDATE SET
        total_sessions = total_sessions + 1,
        total_duration = total_duration + excluded.total_duration,
        avg_intensity = (avg_intensity * total_sessions + excluded.avg_intensity) / (total_sessions + 1),
        last_session_at = excluded.last_session_at,
        updated_at = excluded.updated_at
    `).bind(tideId, userId, duration, intensityValue, now, now).run();
  }

  private async createFlowSessionSummary(
    sessionId: string, 
    tideId: string, 
    userId: string, 
    session: Omit<FlowSession, 'id' | 'tide_id'>,
    intensityValue: number
  ): Promise<void> {
    const sessionDate = new Date(session.started_at).toISOString().split('T')[0]; // YYYY-MM-DD
    const energyDelta = 0; // Calculate from energy_level if needed
    
    await this.db.prepare(`
      INSERT INTO flow_session_summary (
        id, tide_id, user_id, session_date, intensity, duration, energy_delta, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      tideId,
      userId,
      sessionDate,
      session.intensity,
      session.duration,
      energyDelta,
      session.started_at
    ).run();
  }

  private async updateDailyRollups(userId: string, startedAt: string, duration: number): Promise<void> {
    const date = new Date(startedAt).toISOString().split('T')[0]; // YYYY-MM-DD
    const rollupId = `${userId}_${date}_daily`;
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      INSERT INTO user_activity_rollups (
        id, user_id, date, period_type, flow_count, total_duration, avg_energy, active_tides, created_at
      ) VALUES (?, ?, ?, 'daily', 1, ?, 0.0, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        flow_count = flow_count + 1,
        total_duration = total_duration + excluded.total_duration
    `).bind(rollupId, userId, date, duration, now).run();
  }

  private async updateCompletionAnalytics(tideId: string, userId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Update analytics with completion timestamp
    await this.db.prepare(`
      UPDATE tide_analytics 
      SET updated_at = ?
      WHERE tide_id = ?
    `).bind(now, tideId).run();
  }

  // Batch operations for performance testing
  async batchCreateTides(inputs: CreateTideInput[]): Promise<Tide[]> {
    const userId = this.getUserId();
    const now = new Date().toISOString();
    const results: Tide[] = [];

    // Process in batches to avoid overwhelming D1
    const batchSize = 10;
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(input => this.createTide(input))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async batchGetTides(tideIds: string[]): Promise<(Tide | null)[]> {
    const userId = this.getUserId();
    
    // Get R2 paths from D1 in one query
    const placeholders = tideIds.map(() => '?').join(',');
    const results = await this.db.prepare(`
      SELECT id, r2_path FROM tide_index 
      WHERE id IN (${placeholders}) AND user_id = ?
    `).bind(...tideIds, userId).all();

    // Create map of id -> r2_path
    const pathMap = new Map();
    results.results.forEach((row: any) => {
      pathMap.set(row.id, row.r2_path);
    });

    // Fetch from R2 in parallel
    const tidePromises = tideIds.map(async id => {
      const r2Path = pathMap.get(id);
      if (!r2Path) return null;
      return await this.r2.getObject(r2Path);
    });

    return Promise.all(tidePromises);
  }

  // Analytics query methods
  async getTideAnalytics(tideId: string): Promise<any> {
    const userId = this.getUserId();
    
    const result = await this.db.prepare(`
      SELECT * FROM tide_analytics 
      WHERE tide_id = ? AND user_id = ?
    `).bind(tideId, userId).first();

    return result;
  }

  async getUserActivityRollup(userId: string, date: string, periodType: string = 'daily'): Promise<any> {
    const rollupId = `${userId}_${date}_${periodType}`;
    
    const result = await this.db.prepare(`
      SELECT * FROM user_activity_rollups 
      WHERE id = ?
    `).bind(rollupId).first();

    return result;
  }

  async getRecentFlowSessions(userId: string, limit: number = 10): Promise<any[]> {
    const results = await this.db.prepare(`
      SELECT * FROM flow_session_summary 
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return results.results;
  }

  // Authentication methods
  async validateApiKey(apiKey: string): Promise<AuthContext | null> {
    // Hash the API key using Web Crypto API (available in Workers)
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const result = await this.db.prepare(`
      SELECT ak.user_id, ak.name, u.email 
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = ?
    `).bind(keyHash).first();

    if (!result) {
      return null;
    }

    // Update last used
    await this.db.prepare(`
      UPDATE api_keys SET last_used = ? WHERE key_hash = ?
    `).bind(new Date().toISOString(), keyHash).run();

    return {
      userId: result.user_id as string,
      email: result.email as string,
      apiKeyName: result.name as string,
    };
  }

  async storeApiKey(keyHash: string, userId: string, userEmail: string, name: string): Promise<void> {
    // Check if user exists, create if not
    const existingUser = await this.db.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!existingUser) {
      console.log("[STORAGE] Creating new user:", { userId, email: userEmail });
      await this.db.prepare(
        "INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, datetime('now'))"
      ).bind(userId, userEmail, `Mobile User ${userId}`).run();
    }

    // Check if key already exists
    const existingKey = await this.db.prepare(
      "SELECT key_hash FROM api_keys WHERE key_hash = ?"
    ).bind(keyHash).first();

    if (!existingKey) {
      // Insert the API key
      await this.db.prepare(
        "INSERT INTO api_keys (key_hash, user_id, name, created_at) VALUES (?, ?, ?, datetime('now'))"
      ).bind(keyHash, userId, name).run();
      console.log("[STORAGE] API key stored successfully");
    } else {
      console.log("[STORAGE] API key already exists");
    }
  }
}