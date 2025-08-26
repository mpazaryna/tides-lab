/**
 * Circuit Breaker
 * 
 * Implementation of the Circuit Breaker pattern for protecting the agent service
 * from cascading failures. Provides automatic failure detection, recovery testing,
 * and service protection with configurable thresholds and timeouts.
 * 
 * Circuit States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures detected, requests blocked, fallback triggered
 * - HALF_OPEN: Testing recovery, limited requests allowed
 * 
 * Features:
 * - Configurable failure rate and response time thresholds
 * - Sliding window for failure rate calculation
 * - Automatic recovery testing after timeout
 * - Slow call detection and handling
 * - Comprehensive metrics and monitoring
 */

import { LoggingService } from '../LoggingService';
import type { 
  CircuitBreakerState,
  CircuitBreakerMetrics,
  AgentEvent,
  AgentEventData 
} from '../../types/agents';
import type { CircuitBreakerConfig } from '../../types/connection';

interface CallResult {
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: Error;
}

interface SlidingWindow {
  calls: CallResult[];
  windowStart: Date;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  slowCalls: number;
}

export class CircuitBreaker {
  private serviceName = "CircuitBreaker";
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = "closed";
  private slidingWindow: SlidingWindow;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private halfOpenCallCount = 0;
  private eventHandlers: Map<AgentEvent, ((data: AgentEventData) => void)[]> = new Map();

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.slidingWindow = this.createSlidingWindow();
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker initialized",
      { 
        failureRateThreshold: config.failureRateThreshold,
        openStateTimeout: config.openStateTimeout,
        slidingWindowSize: config.slidingWindowSize
      },
      "CIRCUIT_BREAKER_001"
    );
  }

  // ======================== Main Circuit Breaker Logic ========================

  public async callThroughCircuit<T>(
    operation: () => Promise<T>,
    operationName = "unknown"
  ): Promise<T> {
    const startTime = Date.now();
    const callId = `call-${startTime}-${Math.random().toString(36).substring(2, 5)}`;
    
    LoggingService.debug(
      this.serviceName,
      "Circuit breaker call initiated",
      { 
        state: this.state,
        operationName,
        callId
      },
      "CIRCUIT_BREAKER_002"
    );

    // Check if call is permitted based on current state
    if (!this.isCallPermitted()) {
      const error = new Error(`Circuit breaker is ${this.state} - call rejected`);
      
      LoggingService.warn(
        this.serviceName,
        "Call rejected by circuit breaker",
        { 
          state: this.state,
          operationName,
          callId,
          nextAttemptTime: this.nextAttemptTime
        },
        "CIRCUIT_BREAKER_003"
      );

      this.emitEvent("circuit_breaker_opened", {
        details: { operationName, callId }
      });

      throw error;
    }

    try {
      // Execute the operation
      const result = await operation();
      const responseTime = Date.now() - startTime;
      
      // Record successful call
      this.recordCall({
        success: true,
        responseTime,
        timestamp: new Date()
      });
      
      LoggingService.debug(
        this.serviceName,
        "Circuit breaker call succeeded",
        { 
          operationName,
          callId,
          responseTime,
          state: this.state
        },
        "CIRCUIT_BREAKER_004"
      );

      // Handle state transitions on success
      this.handleSuccessfulCall();
      
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed call
      this.recordCall({
        success: false,
        responseTime,
        timestamp: new Date(),
        error: error as Error
      });
      
      LoggingService.warn(
        this.serviceName,
        "Circuit breaker call failed",
        { 
          operationName,
          callId,
          responseTime,
          error: (error as Error).message,
          state: this.state
        },
        "CIRCUIT_BREAKER_005"
      );

      // Handle state transitions on failure
      this.handleFailedCall();
      
      throw error;
    }
  }

  // ======================== State Management ========================

  private isCallPermitted(): boolean {
    switch (this.state) {
      case "closed":
        return true;
        
      case "open":
        // Check if we should transition to half-open
        if (this.shouldAttemptReset()) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;
        
      case "half-open":
        // Allow limited calls in half-open state
        return this.halfOpenCallCount < this.config.halfOpenMaxCalls;
        
      default:
        return false;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return true;
    }
    
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  private handleSuccessfulCall(): void {
    this.lastSuccessTime = new Date();
    
    switch (this.state) {
      case "closed":
        // Stay closed - no action needed
        break;
        
      case "half-open":
        this.halfOpenCallCount++;
        
        // Check if we've had enough successful calls to close the circuit
        const metrics = this.getCurrentMetrics();
        if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls || 
            metrics.successCount >= this.config.minimumThroughput) {
          this.transitionToClosed();
        }
        break;
        
      case "open":
        // This shouldn't happen as open state blocks calls
        LoggingService.warn(
          this.serviceName,
          "Successful call in OPEN state - unexpected",
          {},
          "CIRCUIT_BREAKER_006"
        );
        break;
    }
  }

  private handleFailedCall(): void {
    this.lastFailureTime = new Date();
    
    switch (this.state) {
      case "closed":
        // Check if we should open the circuit
        if (this.shouldOpenCircuit()) {
          this.transitionToOpen();
        }
        break;
        
      case "half-open":
        // Failure in half-open state - go back to open
        this.transitionToOpen();
        break;
        
      case "open":
        // Already open - extend the timeout
        this.nextAttemptTime = new Date(Date.now() + this.config.openStateTimeout);
        break;
    }
  }

  private shouldOpenCircuit(): boolean {
    const metrics = this.getCurrentMetrics();
    
    // Check if we have enough calls for meaningful statistics
    if (metrics.totalCalls < this.config.minimumThroughput) {
      return false;
    }
    
    // Check failure rate threshold
    const failureRate = metrics.failedCalls / metrics.totalCalls;
    if (failureRate >= this.config.failureRateThreshold) {
      LoggingService.info(
        this.serviceName,
        "Failure rate threshold exceeded",
        { 
          failureRate: failureRate.toFixed(3),
          threshold: this.config.failureRateThreshold,
          totalCalls: metrics.totalCalls,
          failedCalls: metrics.failedCalls
        },
        "CIRCUIT_BREAKER_007"
      );
      return true;
    }
    
    // Check slow call rate if enabled
    if (this.config.enableSlowCallDetection && this.config.slowCallRateThreshold) {
      const slowCallRate = metrics.slowCalls / metrics.totalCalls;
      if (slowCallRate >= this.config.slowCallRateThreshold) {
        LoggingService.info(
          this.serviceName,
          "Slow call rate threshold exceeded",
          { 
            slowCallRate: slowCallRate.toFixed(3),
            threshold: this.config.slowCallRateThreshold,
            totalCalls: metrics.totalCalls,
            slowCalls: metrics.slowCalls
          },
          "CIRCUIT_BREAKER_008"
        );
        return true;
      }
    }
    
    return false;
  }

  // ======================== State Transitions ========================

  private transitionToClosed(): void {
    const previousState = this.state;
    
    this.state = "closed";
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = null;
    
    // Reset sliding window for fresh start
    this.slidingWindow = this.createSlidingWindow();
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker transitioned to CLOSED",
      { 
        previousState,
        recoveryTime: this.lastSuccessTime 
      },
      "CIRCUIT_BREAKER_009"
    );
    
    this.emitEvent("circuit_breaker_closed", {
      details: { previousState, recoveryTime: this.lastSuccessTime }
    });
  }

  private transitionToOpen(): void {
    const previousState = this.state;
    
    this.state = "open";
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = new Date(Date.now() + this.config.openStateTimeout);
    
    LoggingService.warn(
      this.serviceName,
      "Circuit breaker transitioned to OPEN",
      { 
        previousState,
        nextAttemptTime: this.nextAttemptTime,
        metrics: this.getCurrentMetrics()
      },
      "CIRCUIT_BREAKER_010"
    );
    
    this.emitEvent("circuit_breaker_opened", {
      details: { 
        previousState, 
        nextAttemptTime: this.nextAttemptTime,
        failureRate: this.getCurrentMetrics().failedCalls / Math.max(this.getCurrentMetrics().totalCalls, 1)
      }
    });
  }

  private transitionToHalfOpen(): void {
    const previousState = this.state;
    
    this.state = "half-open";
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = null;
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker transitioned to HALF_OPEN",
      { 
        previousState,
        maxCalls: this.config.halfOpenMaxCalls
      },
      "CIRCUIT_BREAKER_011"
    );
  }

  // ======================== Sliding Window Management ========================

  private createSlidingWindow(): SlidingWindow {
    return {
      calls: [],
      windowStart: new Date(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      slowCalls: 0
    };
  }

  private recordCall(result: CallResult): void {
    this.slidingWindow.calls.push(result);
    this.updateWindowMetrics(result);
    this.maintainWindowSize();
  }

  private updateWindowMetrics(result: CallResult): void {
    this.slidingWindow.totalCalls++;
    
    if (result.success) {
      this.slidingWindow.successfulCalls++;
    } else {
      this.slidingWindow.failedCalls++;
    }
    
    // Check for slow calls if detection is enabled
    if (this.config.enableSlowCallDetection && 
        this.config.slowCallDuration &&
        result.responseTime >= this.config.slowCallDuration) {
      this.slidingWindow.slowCalls++;
    }
  }

  private maintainWindowSize(): void {
    const now = Date.now();
    
    if (this.config.slidingWindowType === "count") {
      // Remove excess calls beyond window size
      if (this.slidingWindow.calls.length > this.config.slidingWindowSize) {
        const removedCalls = this.slidingWindow.calls.splice(
          0, 
          this.slidingWindow.calls.length - this.config.slidingWindowSize
        );
        
        // Update metrics by subtracting removed calls
        removedCalls.forEach(call => {
          this.slidingWindow.totalCalls--;
          if (call.success) {
            this.slidingWindow.successfulCalls--;
          } else {
            this.slidingWindow.failedCalls--;
          }
          
          if (this.config.enableSlowCallDetection && 
              this.config.slowCallDuration &&
              call.responseTime >= this.config.slowCallDuration) {
            this.slidingWindow.slowCalls--;
          }
        });
      }
    } else {
      // Time-based window - remove calls older than window size (in milliseconds)
      const windowStart = now - this.config.slidingWindowSize;
      const validCalls = this.slidingWindow.calls.filter(call => 
        call.timestamp.getTime() >= windowStart
      );
      
      if (validCalls.length !== this.slidingWindow.calls.length) {
        // Recalculate metrics from remaining calls
        this.slidingWindow.calls = validCalls;
        this.recalculateWindowMetrics();
        this.slidingWindow.windowStart = new Date(windowStart);
      }
    }
  }

  private recalculateWindowMetrics(): void {
    this.slidingWindow.totalCalls = this.slidingWindow.calls.length;
    this.slidingWindow.successfulCalls = this.slidingWindow.calls.filter(c => c.success).length;
    this.slidingWindow.failedCalls = this.slidingWindow.calls.filter(c => !c.success).length;
    
    if (this.config.enableSlowCallDetection && this.config.slowCallDuration) {
      this.slidingWindow.slowCalls = this.slidingWindow.calls.filter(c => 
        c.responseTime >= this.config.slowCallDuration!
      ).length;
    }
  }

  // ======================== Metrics and Monitoring ========================

  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.slidingWindow.failedCalls,
      successCount: this.slidingWindow.successfulCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  private getCurrentMetrics() {
    return {
      totalCalls: this.slidingWindow.totalCalls,
      successfulCalls: this.slidingWindow.successfulCalls,
      failedCalls: this.slidingWindow.failedCalls,
      slowCalls: this.slidingWindow.slowCalls
    };
  }

  public getDetailedMetrics() {
    const metrics = this.getCurrentMetrics();
    const failureRate = metrics.totalCalls > 0 ? 
      metrics.failedCalls / metrics.totalCalls : 0;
    const slowCallRate = metrics.totalCalls > 0 ? 
      metrics.slowCalls / metrics.totalCalls : 0;
    
    return {
      state: this.state,
      ...metrics,
      failureRate,
      slowCallRate,
      averageResponseTime: this.calculateAverageResponseTime(),
      windowType: this.config.slidingWindowType,
      windowSize: this.config.slidingWindowSize,
      thresholds: {
        failureRate: this.config.failureRateThreshold,
        slowCallRate: this.config.slowCallRateThreshold,
        minimumThroughput: this.config.minimumThroughput
      },
      timings: {
        lastFailureTime: this.lastFailureTime,
        lastSuccessTime: this.lastSuccessTime,
        nextAttemptTime: this.nextAttemptTime,
        openStateTimeout: this.config.openStateTimeout
      }
    };
  }

  private calculateAverageResponseTime(): number {
    if (this.slidingWindow.calls.length === 0) {
      return 0;
    }
    
    const totalTime = this.slidingWindow.calls.reduce((sum, call) => 
      sum + call.responseTime, 0
    );
    
    return totalTime / this.slidingWindow.calls.length;
  }

  // ======================== State Queries ========================

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public isClosed(): boolean {
    return this.state === "closed";
  }

  public isOpen(): boolean {
    return this.state === "open";
  }

  public isHalfOpen(): boolean {
    return this.state === "half-open";
  }

  public isCallPermittedPublic(): boolean {
    return this.isCallPermitted();
  }

  // ======================== Manual Controls ========================

  public forceOpen(): void {
    const previousState = this.state;
    this.transitionToOpen();
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker manually forced to OPEN",
      { previousState },
      "CIRCUIT_BREAKER_012"
    );
  }

  public forceClosed(): void {
    const previousState = this.state;
    this.transitionToClosed();
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker manually forced to CLOSED",
      { previousState },
      "CIRCUIT_BREAKER_013"
    );
  }

  public reset(): void {
    const previousState = this.state;
    
    this.state = "closed";
    this.slidingWindow = this.createSlidingWindow();
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    this.halfOpenCallCount = 0;
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker reset",
      { previousState },
      "CIRCUIT_BREAKER_014"
    );
  }

  // ======================== Configuration Management ========================

  public updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    LoggingService.info(
      this.serviceName,
      "Circuit breaker configuration updated",
      { 
        changes: Object.keys(newConfig),
        newFailureRateThreshold: this.config.failureRateThreshold,
        newOpenStateTimeout: this.config.openStateTimeout
      },
      "CIRCUIT_BREAKER_015"
    );

    // If window size changed, recreate the sliding window
    if (newConfig.slidingWindowSize && newConfig.slidingWindowSize !== oldConfig.slidingWindowSize) {
      this.slidingWindow = this.createSlidingWindow();
      LoggingService.info(
        this.serviceName,
        "Sliding window recreated due to size change",
        { 
          oldSize: oldConfig.slidingWindowSize,
          newSize: newConfig.slidingWindowSize
        },
        "CIRCUIT_BREAKER_016"
      );
    }
  }

  public getConfig(): CircuitBreakerConfig {
    return { ...this.config };
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
            "CIRCUIT_BREAKER_017"
          );
        }
      });
    }
  }

  // ======================== Exception Handling ========================

  public shouldRecordException(error: Error): boolean {
    const errorName = error.constructor.name;
    const errorMessage = error.message;
    
    // Check if this exception should be ignored
    if (this.config.ignoreExceptions.some(pattern => 
      errorName.includes(pattern) || errorMessage.includes(pattern)
    )) {
      return false;
    }
    
    // Check if this exception should be recorded
    if (this.config.recordExceptions.length === 0) {
      return true; // Record all if no specific list provided
    }
    
    return this.config.recordExceptions.some(pattern =>
      errorName.includes(pattern) || errorMessage.includes(pattern)
    );
  }
}