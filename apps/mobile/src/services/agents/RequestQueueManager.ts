/**
 * Request Queue Manager
 * 
 * Manages offline request queuing and replay for enhanced agent service reliability.
 * Provides persistent storage, priority handling, batch processing, and automatic
 * retry capabilities for when agent connections are unavailable.
 * 
 * Features:
 * - Persistent queue storage with AsyncStorage
 * - Priority-based request ordering
 * - Batch processing for efficiency
 * - Automatic retry with backoff strategies
 * - Queue size limits and cleanup
 * - Comprehensive metrics and monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoggingService } from '../LoggingService';
import { NotificationService } from '../NotificationService';
import type { 
  QueuedRequest, 
  RequestQueueMetrics,
  AgentEvent,
  AgentEventData 
} from '../../types/agents';
import type { 
  QueueConfig,
  RetryPolicy 
} from '../../types/connection';

interface QueueItem extends QueuedRequest {
  attempts: number;
  lastAttempt: Date | null;
  nextRetry: Date | null;
  queuedAt: Date;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
}

interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: Error;
  shouldRetry: boolean;
}

export class RequestQueueManager {
  private serviceName = "RequestQueueManager";
  private config: QueueConfig;
  private queue: QueueItem[] = [];
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private metrics: RequestQueueMetrics = {
    queueSize: 0,
    processedToday: 0,
    failedToday: 0,
    averageProcessingTime: 0
  };
  private eventHandlers: Map<AgentEvent, ((data: AgentEventData) => void)[]> = new Map();
  private persistenceKey: string;

  constructor(config: QueueConfig) {
    this.config = config;
    this.persistenceKey = config.persistenceKey || 'agent_request_queue';
    
    LoggingService.info(
      this.serviceName,
      "Request queue manager initialized",
      { 
        maxSize: config.maxSize,
        persistent: config.persistent,
        enablePriority: config.enablePriority
      },
      "QUEUE_MANAGER_001"
    );
  }

  // ======================== Initialization ========================

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      LoggingService.warn(
        this.serviceName,
        "Request queue manager already initialized",
        {},
        "QUEUE_MANAGER_002"
      );
      return;
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Initializing request queue manager",
        {},
        "QUEUE_MANAGER_003"
      );

      // Load persisted queue if enabled
      if (this.config.persistent) {
        await this.loadPersistedQueue();
      }

      // Start processing interval
      this.startProcessing();

      // Start cleanup interval
      this.startCleanup();

      this.isInitialized = true;
      
      LoggingService.info(
        this.serviceName,
        "Request queue manager initialized successfully",
        { queueSize: this.queue.length },
        "QUEUE_MANAGER_004"
      );

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to initialize request queue manager",
        { error },
        "QUEUE_MANAGER_005"
      );
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    LoggingService.info(
      this.serviceName,
      "Shutting down request queue manager",
      {},
      "QUEUE_MANAGER_006"
    );

    this.isInitialized = false;

    // Stop intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Wait for current processing to complete
    while (this.processing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Persist queue if enabled
    if (this.config.persistent) {
      await this.persistQueue();
    }

    LoggingService.info(
      this.serviceName,
      "Request queue manager shutdown completed",
      {},
      "QUEUE_MANAGER_007"
    );
  }

  // ======================== Queue Operations ========================

  public async enqueue(request: QueuedRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error("Queue manager not initialized");
    }

    // Check queue size limit
    if (this.queue.length >= this.config.maxSize) {
      // Try to make room by removing expired items
      await this.cleanupExpiredItems();
      
      if (this.queue.length >= this.config.maxSize) {
        const error = new Error(`Queue is full (${this.config.maxSize} items)`);
        
        LoggingService.warn(
          this.serviceName,
          "Queue is full - request rejected",
          { 
            queueSize: this.queue.length,
            maxSize: this.config.maxSize,
            requestId: request.id
          },
          "QUEUE_MANAGER_008"
        );
        
        this.emitEvent("queue_full", {
          details: { queueSize: this.queue.length, requestId: request.id }
        });
        
        throw error;
      }
    }

    const queueItem: QueueItem = {
      ...request,
      attempts: 0,
      lastAttempt: null,
      nextRetry: null,
      queuedAt: new Date(),
      status: "pending"
    };

    // Insert based on priority if enabled
    if (this.config.enablePriority) {
      this.insertByPriority(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    // Update metrics
    this.updateMetrics();

    // Persist if enabled
    if (this.config.persistent) {
      await this.persistQueue();
    }

    LoggingService.info(
      this.serviceName,
      "Request queued",
      { 
        requestId: request.id,
        priority: request.priority,
        queueSize: this.queue.length,
        position: this.queue.findIndex(item => item.id === request.id)
      },
      "QUEUE_MANAGER_009"
    );

    this.emitEvent("request_queued", {
      details: { requestId: request.id, queueSize: this.queue.length }
    });

    return request.id;
  }

  private insertByPriority(item: QueueItem): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const itemPriority = priorityOrder[item.priority];
    
    let insertIndex = this.queue.length;
    
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.queue[i].priority];
      if (itemPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, item);
  }

  public async dequeue(requestId: string): Promise<boolean> {
    const index = this.queue.findIndex(item => item.id === requestId);
    
    if (index === -1) {
      return false;
    }

    const item = this.queue[index];
    
    // Don't remove if currently processing
    if (item.status === "processing") {
      LoggingService.warn(
        this.serviceName,
        "Cannot dequeue item currently being processed",
        { requestId },
        "QUEUE_MANAGER_010"
      );
      return false;
    }

    this.queue.splice(index, 1);
    this.updateMetrics();

    // Persist if enabled
    if (this.config.persistent) {
      await this.persistQueue();
    }

    LoggingService.info(
      this.serviceName,
      "Request dequeued",
      { requestId, queueSize: this.queue.length },
      "QUEUE_MANAGER_011"
    );

    return true;
  }

  // ======================== Processing ========================

  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.isInitialized) {
        await this.processQueue();
      }
    }, this.config.processingInterval);

    LoggingService.info(
      this.serviceName,
      "Queue processing started",
      { interval: this.config.processingInterval },
      "QUEUE_MANAGER_012"
    );
  }

  public async processQueue(): Promise<number> {
    if (this.processing || !this.isInitialized) {
      return 0;
    }

    this.processing = true;
    let processedCount = 0;

    try {
      LoggingService.debug(
        this.serviceName,
        "Starting queue processing cycle",
        { queueSize: this.queue.length },
        "QUEUE_MANAGER_013"
      );

      // Get items ready for processing
      const readyItems = this.getReadyItems();
      
      if (readyItems.length === 0) {
        return 0;
      }

      // Process items in batches
      const batches = this.createBatches(readyItems);
      
      for (const batch of batches) {
        const batchResults = await this.processBatch(batch);
        processedCount += batchResults.length;
        
        // Short pause between batches
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update metrics
      this.updateProcessingMetrics(processedCount);

      // Persist queue state if enabled
      if (this.config.persistent && processedCount > 0) {
        await this.persistQueue();
      }

      LoggingService.info(
        this.serviceName,
        "Queue processing cycle completed",
        { 
          processedCount,
          remainingItems: this.queue.filter(item => item.status === "pending").length
        },
        "QUEUE_MANAGER_014"
      );

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Queue processing error",
        { error },
        "QUEUE_MANAGER_015"
      );
    } finally {
      this.processing = false;
    }

    return processedCount;
  }

  private getReadyItems(): QueueItem[] {
    const now = new Date();
    
    return this.queue.filter(item => {
      // Only process pending items
      if (item.status !== "pending") {
        return false;
      }
      
      // Check if item has expired
      const age = now.getTime() - item.queuedAt.getTime();
      if (age > this.config.maxAge) {
        item.status = "expired";
        return false;
      }
      
      // Check if retry time has passed
      if (item.nextRetry && now < item.nextRetry) {
        return false;
      }
      
      // Check retry limits
      if (item.attempts >= item.maxRetries) {
        item.status = "failed";
        return false;
      }
      
      return true;
    });
  }

  private createBatches(items: QueueItem[]): QueueItem[][] {
    const batches: QueueItem[][] = [];
    const batchSize = Math.min(this.config.batchSize, items.length);
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async processBatch(items: QueueItem[]): Promise<QueueItem[]> {
    const startTime = Date.now();
    const processedItems: QueueItem[] = [];
    
    LoggingService.debug(
      this.serviceName,
      "Processing batch",
      { 
        batchSize: items.length,
        items: items.map(item => ({ id: item.id, attempts: item.attempts }))
      },
      "QUEUE_MANAGER_016"
    );

    // Process items in parallel up to max concurrent limit
    const concurrencyLimit = Math.min(this.config.maxConcurrentProcessing, items.length);
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const chunk = items.slice(i, i + concurrencyLimit);
      const chunkPromises = chunk.map(item => this.processItem(item));
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        const item = chunk[index];
        
        if (result.status === 'fulfilled') {
          processedItems.push(item);
        } else {
          LoggingService.error(
            this.serviceName,
            "Item processing failed",
            { 
              requestId: item.id,
              error: result.reason
            },
            "QUEUE_MANAGER_017"
          );
          
          item.status = "failed";
          processedItems.push(item);
        }
      });
    }

    const processingTime = Date.now() - startTime;
    
    LoggingService.debug(
      this.serviceName,
      "Batch processing completed",
      { 
        batchSize: items.length,
        processedCount: processedItems.length,
        processingTime
      },
      "QUEUE_MANAGER_018"
    );

    return processedItems;
  }

  private async processItem(item: QueueItem): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    item.status = "processing";
    item.attempts++;
    item.lastAttempt = new Date();

    LoggingService.debug(
      this.serviceName,
      "Processing queue item",
      { 
        requestId: item.id,
        attempt: item.attempts,
        maxRetries: item.maxRetries,
        method: item.method,
        endpoint: item.endpoint
      },
      "QUEUE_MANAGER_019"
    );

    try {
      // Execute the request
      const result = await this.executeRequest(item);
      
      if (result.success) {
        item.status = "completed";
        
        // Execute callback if provided
        if (item.callback) {
          try {
            item.callback(result.data);
          } catch (callbackError) {
            LoggingService.error(
              this.serviceName,
              "Item callback error",
              { 
                requestId: item.id,
                callbackError
              },
              "QUEUE_MANAGER_020"
            );
          }
        }
        
        LoggingService.info(
          this.serviceName,
          "Queue item processed successfully",
          { 
            requestId: item.id,
            attempt: item.attempts,
            processingTime: Date.now() - startTime
          },
          "QUEUE_MANAGER_021"
        );
        
        this.emitEvent("request_processed", {
          details: { requestId: item.id, success: true }
        });
        
      } else {
        // Handle failure with retry logic
        await this.handleItemFailure(item, result.error);
      }
      
      return result;

    } catch (error) {
      await this.handleItemFailure(item, error as Error);
      
      return {
        success: false,
        error: error as Error,
        shouldRetry: item.attempts < item.maxRetries
      };
    }
  }

  private async executeRequest(item: QueueItem): Promise<ProcessingResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.processingTimeout);
    
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers
        },
        body: item.payload ? JSON.stringify(item.payload) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        shouldRetry: false
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      const shouldRetry = this.shouldRetryError(error as Error);
      
      return {
        success: false,
        error: error as Error,
        shouldRetry
      };
    }
  }

  private async handleItemFailure(item: QueueItem, error: Error): Promise<void> {
    LoggingService.warn(
      this.serviceName,
      "Queue item processing failed",
      { 
        requestId: item.id,
        attempt: item.attempts,
        maxRetries: item.maxRetries,
        error: error.message
      },
      "QUEUE_MANAGER_022"
    );

    if (item.attempts >= item.maxRetries) {
      item.status = "failed";
      
      // Execute callback with error if provided
      if (item.callback) {
        try {
          item.callback(null, error);
        } catch (callbackError) {
          LoggingService.error(
            this.serviceName,
            "Failed item callback error",
            { 
              requestId: item.id,
              callbackError
            },
            "QUEUE_MANAGER_023"
          );
        }
      }
      
      LoggingService.warn(
        this.serviceName,
        "Queue item permanently failed",
        { 
          requestId: item.id,
          totalAttempts: item.attempts
        },
        "QUEUE_MANAGER_024"
      );
    } else {
      // Schedule retry
      const retryDelay = this.calculateRetryDelay(item);
      item.nextRetry = new Date(Date.now() + retryDelay);
      item.status = "pending";
      
      LoggingService.info(
        this.serviceName,
        "Queue item scheduled for retry",
        { 
          requestId: item.id,
          nextRetry: item.nextRetry,
          retryDelay
        },
        "QUEUE_MANAGER_025"
      );
    }
  }

  // ======================== Retry Logic ========================

  private shouldRetryError(error: Error): boolean {
    const retryPolicy = this.config.itemRetryPolicy;
    const errorMessage = error.message.toLowerCase();
    
    // Check non-retryable errors first
    if (retryPolicy.nonRetryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase())
    )) {
      return false;
    }
    
    // Check retryable errors
    if (retryPolicy.retryableErrors.length > 0) {
      return retryPolicy.retryableErrors.some(pattern =>
        errorMessage.includes(pattern.toLowerCase())
      );
    }
    
    // Default to retryable if not explicitly non-retryable
    return true;
  }

  private calculateRetryDelay(item: QueueItem): number {
    const policy = this.config.itemRetryPolicy;
    let delay = policy.initialDelay;
    
    if (policy.exponentialBackoff) {
      delay = policy.initialDelay * Math.pow(policy.backoffMultiplier, item.attempts - 1);
    }
    
    // Apply maximum delay cap
    delay = Math.min(delay, policy.maxDelay);
    
    // Add jitter if enabled
    if (policy.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay;
      delay += jitter;
    }
    
    return Math.floor(delay);
  }

  public async retryFailed(): Promise<number> {
    const failedItems = this.queue.filter(item => item.status === "failed");
    let retriedCount = 0;
    
    for (const item of failedItems) {
      // Reset for retry
      item.status = "pending";
      item.attempts = 0;
      item.nextRetry = null;
      item.lastAttempt = null;
      
      retriedCount++;
    }
    
    if (retriedCount > 0) {
      // Persist changes
      if (this.config.persistent) {
        await this.persistQueue();
      }
      
      LoggingService.info(
        this.serviceName,
        "Failed requests reset for retry",
        { retriedCount },
        "QUEUE_MANAGER_026"
      );
    }
    
    return retriedCount;
  }

  // ======================== Cleanup and Maintenance ========================

  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredItems();
    }, this.config.cleanupInterval);

    LoggingService.info(
      this.serviceName,
      "Queue cleanup started",
      { interval: this.config.cleanupInterval },
      "QUEUE_MANAGER_027"
    );
  }

  private async cleanupExpiredItems(): Promise<number> {
    const now = Date.now();
    const initialCount = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      const age = now - item.queuedAt.getTime();
      
      // Remove expired items
      if (age > this.config.maxAge) {
        LoggingService.debug(
          this.serviceName,
          "Removing expired queue item",
          { 
            requestId: item.id,
            age: Math.floor(age / 1000),
            maxAge: Math.floor(this.config.maxAge / 1000)
          },
          "QUEUE_MANAGER_028"
        );
        return false;
      }
      
      // Remove completed items older than retention period
      if (item.status === "completed" && age > 3600000) { // 1 hour
        return false;
      }
      
      return true;
    });
    
    const cleanedCount = initialCount - this.queue.length;
    
    if (cleanedCount > 0) {
      this.updateMetrics();
      
      if (this.config.persistent) {
        await this.persistQueue();
      }
      
      LoggingService.info(
        this.serviceName,
        "Queue cleanup completed",
        { 
          cleanedCount,
          remainingItems: this.queue.length
        },
        "QUEUE_MANAGER_029"
      );
    }
    
    return cleanedCount;
  }

  public async clear(): Promise<void> {
    // Don't clear items currently being processed
    const processingItems = this.queue.filter(item => item.status === "processing");
    
    this.queue = processingItems;
    this.updateMetrics();
    
    if (this.config.persistent) {
      await this.persistQueue();
    }
    
    LoggingService.info(
      this.serviceName,
      "Queue cleared",
      { remainingProcessingItems: processingItems.length },
      "QUEUE_MANAGER_030"
    );
  }

  // ======================== Persistence ========================

  private async loadPersistedQueue(): Promise<void> {
    if (!this.config.persistent) {
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem(this.persistenceKey);
      
      if (storedData) {
        const parsedQueue = JSON.parse(storedData) as QueueItem[];
        
        // Restore queue with date parsing
        this.queue = parsedQueue.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp),
          queuedAt: new Date(item.queuedAt),
          lastAttempt: item.lastAttempt ? new Date(item.lastAttempt) : null,
          nextRetry: item.nextRetry ? new Date(item.nextRetry) : null
        }));
        
        // Reset processing status on load
        this.queue.forEach(item => {
          if (item.status === "processing") {
            item.status = "pending";
          }
        });
        
        LoggingService.info(
          this.serviceName,
          "Queue loaded from storage",
          { itemCount: this.queue.length },
          "QUEUE_MANAGER_031"
        );
      }
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to load persisted queue",
        { error },
        "QUEUE_MANAGER_032"
      );
      
      // Reset to empty queue on load failure
      this.queue = [];
    }
  }

  private async persistQueue(): Promise<void> {
    if (!this.config.persistent) {
      return;
    }

    try {
      // Limit persisted items to avoid storage bloat
      const itemsToPersist = this.queue.slice(0, this.config.maxPersistentSize || 1000);
      
      await AsyncStorage.setItem(
        this.persistenceKey,
        JSON.stringify(itemsToPersist)
      );
      
      LoggingService.debug(
        this.serviceName,
        "Queue persisted to storage",
        { itemCount: itemsToPersist.length },
        "QUEUE_MANAGER_033"
      );
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to persist queue",
        { error },
        "QUEUE_MANAGER_034"
      );
    }
  }

  // ======================== Metrics and Monitoring ========================

  private updateMetrics(): void {
    this.metrics = {
      queueSize: this.queue.length,
      processedToday: this.calculateProcessedToday(),
      failedToday: this.calculateFailedToday(),
      averageProcessingTime: this.calculateAverageProcessingTime()
    };
  }

  private updateProcessingMetrics(processedCount: number): void {
    this.metrics.processedToday += processedCount;
  }

  private calculateProcessedToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.queue.filter(item => 
      item.status === "completed" && 
      item.lastAttempt && 
      item.lastAttempt >= today
    ).length;
  }

  private calculateFailedToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.queue.filter(item => 
      item.status === "failed" && 
      item.lastAttempt && 
      item.lastAttempt >= today
    ).length;
  }

  private calculateAverageProcessingTime(): number {
    const completedItems = this.queue.filter(item => 
      item.status === "completed" && item.lastAttempt && item.queuedAt
    );
    
    if (completedItems.length === 0) {
      return 0;
    }
    
    const totalTime = completedItems.reduce((sum, item) => {
      return sum + (item.lastAttempt!.getTime() - item.queuedAt.getTime());
    }, 0);
    
    return Math.floor(totalTime / completedItems.length);
  }

  public getMetrics(): RequestQueueMetrics {
    this.updateMetrics();
    
    const oldestPending = this.queue
      .filter(item => item.status === "pending")
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())[0];
    
    return {
      ...this.metrics,
      oldestRequest: oldestPending?.queuedAt
    };
  }

  public getDetailedMetrics() {
    const metrics = this.getMetrics();
    
    const statusCounts = this.queue.reduce((counts, item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const priorityCounts = this.queue.reduce((counts, item) => {
      counts[item.priority] = (counts[item.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      ...metrics,
      statusBreakdown: statusCounts,
      priorityBreakdown: priorityCounts,
      configSnapshot: {
        maxSize: this.config.maxSize,
        batchSize: this.config.batchSize,
        processingInterval: this.config.processingInterval,
        maxConcurrentProcessing: this.config.maxConcurrentProcessing
      }
    };
  }

  // ======================== Event Management ========================

  public on(event: AgentEvent, callback: (data: AgentEventData) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(callback);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private emitEvent(event: AgentEvent, data: Partial<AgentEventData> = {}): void {
    const eventData: AgentEventData = {
      event,
      timestamp: new Date(),
      ...data
    };
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          LoggingService.error(
            this.serviceName,
            "Event handler error",
            { event, error },
            "QUEUE_MANAGER_035"
          );
        }
      });
    }
  }

  // ======================== Configuration Management ========================

  public updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    LoggingService.info(
      this.serviceName,
      "Queue configuration updated",
      { updatedFields: Object.keys(newConfig) },
      "QUEUE_MANAGER_036"
    );
  }

  public getConfig(): QueueConfig {
    return { ...this.config };
  }

  // ======================== Status and Diagnostics ========================

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.processing,
      queueSize: this.queue.length,
      pendingItems: this.queue.filter(item => item.status === "pending").length,
      processingItems: this.queue.filter(item => item.status === "processing").length,
      failedItems: this.queue.filter(item => item.status === "failed").length,
      completedItems: this.queue.filter(item => item.status === "completed").length
    };
  }

  public getQueueItems(status?: string): QueueItem[] {
    if (status) {
      return this.queue.filter(item => item.status === status);
    }
    return [...this.queue];
  }
}