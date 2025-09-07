/**
 * Questions Service - Mock Implementation
 * Handles custom productivity questions and AI-powered responses
 */

import type { Env, QuestionsRequest } from '../types.js';
import { StorageService } from '../storage.js';

export class QuestionsService {
  private env: Env;
  private storage: StorageService;

  constructor(env: Env) {
    this.env = env;
    this.storage = new StorageService(env);
  }

  /**
   * Process a custom productivity question with contextual R2 data analysis
   */
  async processQuestion(request: QuestionsRequest, userId: string, apiKey?: string): Promise<{
    answer: string;
    confidence: number;
    related_insights: string[];
    suggested_actions: string[];
  }> {
    console.log(`[QuestionsService] Processing question for tide: ${request.tides_id}`);
    console.log(`[QuestionsService] Question: ${request.question}`);
    
    let tideData = null;
    
    // Use the new authenticated tide lookup if API key is provided
    if (apiKey && request.tides_id) {
      const { tideData: authTideData, userId: authUserId } = await this.storage.getTideDataWithAuth(apiKey, request.tides_id);
      tideData = authTideData;
      console.log(`[QuestionsService] Authenticated tide lookup: tide=${request.tides_id}, user=${authUserId}`);
    } else {
      // Fallback to old method for backwards compatibility
      tideData = await this.storage.getTideDataFromAnySource(userId, request.tides_id);
    }
    
    if (!tideData) {
      throw new Error(`No tide data found for user: ${userId}, tide: ${request.tides_id}`);
    }
    
    // Analyze context from real data
    const context = this.analyzeUserContext(tideData);
    const response = this.generateContextualResponse(request.question, context, tideData);
    
    console.log(`[QuestionsService] Generated contextual response with ${response.confidence}% confidence`);
    return response;
    
    console.log(`[QuestionsService] Processing with context: ${context}`);
    console.log(`[QuestionsService] Tide context: ${tideData?.name || 'Unknown'}`);

    // Mock AI response based on common productivity questions
    const mockResponses = this.generateMockResponse(request.question, tideData?.name);
    
    console.log(`[QuestionsService] Generated response with confidence: ${mockResponses.confidence}`);
    return mockResponses;
  }

  /**
   * Get frequently asked questions and answers
   */
  async getFrequentQuestions(): Promise<Array<{ question: string; category: string }>> {
    console.log(`[QuestionsService] Retrieving frequent questions`);
    
    const frequentQuestions = [
      { question: "How can I improve my morning productivity?", category: "time_management" },
      { question: "What's the best way to handle interruptions during deep work?", category: "focus" },
      { question: "How do I prioritize tasks when everything seems urgent?", category: "prioritization" },
      { question: "When should I schedule breaks for optimal productivity?", category: "energy_management" },
      { question: "How can I reduce context switching throughout the day?", category: "workflow" },
      { question: "What are the best practices for remote work productivity?", category: "remote_work" },
      { question: "How do I maintain motivation for long-term projects?", category: "motivation" },
      { question: "What's the optimal work session length for sustained focus?", category: "time_blocking" }
    ];

    console.log(`[QuestionsService] Retrieved ${frequentQuestions.length} frequent questions`);
    return frequentQuestions;
  }

  /**
   * Generate contextual follow-up questions
   */
  async generateFollowUpQuestions(originalQuestion: string, tidesId: string): Promise<string[]> {
    console.log(`[QuestionsService] Generating follow-up questions for: ${originalQuestion}`);
    
    const followUps = [
      "Would you like specific time blocks recommended for this activity?",
      "How has this challenge affected your overall productivity recently?",
      "What strategies have you already tried for this issue?",
      "Would you like to track progress on implementing this recommendation?",
      "Are there specific days or times when this is more problematic?"
    ];

    // Return random subset
    const selected = followUps.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    console.log(`[QuestionsService] Generated ${selected.length} follow-up questions`);
    return selected;
  }

  /**
   * Analyze user context from tide data
   */
  private analyzeUserContext(tideData: any) {
    const flowSessions = tideData.flow_sessions || [];
    const energyUpdates = tideData.energy_updates || [];
    const taskLinks = tideData.task_links || [];

    // Calculate key metrics
    const avgSessionDuration = flowSessions.length > 0 ? 
      flowSessions.reduce((sum: number, s: any) => sum + s.duration, 0) / flowSessions.length : 0;
    
    const avgEnergyLevel = energyUpdates.length > 0 ?
      energyUpdates.reduce((sum: number, e: any) => sum + (parseInt(e.energy_level) || 5), 0) / energyUpdates.length : 5;

    // Find peak hours
    const peakHours = this.findPeakHours(flowSessions);
    const bestIntensity = this.findBestIntensity(flowSessions);
    const primaryTaskTypes = this.getPrimaryTaskTypes(taskLinks);

    return {
      avgSessionDuration: Math.round(avgSessionDuration),
      avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
      peakHours,
      bestIntensity,
      primaryTaskTypes,
      totalSessions: flowSessions.length,
      totalEnergyCheckins: energyUpdates.length,
      linkedTasks: taskLinks.length
    };
  }

  /**
   * Generate contextual response based on question and user data
   */
  private generateContextualResponse(question: string, context: any, tideData: any) {
    const lowerQuestion = question.toLowerCase();
    
    // Energy-related questions
    if (lowerQuestion.includes('energy') || lowerQuestion.includes('tired') || lowerQuestion.includes('fatigue')) {
      return this.generateEnergyResponse(question, context);
    }
    
    // Time management questions
    if (lowerQuestion.includes('time') || lowerQuestion.includes('schedule') || lowerQuestion.includes('manage')) {
      return this.generateTimeManagementResponse(question, context);
    }
    
    // Focus/productivity questions
    if (lowerQuestion.includes('focus') || lowerQuestion.includes('productive') || lowerQuestion.includes('concentration')) {
      return this.generateFocusResponse(question, context);
    }
    
    // Morning routine questions
    if (lowerQuestion.includes('morning') || lowerQuestion.includes('start')) {
      return this.generateMorningResponse(question, context);
    }
    
    // Default contextual response
    return this.generateGeneralContextualResponse(question, context);
  }

  /**
   * Generate energy-specific response
   */
  private generateEnergyResponse(question: string, context: any) {
    const energyInsight = context.avgEnergyLevel > 7 ? 
      "Your energy levels are generally high" : 
      context.avgEnergyLevel > 5 ? "Your energy levels are moderate" : "Your energy levels tend to be low";

    return {
      answer: `${energyInsight} (average: ${context.avgEnergyLevel}/10). Based on your ${context.totalEnergyCheckins} energy check-ins, I recommend focusing on energy management strategies that align with your natural patterns.`,
      confidence: context.totalEnergyCheckins > 5 ? 90 : 70,
      related_insights: [
        `Your peak productive hours appear to be around ${context.peakHours.join(' and ')}`,
        `You've completed ${context.totalSessions} focused work sessions`,
        `Your average session length is ${context.avgSessionDuration} minutes`
      ],
      suggested_actions: [
        `Schedule demanding work during your peak hours (${context.peakHours[0]}:00)`,
        "Track energy patterns for 1 week to identify trends",
        "Consider taking breaks every 45-60 minutes"
      ]
    };
  }

  /**
   * Generate time management response
   */
  private generateTimeManagementResponse(question: string, context: any) {
    return {
      answer: `Based on your ${context.totalSessions} flow sessions with an average duration of ${context.avgSessionDuration} minutes, you're showing good consistency in time management. Your ${context.bestIntensity} intensity sessions tend to be most effective.`,
      confidence: 85,
      related_insights: [
        `Peak productivity hours: ${context.peakHours.join(' and ')}`,
        `Primary work focus: ${context.primaryTaskTypes.join(', ')}`,
        `${context.linkedTasks} external tasks linked to your workflow`
      ],
      suggested_actions: [
        `Schedule deep work during ${context.peakHours[0]}:00-${context.peakHours[0] + 2}:00`,
        `Continue using ${context.bestIntensity} intensity for focused sessions`,
        "Block calendar time to protect focused work periods"
      ]
    };
  }

  /**
   * Generate focus-specific response  
   */
  private generateFocusResponse(question: string, context: any) {
    return {
      answer: `Your focus patterns show ${context.totalSessions} completed sessions averaging ${context.avgSessionDuration} minutes each. This suggests you have a good foundation for sustained focus work.`,
      confidence: 88,
      related_insights: [
        `Best performance during ${context.peakHours.join(' and ')} hours`,
        `${context.bestIntensity.charAt(0).toUpperCase() + context.bestIntensity.slice(1)} intensity sessions work best for you`,
        `Energy levels average ${context.avgEnergyLevel}/10 across sessions`
      ],
      suggested_actions: [
        "Aim for 45-60 minute focused sessions based on your current patterns",
        `Use ${context.bestIntensity} intensity for complex tasks`,
        "Minimize distractions during your peak hours"
      ]
    };
  }

  /**
   * Generate morning routine response
   */
  private generateMorningResponse(question: string, context: any) {
    const morningPeak = context.peakHours.find((h: number) => h <= 11) || context.peakHours[0];
    
    return {
      answer: `Your productivity data shows peak performance around ${morningPeak}:00. Based on ${context.totalSessions} sessions, establishing a consistent morning routine that leads into your peak hours will maximize your effectiveness.`,
      confidence: 92,
      related_insights: [
        `Peak morning performance: ${morningPeak}:00`,
        `Average energy level: ${context.avgEnergyLevel}/10`,
        `Most effective work type: ${context.primaryTaskTypes[0] || 'development'}`
      ],
      suggested_actions: [
        `Start focused work by ${morningPeak}:00`,
        "Create a 15-minute morning preparation routine",
        "Avoid checking email until after your first focused session"
      ]
    };
  }

  /**
   * Generate general contextual response
   */
  private generateGeneralContextualResponse(question: string, context: any) {
    return {
      answer: `Based on your productivity data (${context.totalSessions} sessions, ${context.avgEnergyLevel}/10 avg energy), you have established good work patterns. Your peak performance hours are ${context.peakHours.join(' and ')}, and ${context.bestIntensity} intensity sessions work best for you.`,
      confidence: 80,
      related_insights: [
        `${context.avgSessionDuration} minutes average session length`,
        `${context.linkedTasks} external tasks tracked`,
        `Primary focus areas: ${context.primaryTaskTypes.join(', ')}`
      ],
      suggested_actions: [
        "Continue building on your existing successful patterns",
        "Consider tracking more specific metrics for deeper insights",
        "Experiment with extending successful session types"
      ]
    };
  }

  /**
   * Helper methods for context analysis
   */
  private findPeakHours(sessions: any[]): number[] {
    if (sessions.length === 0) return [9, 13];
    
    const hourCounts = sessions.reduce((counts, s) => {
      const hour = new Date(s.started_at).getHours();
      counts[hour] = (counts[hour] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([hour]) => parseInt(hour));
  }

  private findBestIntensity(sessions: any[]): string {
    if (sessions.length === 0) return 'moderate';
    
    const intensityPerformance = sessions.reduce((perf, s) => {
      if (!perf[s.intensity]) perf[s.intensity] = [];
      perf[s.intensity].push(s.duration);
      return perf;
    }, {} as Record<string, number[]>);

    let bestIntensity = 'moderate';
    let bestAvgDuration = 0;

    Object.entries(intensityPerformance).forEach(([intensity, durations]) => {
      const avg = (durations as number[]).reduce((sum, d) => sum + d, 0) / (durations as number[]).length;
      if (avg > bestAvgDuration) {
        bestAvgDuration = avg;
        bestIntensity = intensity;
      }
    });

    return bestIntensity;
  }

  private getPrimaryTaskTypes(taskLinks: any[]): string[] {
    if (taskLinks.length === 0) return ['development'];
    
    const typeCounts = taskLinks.reduce((counts, task) => {
      counts[task.task_type] = (counts[task.task_type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([type]) => type.replace('_', ' '));
  }


  /**
   * Generate mock AI response based on question type (legacy fallback)
   */
  private generateMockResponse(question: string, tideName?: string): {
    answer: string;
    confidence: number;
    related_insights: string[];
    suggested_actions: string[];
  } {
    const lowerQuestion = question.toLowerCase();
    
    let response = {
      answer: "Based on your productivity patterns, I'd recommend focusing on structured time management approaches.",
      confidence: 85,
      related_insights: ["Time blocking effectiveness", "Energy level patterns"],
      suggested_actions: ["Implement Pomodoro technique", "Track energy levels"]
    };

    // Customize response based on question content
    if (lowerQuestion.includes('morning') || lowerQuestion.includes('start')) {
      response = {
        answer: "Morning productivity can be significantly improved by establishing a consistent routine. Based on your tide data, I recommend starting with your most challenging tasks when your energy is highest, typically within the first 2-3 hours of your workday.",
        confidence: 92,
        related_insights: ["Peak performance hours: 9-11 AM", "Morning routine consistency boosts focus by 35%"],
        suggested_actions: ["Create a morning routine checklist", "Schedule deep work for 9-11 AM", "Limit email checking in first hour"]
      };
    } else if (lowerQuestion.includes('break') || lowerQuestion.includes('rest')) {
      response = {
        answer: "Optimal break timing follows the ultradian rhythm cycle. I recommend taking a 5-10 minute break every 90-120 minutes of focused work, with a longer 15-30 minute break every 3-4 hours for maximum productivity maintenance.",
        confidence: 88,
        related_insights: ["Break frequency improves sustained attention", "Micro-breaks prevent cognitive fatigue"],
        suggested_actions: ["Set break reminders every 90 minutes", "Take walking breaks when possible", "Practice brief meditation during breaks"]
      };
    } else if (lowerQuestion.includes('focus') || lowerQuestion.includes('distraction')) {
      response = {
        answer: "Maintaining focus requires both environmental control and cognitive strategies. Based on your patterns, I suggest implementing a distraction-free zone during your peak hours and using techniques like the 'two-minute rule' for incoming interruptions.",
        confidence: 87,
        related_insights: ["Interruptions reduce productivity by 23 minutes on average", "Single-tasking improves quality by 40%"],
        suggested_actions: ["Use website blockers during focus time", "Set phone to do-not-disturb", "Batch similar tasks together"]
      };
    } else if (lowerQuestion.includes('priority') || lowerQuestion.includes('urgent')) {
      response = {
        answer: "Effective prioritization uses the Eisenhower Matrix: Important & Urgent (do first), Important & Not Urgent (schedule), Not Important & Urgent (delegate), Not Important & Not Urgent (eliminate). Focus 60-70% of your time on Important & Not Urgent tasks.",
        confidence: 90,
        related_insights: ["Most people spend 60% time on urgent tasks", "Strategic work requires protected time"],
        suggested_actions: ["Review priorities weekly", "Use ABC ranking for daily tasks", "Block time for important non-urgent work"]
      };
    }

    // Add tide-specific context if available
    if (tideName) {
      response.related_insights.push(`Context from your "${tideName}" tide`);
    }

    return response;
  }
}