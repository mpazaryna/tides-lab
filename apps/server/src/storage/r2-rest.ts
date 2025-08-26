// R2 REST API implementation bypassing wrangler bindings
import type { TideStorage, Tide, FlowSession, EnergyUpdate, TaskLink, CreateTideInput, TideFilter } from './index';

interface TideIndex {
  tides: Array<{
    id: string;
    name: string;
    flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
    status: 'active' | 'completed' | 'paused';
    created_at: string;
    flow_count: number;
    last_flow: string | null;
  }>;
  updated_at: string;
}

interface R2Config {
  accountId: string;
  bucketName: string;
  apiToken: string;
}

export class R2RestApiStorage implements TideStorage {
  constructor(private config: R2Config) {}

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getApiUrl(key: string): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/r2/buckets/${this.config.bucketName}/objects/${key}`;
  }

  private getTideFilePath(tideId: string): string {
    return `tides/${tideId}.json`;
  }

  private getIndexFilePath(): string {
    return 'tides/index.json';
  }

  private async putObject(key: string, data: any): Promise<void> {
    const response = await fetch(this.getApiUrl(key), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2),
    });

    if (!response.ok) {
      throw new Error(`Failed to put object ${key}: ${response.status} ${response.statusText}`);
    }
  }

  private async getObject(key: string): Promise<any | null> {
    try {
      const response = await fetch(this.getApiUrl(key), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get object ${key}: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting object ${key}:`, error);
      return null;
    }
  }

  async createTide(input: CreateTideInput): Promise<Tide> {
    const tide: Tide = {
      id: this.generateId('tide'),
      name: input.name,
      flow_type: input.flow_type,
      description: input.description,
      created_at: new Date().toISOString(),
      status: 'active',
      flow_sessions: [],
      energy_updates: [],
      task_links: [],
    };

    // Write tide file
    await this.putObject(this.getTideFilePath(tide.id), tide);

    // Update index asynchronously (don't block tide creation)
    this.updateIndex(tide).catch(error => {
      console.error('Background index update failed:', error);
    });
    
    return tide;
  }

  async getTide(id: string): Promise<Tide | null> {
    return await this.getObject(this.getTideFilePath(id));
  }

  async listTides(filter?: TideFilter): Promise<Tide[]> {
    try {
      // Read the index file for fast listing
      const index: TideIndex | null = await this.getObject(this.getIndexFilePath());
      if (!index) {
        // No index exists yet, return empty array
        return [];
      }

      let filteredTides = index.tides;

      // Apply filters
      if (filter?.flow_type) {
        filteredTides = filteredTides.filter(tide => tide.flow_type === filter.flow_type);
      }

      if (filter?.active_only) {
        filteredTides = filteredTides.filter(tide => tide.status === 'active');
      }

      // Convert index entries to full Tide objects for compatibility
      // Note: For performance, we could return just the index data and modify the interface
      const tides: Tide[] = filteredTides.map(indexEntry => ({
        id: indexEntry.id,
        name: indexEntry.name,
        flow_type: indexEntry.flow_type,
        status: indexEntry.status,
        created_at: indexEntry.created_at,
        description: '', // Not stored in index
        flow_sessions: [], // Not needed for listing
        energy_updates: [], // Not needed for listing
        task_links: [], // Not needed for listing
      }));

      // Sort by created_at (newest first)
      return tides.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error listing tides:', error);
      return [];
    }
  }

  async updateTide(id: string, updates: Partial<Tide>): Promise<Tide> {
    const existingTide = await this.getTide(id);
    if (!existingTide) {
      throw new Error(`Tide with id ${id} not found`);
    }

    const updatedTide: Tide = { ...existingTide, ...updates };

    // Write updated tide file
    await this.putObject(this.getTideFilePath(id), updatedTide);

    // Update index if needed
    await this.updateIndex(updatedTide);

    return updatedTide;
  }

  async addFlowSession(tideId: string, session: Omit<FlowSession, 'id' | 'tide_id'>): Promise<FlowSession> {
    const tide = await this.getTide(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const flowSession: FlowSession = {
      id: this.generateId('session'),
      tide_id: tideId,
      ...session,
    };

    tide.flow_sessions.push(flowSession);
    await this.updateTide(tideId, tide);

    return flowSession;
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
    // This requires reading all tides to find the one with the link
    // In a real implementation, we might maintain a separate index for links
    try {
      const index = await this.getIndex();
      
      for (const indexEntry of index.tides) {
        const tide = await this.getTide(indexEntry.id);
        if (!tide) continue;

        const linkIndex = tide.task_links.findIndex(link => link.id === linkId);
        if (linkIndex !== -1) {
          tide.task_links.splice(linkIndex, 1);
          await this.updateTide(tide.id, tide);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error removing task link:', error);
      return false;
    }
  }

  // Private helper methods for index management
  private async getIndex(): Promise<TideIndex> {
    try {
      const index: TideIndex | null = await this.getObject(this.getIndexFilePath());
      if (!index) {
        return { tides: [], updated_at: new Date().toISOString() };
      }
      return index;
    } catch (error) {
      console.error('Error reading index:', error);
      return { tides: [], updated_at: new Date().toISOString() };
    }
  }

  private async updateIndex(tide: Tide): Promise<void> {
    try {
      const index = await this.getIndex();
      
      // Find existing entry or add new one
      const existingIndex = index.tides.findIndex(t => t.id === tide.id);
      const indexEntry = {
        id: tide.id,
        name: tide.name,
        flow_type: tide.flow_type,
        status: tide.status,
        created_at: tide.created_at,
        flow_count: tide.flow_sessions.length,
        last_flow: tide.flow_sessions.length > 0 
          ? tide.flow_sessions[tide.flow_sessions.length - 1].started_at
          : null,
      };

      if (existingIndex >= 0) {
        index.tides[existingIndex] = indexEntry;
      } else {
        index.tides.push(indexEntry);
      }

      index.updated_at = new Date().toISOString();

      // Write updated index
      await this.putObject(this.getIndexFilePath(), index);
    } catch (error) {
      console.error('Error updating index:', error);
      // Don't throw - index update failure shouldn't break the main operation
    }
  }
}