// Mock storage implementation for testing

import type { TideStorage, Tide, FlowSession, EnergyUpdate, TaskLink, CreateTideInput, TideFilter } from './index';

export class MockTideStorage implements TideStorage {
  private tides: Map<string, Tide> = new Map();
  private idCounter: number = 1;

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${this.idCounter++}`;
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
      metadata: input.metadata || undefined,
    };

    this.tides.set(tide.id, tide);
    return tide;
  }

  async getTide(id: string): Promise<Tide | null> {
    return this.tides.get(id) || null;
  }

  async listTides(filter?: TideFilter): Promise<Tide[]> {
    let tides = Array.from(this.tides.values());

    if (filter?.flow_type) {
      tides = tides.filter(tide => tide.flow_type === filter.flow_type);
    }

    if (filter?.active_only) {
      tides = tides.filter(tide => tide.status === 'active');
    }

    // Sort by created_at (newest first)
    return tides.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async updateTide(id: string, updates: Partial<Tide>): Promise<Tide> {
    const existingTide = this.tides.get(id);
    if (!existingTide) {
      throw new Error(`Tide with id ${id} not found`);
    }

    const updatedTide: Tide = { ...existingTide, ...updates };
    this.tides.set(id, updatedTide);
    return updatedTide;
  }

  async addFlowSession(tideId: string, session: Omit<FlowSession, 'id' | 'tide_id'>): Promise<FlowSession> {
    const tide = this.tides.get(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const flowSession: FlowSession = {
      id: this.generateId('session'),
      tide_id: tideId,
      ...session,
    };

    tide.flow_sessions.push(flowSession);
    this.tides.set(tideId, tide);
    return flowSession;
  }

  async getFlowSessions(tideId: string): Promise<FlowSession[]> {
    const tide = this.tides.get(tideId);
    return tide?.flow_sessions || [];
  }

  async addEnergyUpdate(tideId: string, update: Omit<EnergyUpdate, 'id' | 'tide_id'>): Promise<EnergyUpdate> {
    const tide = this.tides.get(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const energyUpdate: EnergyUpdate = {
      id: this.generateId('energy'),
      tide_id: tideId,
      ...update,
    };

    tide.energy_updates.push(energyUpdate);
    this.tides.set(tideId, tide);
    return energyUpdate;
  }

  async getEnergyUpdates(tideId: string): Promise<EnergyUpdate[]> {
    const tide = this.tides.get(tideId);
    return tide?.energy_updates || [];
  }

  async addTaskLink(tideId: string, link: Omit<TaskLink, 'id' | 'tide_id'>): Promise<TaskLink> {
    const tide = this.tides.get(tideId);
    if (!tide) {
      throw new Error(`Tide with id ${tideId} not found`);
    }

    const taskLink: TaskLink = {
      id: this.generateId('link'),
      tide_id: tideId,
      ...link,
    };

    tide.task_links.push(taskLink);
    this.tides.set(tideId, tide);
    return taskLink;
  }

  async getTaskLinks(tideId: string): Promise<TaskLink[]> {
    const tide = this.tides.get(tideId);
    return tide?.task_links || [];
  }

  async removeTaskLink(linkId: string): Promise<boolean> {
    for (const tide of this.tides.values()) {
      const linkIndex = tide.task_links.findIndex(link => link.id === linkId);
      if (linkIndex !== -1) {
        tide.task_links.splice(linkIndex, 1);
        this.tides.set(tide.id, tide);
        return true;
      }
    }
    return false;
  }

  // Helper methods for testing
  clear(): void {
    this.tides.clear();
    this.idCounter = 1;
  }

  size(): number {
    return this.tides.size;
  }
}