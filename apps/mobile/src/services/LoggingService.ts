// Centralized logging service replacing scattered console.log patterns

import { APP_CONFIG } from '../constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  code?: string;
  message: string;
  data?: any;
}

class LoggingServiceClass {
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;

  /**
   * Log a message with specified level
   */
  log(level: LogLevel, service: string, message: string, data?: any, code?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      code,
      message,
      data,
    };

    // Add to history
    this.addToHistory(entry);

    // Format and output
    this.outputLog(entry);
  }

  /**
   * Debug level logging
   */
  debug(service: string, message: string, data?: any, code?: string): void {
    this.log('debug', service, message, data, code);
  }

  /**
   * Info level logging
   */
  info(service: string, message: string, data?: any, code?: string): void {
    this.log('info', service, message, data, code);
  }

  /**
   * Warning level logging
   */
  warn(service: string, message: string, data?: any, code?: string): void {
    this.log('warn', service, message, data, code);
  }

  /**
   * Error level logging
   */
  error(service: string, message: string, data?: any, code?: string): void {
    this.log('error', service, message, data, code);
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logHistory.slice(-count);
  }

  /**
   * Get logs filtered by service
   */
  getLogsByService(service: string, count: number = 50): LogEntry[] {
    return this.logHistory
      .filter(entry => entry.service === service)
      .slice(-count);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logHistory
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    if (!APP_CONFIG.logging.enabled) {
      return false;
    }

    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = logLevels[APP_CONFIG.logging.level as keyof typeof logLevels];
    const messageLevel = logLevels[level];

    return messageLevel >= currentLevel;
  }

  /**
   * Add entry to history with size management
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    
    // Trim history if too large
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Output log to console
   */
  private outputLog(entry: LogEntry): void {
    const prefix = entry.code ? `${entry.code}:` : '';
    const logMessage = `[${entry.timestamp}] [${entry.service}] ${prefix} ${entry.message}`;
    
    if (entry.data) {
      console[entry.level](logMessage, entry.data);
    } else {
      console[entry.level](logMessage);
    }
  }
}

// Export singleton instance
export const LoggingService = new LoggingServiceClass();

// Convenience exports for backward compatibility
export const Logger = {
  debug: (service: string, message: string, data?: any, code?: string) => 
    LoggingService.debug(service, message, data, code),
  info: (service: string, message: string, data?: any, code?: string) => 
    LoggingService.info(service, message, data, code),
  warn: (service: string, message: string, data?: any, code?: string) => 
    LoggingService.warn(service, message, data, code),
  error: (service: string, message: string, data?: any, code?: string) => 
    LoggingService.error(service, message, data, code),
};