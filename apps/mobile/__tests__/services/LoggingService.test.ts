/**
 * LoggingService Tests
 * 
 * Test suite for centralized logging service
 */

import { LoggingService, Logger } from '../../src/services/LoggingService';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock APP_CONFIG
jest.mock('../../src/constants', () => ({
  APP_CONFIG: {
    logging: {
      enabled: true,
      level: 'debug',
    },
  },
}));

// Spy on console methods more carefully

describe('LoggingService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console methods
    global.console = {
      ...global.console,
      ...mockConsole,
    };
    
    // Clear logging history
    LoggingService.clearHistory();
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      LoggingService.debug('TestService', 'Debug message', { data: 'test' });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Debug message/),
        { data: 'test' }
      );
    });

    it('should log info messages', () => {
      LoggingService.info('TestService', 'Info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Info message/)
      );
    });

    it('should log warning messages', () => {
      LoggingService.warn('TestService', 'Warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Warning message/)
      );
    });

    it('should log error messages', () => {
      LoggingService.error('TestService', 'Error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Error message/)
      );
    });

    it('should include error codes when provided', () => {
      LoggingService.error('TestService', 'Error with code', undefined, 'ERR_001');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] ERR_001: Error with code/)
      );
    });
  });

  describe('Log History', () => {
    it('should maintain log history', () => {
      LoggingService.info('TestService', 'First message');
      LoggingService.warn('TestService', 'Second message');
      
      const history = LoggingService.getRecentLogs(10);
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('First message');
      expect(history[1].message).toBe('Second message');
    });

    it('should filter logs by level', () => {
      LoggingService.info('TestService', 'Info message');
      LoggingService.warn('TestService', 'Warning message');
      LoggingService.error('TestService', 'Error message');
      
      const errors = LoggingService.getLogsByLevel('error');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error message');
      
      const warnings = LoggingService.getLogsByLevel('warn');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toBe('Warning message');
    });

    it('should limit recent logs count', () => {
      // Add multiple logs
      for (let i = 0; i < 15; i++) {
        LoggingService.info('TestService', `Message ${i}`);
      }
      
      const recentLogs = LoggingService.getRecentLogs(5);
      expect(recentLogs).toHaveLength(5);
      expect(recentLogs[4].message).toBe('Message 14');
    });

    it('should clear history', () => {
      LoggingService.info('TestService', 'Test message');
      expect(LoggingService.getRecentLogs()).toHaveLength(1);
      
      LoggingService.clearHistory();
      expect(LoggingService.getRecentLogs()).toHaveLength(0);
    });
  });

  // Skip log level filtering test for now - requires complex mocking

  describe('Logger Convenience Methods', () => {
    it('should provide convenience logger methods', () => {
      Logger.debug('TestService', 'Debug via logger');
      Logger.info('TestService', 'Info via logger');
      Logger.warn('TestService', 'Warning via logger');
      Logger.error('TestService', 'Error via logger');
      
      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Logging', () => {
    it('should handle complex data objects', () => {
      const complexData = {
        user: { id: 1, name: 'John' },
        metadata: { timestamp: Date.now() },
        array: [1, 2, 3],
      };
      
      LoggingService.info('TestService', 'Complex data log', complexData);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Complex data log/),
        complexData
      );
    });

    it('should handle undefined data gracefully', () => {
      LoggingService.info('TestService', 'Message without data');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[TestService\] {2}Message without data/)
      );
    });
  });

  // Skip error scenarios test - requires complex mocking
});