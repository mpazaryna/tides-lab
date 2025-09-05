/**
 * Optimize Service - Mock Implementation
 * Provides schedule optimization and productivity recommendations
 */

import type { Env, OptimizeRequest, OptimizationData } from '../types.js';
import { StorageService } from '../storage.js';

export class OptimizeService {
  private env: Env;
  private storage: StorageService;

  constructor(env: Env) {
    this.env = env;
    this.storage = new StorageService(env);
  }

  /**
   * Generate optimized schedule recommendations based on real R2 data
   */
  async optimizeSchedule(request: OptimizeRequest, userId: string): Promise<OptimizationData> {
    console.log(`[OptimizeService] Optimizing schedule for tide: ${request.tides_id}`);
    
    const tideData = await this.storage.getTideData(userId, request.tides_id);
    if (!tideData) {
      throw new Error(`No tide data found for user: ${userId}, tide: ${request.tides_id}`);
    }

    const preferences = request.preferences;
    console.log(`[OptimizeService] Optimizing for tide: ${tideData.name}`);
    console.log(`[OptimizeService] Analyzing ${tideData.flow_sessions.length} flow sessions and ${tideData.energy_updates.length} energy updates`);

    // Analyze patterns from real data
    const flowAnalysis = this.analyzeFlowPatterns(tideData.flow_sessions);
    const energyAnalysis = this.analyzeEnergyPatterns(tideData.energy_updates);
    const taskAnalysis = this.analyzeTaskPatterns(tideData.task_links);

    // Generate data-driven schedule optimization
    const optimizedSchedule = this.generateOptimizedSchedule(
      flowAnalysis, 
      energyAnalysis, 
      taskAnalysis,
      preferences
    );

    // Calculate efficiency gains based on current vs optimized patterns
    const efficiencyGains = this.calculateEfficiencyGains(
      flowAnalysis, 
      energyAnalysis, 
      optimizedSchedule
    );

    const result: OptimizationData = {
      suggested_schedule: {
        time_blocks: optimizedSchedule
      },
      efficiency_gains: efficiencyGains
    };

    console.log(`[OptimizeService] Generated optimized schedule with ${optimizedSchedule.length} time blocks`);
    console.log(`[OptimizeService] Estimated time savings: ${efficiencyGains.estimated_time_saved} minutes`);
    
    return result;
  }

  /**
   * Analyze current schedule efficiency
   */
  async analyzeCurrentSchedule(tidesId: string, userId: string): Promise<{
    efficiency_score: number;
    bottlenecks: string[];
    suggestions: string[];
  }> {
    console.log(`[OptimizeService] Analyzing current schedule efficiency for tide: ${tidesId}`);
    
    // Mock schedule analysis
    const analysis = {
      efficiency_score: Math.floor(Math.random() * 40) + 60, // 60-100
      bottlenecks: [
        'Too many context switches between different types of work',
        'Meetings scheduled during peak productivity hours',
        'Insufficient break time between intensive tasks'
      ],
      suggestions: [
        'Group similar tasks together to reduce context switching',
        'Block morning hours for deep work when possible',
        'Schedule shorter, more frequent breaks',
        'Move routine tasks to lower-energy periods'
      ]
    };

    console.log(`[OptimizeService] Schedule efficiency score: ${analysis.efficiency_score}`);
    return analysis;
  }

  /**
   * Get personalized productivity tips
   */
  async getProductivityTips(request: OptimizeRequest, userId: string): Promise<string[]> {
    console.log(`[OptimizeService] Generating productivity tips for user: ${userId}`);
    
    const tips = [
      'Try the Pomodoro Technique: 25 minutes focused work, 5 minute break',
      'Use the 2-minute rule: if a task takes less than 2 minutes, do it immediately',
      'Batch similar tasks together to minimize context switching',
      'Schedule your most challenging work during your peak energy hours',
      'Keep a "done" list alongside your to-do list for motivation',
      'Use time-blocking to protect focused work time',
      'Take regular breaks to maintain mental clarity',
      'Review and adjust your schedule weekly based on what worked'
    ];

    // Return random subset of tips
    const selectedTips = tips.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    console.log(`[OptimizeService] Generated ${selectedTips.length} productivity tips`);
    return selectedTips;
  }

  /**
   * Analyze flow session patterns for optimization
   */
  private analyzeFlowPatterns(sessions: any[]) {
    if (sessions.length === 0) return { peakHours: [9, 13], averageDuration: 30, bestIntensity: 'moderate' };

    // Find peak working hours
    const hourCounts = sessions.reduce((counts, s) => {
      const hour = new Date(s.started_at).getHours();
      counts[hour] = (counts[hour] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([hour]) => parseInt(hour));

    // Average duration and best intensity
    const averageDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    const intensityScores: Record<string, number> = { gentle: 1, moderate: 2, strong: 3 };
    const bestIntensityData = sessions.reduce((best, s) => {
      const score = intensityScores[s.intensity] || 2;
      return s.duration > best.duration && score >= 2 ? { intensity: s.intensity, duration: s.duration } : best;
    }, { intensity: 'moderate', duration: 0 });

    return {
      peakHours,
      averageDuration: Math.round(averageDuration),
      bestIntensity: bestIntensityData.intensity,
      totalSessions: sessions.length
    };
  }

  /**
   * Analyze energy patterns for scheduling
   */
  private analyzeEnergyPatterns(energyUpdates: any[]) {
    if (energyUpdates.length === 0) return { highEnergyHours: [9, 10], lowEnergyHours: [14, 15] };

    // Group energy by hour
    const hourlyEnergy = energyUpdates.reduce((hours, update) => {
      const hour = new Date(update.timestamp).getHours();
      if (!hours[hour]) hours[hour] = [];
      hours[hour].push(parseInt(update.energy_level) || 5);
      return hours;
    }, {} as Record<number, number[]>);

    // Calculate hourly averages
    const hourlyAverages = Object.entries(hourlyEnergy).map(([hour, values]) => ({
      hour: parseInt(hour),
      average: (values as number[]).reduce((sum: number, val: number) => sum + val, 0) / (values as number[]).length
    }));

    const sortedByEnergy = hourlyAverages.sort((a, b) => b.average - a.average);
    const highEnergyHours = sortedByEnergy.slice(0, 2).map(h => h.hour);
    const lowEnergyHours = sortedByEnergy.slice(-2).map(h => h.hour);

    return { highEnergyHours, lowEnergyHours };
  }

  /**
   * Analyze task patterns for work type scheduling
   */
  private analyzeTaskPatterns(taskLinks: any[]) {
    if (taskLinks.length === 0) return { taskTypes: {}, focusAreas: ['development'] };

    const taskTypes = taskLinks.reduce((types, task) => {
      types[task.task_type] = (types[task.task_type] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    // Map task types to work categories
    const focusAreas = [];
    if (taskTypes.github_issue || taskTypes.github_pr) focusAreas.push('development');
    if (taskTypes.linear_task) focusAreas.push('planning');
    if (taskTypes.jira_task) focusAreas.push('administrative');

    return { taskTypes, focusAreas };
  }

  /**
   * Generate optimized schedule based on analysis
   */
  private generateOptimizedSchedule(_flowAnalysis: any, energyAnalysis: any, taskAnalysis: any, _preferences?: any) {
    const schedule = [];

    // Deep work during peak energy hours
    const primaryPeakHour = energyAnalysis.highEnergyHours[0] || 9;
    schedule.push({
      start: `${primaryPeakHour.toString().padStart(2, '0')}:00`,
      end: `${(primaryPeakHour + 2).toString().padStart(2, '0')}:00`,
      activity: `Deep Work - ${taskAnalysis.focusAreas[0] || 'High Priority Tasks'}`,
      priority: 1
    });

    // Break after deep work
    schedule.push({
      start: `${(primaryPeakHour + 2).toString().padStart(2, '0')}:00`,
      end: `${(primaryPeakHour + 2).toString().padStart(2, '0')}:15`,
      activity: 'Break',
      priority: 3
    });

    // Secondary focus work
    const secondaryHour = energyAnalysis.highEnergyHours[1] || 13;
    if (secondaryHour !== primaryPeakHour) {
      schedule.push({
        start: `${secondaryHour.toString().padStart(2, '0')}:00`,
        end: `${(secondaryHour + 1).toString().padStart(2, '0')}:30`,
        activity: `Focused Work - ${taskAnalysis.focusAreas[1] || 'Collaborative Tasks'}`,
        priority: 2
      });
    }

    // Administrative tasks during low energy
    const lowEnergyHour = energyAnalysis.lowEnergyHours[0] || 14;
    schedule.push({
      start: `${lowEnergyHour.toString().padStart(2, '0')}:00`,
      end: `${(lowEnergyHour + 1).toString().padStart(2, '0')}:00`,
      activity: 'Administrative Tasks & Email',
      priority: 2
    });

    // Learning/Development
    schedule.push({
      start: `${(lowEnergyHour + 1).toString().padStart(2, '0')}:00`,
      end: `${(lowEnergyHour + 2).toString().padStart(2, '0')}:00`,
      activity: 'Learning & Development',
      priority: 2
    });

    return schedule.sort((a, b) => a.start.localeCompare(b.start));
  }

  /**
   * Calculate efficiency gains from optimization
   */
  private calculateEfficiencyGains(flowAnalysis: any, energyAnalysis: any, schedule: any[]) {
    // Calculate time saved based on better scheduling
    const currentAvgDuration = flowAnalysis.averageDuration || 45;
    const optimizedDuration = Math.min(currentAvgDuration * 1.2, 90); // 20% improvement, max 90min
    const timeSavedPerSession = optimizedDuration - currentAvgDuration;
    const estimatedTimeSaved = Math.max(15, timeSavedPerSession * (flowAnalysis.totalSessions || 2));

    // Focus improvement based on energy alignment
    const hasEnergyAlignment = schedule.some(block => 
      block.priority === 1 && energyAnalysis.highEnergyHours.some((hour: number) => 
        block.start.startsWith(hour.toString().padStart(2, '0'))
      )
    );

    const focusImprovement = hasEnergyAlignment ? 
      Math.min(25 + (flowAnalysis.totalSessions || 0) * 2, 40) : 20;

    return {
      estimated_time_saved: Math.round(estimatedTimeSaved),
      focus_improvement: focusImprovement
    };
  }

}